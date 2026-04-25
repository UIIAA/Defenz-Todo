import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const limited = checkRateLimit(request, 'invite-validate', { limit: 10, windowMs: 60_000 })
    if (limited) return limited

    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token obrigatorio' },
        { status: 400 }
      )
    }

    const invite = await db.inviteToken.findUnique({
      where: { token },
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Convite invalido' },
        { status: 404 }
      )
    }

    if (invite.usedAt) {
      return NextResponse.json(
        { error: 'Convite ja utilizado' },
        { status: 403 }
      )
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Convite expirado' },
        { status: 403 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        email: invite.email,
        role: invite.role,
      },
    })
  } catch (error) {
    console.error('Invite validation error:', error)
    return NextResponse.json(
      { error: 'Erro ao validar convite' },
      { status: 500 }
    )
  }
}
