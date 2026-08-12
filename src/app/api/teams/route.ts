import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  getCurrentUser,
  accessibleCompanyIds,
  assertCompanyAccess,
  companyScopeWhere,
  resolveActiveCompany,
} from '@/lib/auth'
import { handleApiError, successResponse, createdResponse, ApiError } from '@/lib/api-helpers'

/** Teto de listagem (invariante I5). Folgado: hoje o sistema tem poucas dezenas de equipes. */
const MAX_TEAMS = 500

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    const companyFilter = new URL(request.url).searchParams.get('companyId')

    let where: Record<string, unknown> = {}

    if (user.role === 'admin') {
      // Admin: lista todas, opcionalmente por empresa
      if (companyFilter && companyFilter !== 'all') {
        where = { companyId: companyFilter }
      }
    } else if (user.role === 'gerencia') {
      // Gerencia: lista equipes do seu CONJUNTO de empresas (multi-empresa)
      where = companyScopeWhere(user)
      if (companyFilter && companyFilter !== 'all') {
        const ids = accessibleCompanyIds(user) ?? []
        if (ids.includes(companyFilter)) where = { companyId: companyFilter }
      }
    } else {
      // User: lista apenas suas equipes
      const teamIds = user.teamIds || []
      where = { id: { in: teamIds } }
    }

    const teams = await db.team.findMany({
      take: MAX_TEAMS,
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        companyId: true,
        company: { select: { name: true } },
        _count: { select: { members: true, demandas: true } },
      },
    })

    return successResponse(teams)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    // Somente admin/gerencia podem criar equipes
    if (!['admin', 'gerencia'].includes(user.role)) {
      throw new ApiError('Sem permissao', 403)
    }

    const body = await request.json()
    const { name, companyId } = body as { name?: string; companyId?: string }

    if (!name || !name.trim()) {
      throw new ApiError('Nome da equipe e obrigatorio', 400)
    }

    // Resolve companyId: default = primária; só aceita outra empresa se ∈ conjunto (senão 403)
    const resolvedCompanyId = resolveActiveCompany(user, companyId)

    if (!resolvedCompanyId) {
      throw new ApiError('Empresa nao encontrada', 400)
    }

    const team = await db.team.create({
      data: {
        name: name.trim(),
        companyId: resolvedCompanyId,
      },
      select: {
        id: true,
        name: true,
        companyId: true,
        company: { select: { name: true } },
        _count: { select: { members: true, demandas: true } },
      },
    })

    return createdResponse(team, 'Equipe criada com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    if (!['admin', 'gerencia'].includes(user.role)) {
      throw new ApiError('Sem permissao', 403)
    }

    const body = await request.json()
    const { id, name } = body as { id?: string; name?: string }

    if (!id) throw new ApiError('ID e obrigatorio', 400)
    if (!name || !name.trim()) throw new ApiError('Nome e obrigatorio', 400)

    const existing = await db.team.findUnique({ where: { id } })
    if (!existing) throw new ApiError('Equipe nao encontrada', 404)

    // Gerencia so pode editar equipes do seu conjunto (admin: no-op)
    assertCompanyAccess(existing.companyId, user)

    const team = await db.team.update({
      where: { id },
      data: { name: name.trim() },
      select: {
        id: true,
        name: true,
        companyId: true,
        company: { select: { name: true } },
        _count: { select: { members: true, demandas: true } },
      },
    })

    return successResponse(team, 'Equipe atualizada')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    if (!['admin', 'gerencia'].includes(user.role)) {
      throw new ApiError('Sem permissao', 403)
    }

    const id = new URL(request.url).searchParams.get('id')
    if (!id) throw new ApiError('ID e obrigatorio', 400)

    const existing = await db.team.findUnique({
      where: { id },
      select: { id: true, name: true, companyId: true, _count: { select: { members: true, demandas: true } } },
    })
    if (!existing) throw new ApiError('Equipe nao encontrada', 404)

    // Gerencia so pode deletar equipes do seu conjunto (admin: no-op)
    assertCompanyAccess(existing.companyId, user)

    // Nao permite deletar equipe com membros ou demandas
    if (existing._count.members > 0 || existing._count.demandas > 0) {
      throw new ApiError(
        `Nao e possivel remover equipe com ${existing._count.members} membro(s) e ${existing._count.demandas} demanda(s). Mova-os primeiro.`,
        400
      )
    }

    await db.team.delete({ where: { id } })

    return successResponse(null, 'Equipe removida')
  } catch (error) {
    return handleApiError(error)
  }
}
