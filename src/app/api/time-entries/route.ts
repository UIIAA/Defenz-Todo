import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, isAdmin, companyScopeWhere, accessibleCompanyIds } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'

// Leitura do diário de horas (aba "Horas"). Read-only, sem CRUD manual.
// Escopo de tenant POR CONJUNTO via a demanda relacionada; admin vê tudo. Ver feature-time-entries.

const MAX_ENTRIES = 5000

// "YYYY-MM-DD" → limites de dia em America/Sao_Paulo (UTC-3, sem DST desde 2019), para o
// filtro de período não misatribuir lançamentos da noite (que cairiam no dia UTC seguinte).
// ISO completo é respeitado como veio.
const SP_OFFSET = '-03:00'
function dayStart(s: string): Date {
  return s.length === 10 ? new Date(`${s}T00:00:00.000${SP_OFFSET}`) : new Date(s)
}
function dayEnd(s: string): Date {
  return s.length === 10 ? new Date(`${s}T23:59:59.999${SP_OFFSET}`) : new Date(s)
}

export async function GET(request: NextRequest) {
  try {
    const user = await resolveActor(request)
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    // Relatório de horas é exclusivo de admin e gerência.
    if (user.role !== 'admin' && user.role !== 'gerencia') {
      throw new ApiError('Sem permissao', 403)
    }

    const params = new URL(request.url).searchParams
    const from = params.get('from')
    const to = params.get('to')
    const clientFilter = params.get('client')
    const companyFilter = params.get('companyId')
    const teamFilter = params.get('teamId')
    const userFilter = params.get('userId')

    // Escopo via a demanda relacionada (admin → {} = vê tudo; demais → conjunto de empresas).
    const demandaWhere: Record<string, unknown> = isAdmin(user) ? {} : { ...companyScopeWhere(user) }

    // Filtro por empresa: admin estreita livremente; gerência só DENTRO do seu conjunto
    // (companyId fora do conjunto é IGNORADO — nunca escapa o escopo).
    if (companyFilter && companyFilter !== 'all') {
      if (isAdmin(user)) {
        demandaWhere.companyId = companyFilter
      } else {
        const ids = accessibleCompanyIds(user) ?? []
        if (ids.includes(companyFilter)) demandaWhere.companyId = companyFilter
      }
    }
    if (teamFilter && teamFilter !== 'all') {
      demandaWhere.teamId = teamFilter
    }

    const where: Record<string, unknown> = {}
    if (Object.keys(demandaWhere).length > 0) {
      where.demanda = { is: demandaWhere }
    }
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: dayStart(from) } : {}),
        ...(to ? { lte: dayEnd(to) } : {}),
      }
    }
    if (clientFilter && clientFilter !== 'all') {
      where.client = clientFilter === '__none__' ? null : clientFilter
    }
    if (userFilter && userFilter !== 'all') {
      where.userId = userFilter
    }

    const rows = await db.timeEntry.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: MAX_ENTRIES + 1,
      include: {
        demanda: {
          select: { id: true, title: true, teamId: true, classification: true, companyId: true },
        },
      },
    })

    const capped = rows.length > MAX_ENTRIES
    if (capped) {
      console.warn(
        `[time-entries] resultado truncado em ${MAX_ENTRIES} lançamentos — refine o filtro de período`
      )
    }
    const entries = capped ? rows.slice(0, MAX_ENTRIES) : rows

    return successResponse({ entries, capped })
  } catch (error) {
    return handleApiError(error)
  }
}
