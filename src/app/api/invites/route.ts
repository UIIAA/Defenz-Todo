import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import crypto from 'crypto'

export async function GET() {
  try {
    const user = await requireAuth()
    const role = (user as { role?: string }).role || ''

    if (!['admin', 'gerencia'].includes(role)) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      )
    }

    const invites = await db.inviteToken.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: invites,
    })
  } catch (error) {
    console.error('List invites error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Erro ao listar convites' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const role = (user as { role?: string }).role || ''

    if (!['admin', 'gerencia'].includes(role)) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, role: inviteRole } = body

    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const invite = await db.inviteToken.create({
      data: {
        token,
        email: email || null,
        role: inviteRole || 'user',
        expiresAt,
        createdBy: (user as { id: string }).id,
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const inviteUrl = `${baseUrl}/register?token=${token}`

    return NextResponse.json({
      success: true,
      data: {
        ...invite,
        inviteUrl,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Create invite error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Erro ao criar convite' },
      { status: 500 }
    )
  }
}
