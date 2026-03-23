import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name, token, position } = body

    console.log('Registration attempt:', { email, hasPassword: !!password, name, hasToken: !!token })

    // Invite token is required
    if (!token) {
      return NextResponse.json(
        { error: 'Registro apenas por convite' },
        { status: 403 }
      )
    }

    // Look up the invite token
    const invite = await db.inviteToken.findUnique({
      where: { token },
    })

    if (!invite) {
      return NextResponse.json(
        { error: 'Convite invalido' },
        { status: 403 }
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

    if (invite.email && invite.email.toLowerCase() !== email?.toLowerCase()) {
      return NextResponse.json(
        { error: 'Email nao corresponde ao convite' },
        { status: 403 }
      )
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha sao obrigatorios' },
        { status: 400 }
      )
    }

    const emailNormalized = email.toLowerCase().trim()

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no minimo 6 caracteres' },
        { status: 400 }
      )
    }

    // Check if user already exists (case-insensitive)
    const existingUser = await db.user.findFirst({
      where: { email: { equals: emailNormalized, mode: 'insensitive' } }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ja esta cadastrado' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user with role from invite (email always lowercase)
    const user = await db.user.create({
      data: {
        email: emailNormalized,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: invite.role || 'user',
        position: position || null,
      }
    })

    // Mark token as used
    await db.inviteToken.update({
      where: { id: invite.id },
      data: { usedAt: new Date() },
    })

    console.log('User created successfully:', user.id)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      }
    })
  } catch (error: unknown) {
    console.error('Registration error:', error)

    // Error detail for debugging
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'P2002') {
      return NextResponse.json(
        { error: 'Este email ja esta cadastrado' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Erro ao criar usuario. Tente novamente.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : undefined) : undefined
      },
      { status: 500 }
    )
  }
}
