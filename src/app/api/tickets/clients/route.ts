import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, assertCompanyAccess } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-helpers'
import { resolveDefenzCompanyId } from '@/lib/service-desk-server'

/** Cap de itens retornados para evitar payloads excessivos no datalist. */
const CAP = 200

/**
 * GET /api/tickets/clients
 *
 * Retorna lista DISTINCT de nomes de cliente já usados em Demanda e Ticket
 * no escopo da empresa do ator. Usada para alimentar datalist/autocomplete
 * no formulário de criação de ticket.
 *
 * Invariantes (§9 GUIA):
 * - Tenant isolation: companyScopeWhere filtra por empresa.
 * - take/cap: no máximo CAP itens (200).
 * - Queries determinísticas: ordenado alfabeticamente.
 * - Somente strings não-nulas e não-vazias são incluídas.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveActor(request)
    // SD-ADR-001: Service Desk é Defenz-only. Gate de acesso + escopo FIXO Defenz
    // (não usar companyScopeWhere — admin veria clientes de todas as empresas).
    const defenzId = await resolveDefenzCompanyId()
    assertCompanyAccess(defenzId, user)
    const scope = { companyId: defenzId }

    // Busca valores DISTINCT de client em Demanda e Ticket em paralelo.
    // Prisma suporta `distinct` com `select` para extrair campo único.
    const [demandaRows, ticketRows] = await Promise.all([
      db.demanda.findMany({
        where: { ...scope, client: { not: null } },
        select: { client: true },
        distinct: ['client'],
        orderBy: { client: 'asc' },
        take: CAP,
      }),
      db.ticket.findMany({
        where: { ...scope, client: { not: null } },
        select: { client: true },
        distinct: ['client'],
        orderBy: { client: 'asc' },
        take: CAP,
      }),
    ])

    // Combina, deduplica e ordena os clientes das duas fontes.
    const clientSet = new Set<string>()
    for (const row of demandaRows) {
      if (row.client && row.client.trim() !== '') clientSet.add(row.client.trim())
    }
    for (const row of ticketRows) {
      if (row.client && row.client.trim()) clientSet.add(row.client.trim())
    }

    const clients = Array.from(clientSet).sort().slice(0, CAP)
    const capped = clientSet.size > CAP

    return successResponse({ clients, capped })
  } catch (error) {
    return handleApiError(error)
  }
}
