import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, companyScopeWhere } from '@/lib/auth'

/** Teto de listagem (invariante I5). Folgado: hoje o sistema tem poucas dezenas de usuários. */
const MAX_USERS = 500

export async function GET() {
  try {
    const user = await requireAuth()

    // Todos os roles autenticados podem listar colegas das suas empresas.
    // Admin vê todos; gerencia/user veem apenas do seu CONJUNTO de empresas.
    const where = companyScopeWhere(user)

    const users = await db.user.findMany({
      take: MAX_USERS,
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        position: true,
        department: true,
        companyId: true,
        company: { select: { name: true } },
        teams: {
          select: {
            team: { select: { id: true, name: true } },
          },
        },
        userCompanies: { select: { companyId: true } },
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    const data = users.map((u) => ({
      ...u,
      companyName: u.company?.name || null,
      teamIds: u.teams.map((ut) => ut.team.id),
      teamNames: u.teams.map((ut) => ut.team.name),
      companyIds: u.userCompanies.map((uc) => uc.companyId),
      company: undefined,
      teams: undefined,
      userCompanies: undefined,
    }))

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('List users error:', error)
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Erro ao listar usuarios' },
      { status: 500 }
    )
  }
}
