import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { registerSchema } from '@/lib/validations/password'
import { checkRateLimit } from '@/lib/rate-limit'
import { ZodError } from 'zod'

const GENERIC_ERROR = 'Dados invalidos ou convite indisponivel'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 registrations per IP per hour
    const limited = checkRateLimit(request, 'auth-register', { limit: 3, windowMs: 3600_000 })
    if (limited) return limited

    const body = await request.json()
    const data = registerSchema.parse(body)

    // Look up the invite token
    const invite = await db.inviteToken.findUnique({
      where: { token: data.token },
    })

    if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 403 })
    }

    if (invite.email && invite.email.toLowerCase() !== data.email) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 403 })
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await db.user.findFirst({
      where: { email: { equals: data.email, mode: 'insensitive' } }
    })

    if (existingUser) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(data.password, 12)

    const user = await db.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        name: data.name || data.email.split('@')[0],
        role: invite.role || 'user',
        position: data.position || null,
        companyId: invite.companyId || null,
        department: invite.department || null,
      }
    })

    if (invite.teamIds && invite.teamIds.length > 0) {
      await db.userTeam.createMany({
        data: invite.teamIds.map((teamId) => ({
          userId: user.id,
          teamId,
        })),
      })
    }

    await db.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Dados invalidos',
          details: error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)

    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Erro ao criar usuario. Tente novamente.' },
      { status: 500 }
    )
  }
}
