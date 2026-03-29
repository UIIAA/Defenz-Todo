import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    await requireAuth()

    const users = await db.user.findMany({
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
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    })

    // Flatten teams for easier consumption
    const data = users.map((u) => ({
      ...u,
      companyName: u.company?.name || null,
      teamIds: u.teams.map((ut) => ut.team.id),
      teamNames: u.teams.map((ut) => ut.team.name),
      company: undefined,
      teams: undefined,
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
