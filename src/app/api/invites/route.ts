import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, isAdmin, accessibleCompanyIds, companyScopeWhere } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import crypto from 'crypto'

/** Teto de listagem (invariante I5). Folgado: hoje o sistema tem poucas dezenas de convites. */
const MAX_INVITES = 500

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

    // Escopo por CONJUNTO de empresas (admin → {}; demais → companyId ∈ conjunto)
    const where = companyScopeWhere(user)

    const invites = await db.inviteToken.findMany({
      take: MAX_INVITES,
      where,
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
    const { email, role: inviteRole, companyId, teamIds, department } = body

    const token = crypto.randomUUID()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    // companyId: admin pode especificar; gerencia pode escolher uma empresa do seu
    // conjunto (senão usa a primária). Inline (sem throw) p/ não virar 500 no catch manual.
    const allowed = accessibleCompanyIds(user) // null = admin
    const resolvedCompanyId =
      allowed === null
        ? companyId || user.companyId || null
        : companyId && allowed.includes(companyId)
          ? companyId
          : user.companyId || null

    if (!resolvedCompanyId && !isAdmin(user)) {
      return NextResponse.json(
        { error: 'Usuario sem empresa nao pode criar convites' },
        { status: 403 }
      )
    }

    const invite = await db.inviteToken.create({
      data: {
        token,
        email: email || null,
        role: inviteRole || 'user',
        companyId: resolvedCompanyId,
        teamIds: teamIds || [],
        department: department || null,
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

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth()
    const role = (user as { role?: string }).role || ''

    if (!['admin', 'gerencia'].includes(role)) {
      return NextResponse.json(
        { error: 'Acesso restrito a administradores' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'ID e obrigatorio' }, { status: 400 })
    }

    const invite = await db.inviteToken.findUnique({ where: { id } })
    if (!invite) {
      return NextResponse.json({ error: 'Convite nao encontrado' }, { status: 404 })
    }

    // Escopo por conjunto. Inline (sem throw) p/ devolver 403 direto (catch manual → 500).
    const allowed = accessibleCompanyIds(user) // null = admin
    if (allowed !== null && (!invite.companyId || !allowed.includes(invite.companyId))) {
      return NextResponse.json(
        { error: 'Acesso negado: convite de outra empresa' },
        { status: 403 }
      )
    }

    // Only pending invites can be revoked
    if (invite.usedAt || new Date(invite.expiresAt) < new Date()) {
      return NextResponse.json(
        { error: 'Apenas convites pendentes podem ser revogados' },
        { status: 400 }
      )
    }

    await db.inviteToken.delete({ where: { id } })

    await createAuditLog({
      action: 'DELETE',
      entityType: 'InviteToken',
      entityId: id,
      userId: (user as { id: string }).id,
      userEmail: (user as { email: string }).email,
      changes: { email: { from: invite.email, to: null } },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Revoke invite error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Erro ao revogar convite' },
      { status: 500 }
    )
  }
}
