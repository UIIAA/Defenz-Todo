/**
 * Helpers do Service Desk que dependem de DB (não são puros).
 * Separados de service-desk.ts (puro, testável sem DB) e tickets-server.ts
 * (puro, sem DB). Consumidos pelas rotas de ticket.
 *
 * SD-ADR-001: Service Desk é Defenz-only.
 * O companyId do tenant sempre é o da empresa 'Defenz' — nunca vem do body.
 *
 * SD-ADR-006: escrita session-less via usuário-sistema portal@defenz.com.br
 * SD-ADR-007: protocolo gerado atomicamente por TicketSequence
 */

import { db } from '@/lib/db'
import { ApiError } from '@/lib/api-helpers'
import { normalizeCnpj, normalizeEmail, formatProtocol } from '@/lib/portal'

// ─── resolveDefenzCompanyId ───────────────────────────────────────────────────

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

// ─── getPortalSystemUserId ────────────────────────────────────────────────────

/** Cache em memória para o ID do usuário-sistema do portal. */
let _portalSystemUserId: string | null = null

/**
 * Retorna o ID do usuário-sistema do portal (portal@defenz.com.br).
 * Cacheado por instância serverless. Lança ApiError 500 se ausente.
 *
 * SD-ADR-006: satisfaz NOT NULL em createdById e AuditLog.userId sem tornar
 * o schema nullable — mantém integridade referencial.
 */
export async function getPortalSystemUserId(): Promise<string> {
  if (_portalSystemUserId) return _portalSystemUserId

  const user = await db.user.findUnique({
    where: { email: 'portal@defenz.com.br' },
    select: { id: true },
  })
  if (!user) {
    throw new ApiError(
      'Usuário-sistema portal@defenz.com.br não encontrado. Execute o seed do portal.',
      500
    )
  }
  _portalSystemUserId = user.id
  return _portalSystemUserId
}

/** Expõe reset do cache — usado exclusivamente em testes. */
export function _resetPortalSystemUserIdCache(): void {
  _portalSystemUserId = null
}

// ─── verifyAuthorizedClient ───────────────────────────────────────────────────

export interface VerifyAuthorizedClientResult {
  ok: boolean
  client?: {
    id: string
    clientName: string
    cnpj: string
    email: string
  }
}

/**
 * Verifica se o par CNPJ+e-mail corresponde a um AuthorizedClient ativo
 * da empresa especificada.
 *
 * Normaliza CNPJ (só dígitos) e e-mail (lowercase/trim) antes da query.
 * Retorna { ok: false } para qualquer ausência — sem distinguir "não existe"
 * de "inativo" (anti-enumeração).
 *
 * @param cnpj     CNPJ bruto (com ou sem máscara)
 * @param email    E-mail bruto
 * @param companyId ID da empresa (sempre Defenz)
 */
export async function verifyAuthorizedClient(
  cnpj: string,
  email: string,
  companyId: string
): Promise<VerifyAuthorizedClientResult> {
  const normalizedCnpj = normalizeCnpj(cnpj)
  const normalizedEmail = normalizeEmail(email)

  const client = await db.authorizedClient.findFirst({
    where: {
      cnpj: normalizedCnpj,
      email: normalizedEmail,
      active: true,
      companyId,
    },
    select: {
      id: true,
      clientName: true,
      cnpj: true,
      email: true,
    },
  })

  if (!client) return { ok: false }
  return { ok: true, client }
}

// ─── nextTicketProtocol ───────────────────────────────────────────────────────

/**
 * Gera o próximo protocolo de ticket de forma ATÔMICA usando TicketSequence.
 *
 * SD-ADR-007: nunca usa count(*)+1 — usa upsert + update dentro de uma
 * db.$transaction para garantir unicidade mesmo sob submits concorrentes.
 *
 * @param now Instante de referência (injetável para testes)
 * @returns string no formato SD-<ano>-<seq com zero-pad de 6 dígitos>
 */
export async function nextTicketProtocol(now: Date = new Date()): Promise<string> {
  const year = now.getUTCFullYear()

  const result = await db.$transaction(async (tx) => {
    // Garante que a linha do ano existe, depois incrementa atomicamente.
    await tx.ticketSequence.upsert({
      where: { year },
      create: { year, lastSeq: 0 },
      update: {}, // noop — só garante existência
    })

    const updated = await tx.ticketSequence.update({
      where: { year },
      data: { lastSeq: { increment: 1 } },
      select: { lastSeq: true },
    })

    return updated.lastSeq
  })

  return formatProtocol(year, result)
}
