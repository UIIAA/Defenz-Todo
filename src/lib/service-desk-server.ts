/**
 * Helpers do Service Desk que dependem de DB (não são puros).
 * Separados de service-desk.ts (puro, testável sem DB) e tickets-server.ts
 * (puro, sem DB). Consumidos pelas rotas de ticket.
 *
 * SD-ADR-001: Service Desk é Defenz-only.
 * O companyId do tenant sempre é o da empresa 'Defenz' — nunca vem do body.
 */

import { db } from '@/lib/db'
import { ApiError } from '@/lib/api-helpers'

/** Cache em memória por processo/instância (serverless: cold-start resolve 1×/container). */
let _defenzCompanyId: string | null = null

/**
 * Resolve o companyId da empresa 'Defenz' consultando o banco por nome.
 * O resultado é cacheado em memória — um único round-trip por instância serverless.
 *
 * Lança ApiError 500 se a empresa não existir no banco (dado incorreto de seed).
 */
export async function resolveDefenzCompanyId(): Promise<string> {
  if (_defenzCompanyId) return _defenzCompanyId

  const company = await db.company.findFirst({ where: { name: 'Defenz' } })
  if (!company) {
    throw new ApiError('Empresa Defenz não encontrada no banco', 500)
  }
  _defenzCompanyId = company.id
  return _defenzCompanyId
}

/** Expõe reset do cache — usado exclusivamente em testes. */
export function _resetDefenzCompanyIdCache(): void {
  _defenzCompanyId = null
}
