/**
 * POST /api/public/tickets
 *
 * Endpoint público (sem sessão) para abertura de ticket via portal externo.
 * SD-ADR-001: Service Desk é Defenz-only — companyId nunca vem do body.
 * SD-ADR-006: ator session-less → usuário-sistema portal@defenz.com.br.
 * SD-ADR-007: protocolo gerado atomicamente via TicketSequence.
 *
 * Anti-enumeração: TODA falha de admissão retorna a MESMA resposta 422 genérica.
 * Não usar handleApiError (vazaria campos de validação).
 */

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'
import { publicCreateTicketSchema } from '@/lib/validations/ticket'
import { normalizeCnpj, normalizeEmail } from '@/lib/portal'
import {
  resolveDefenzCompanyId,
  verifyAuthorizedClient,
  getPortalSystemUserId,
  nextTicketProtocol,
} from '@/lib/service-desk-server'
import { createAuditLog } from '@/lib/audit'

/** Retorna uma nova resposta 422 genérica idêntica para TODA falha de admissão (anti-enumeração). */
function generic422(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Nao foi possivel validar seus dados. Confira o CNPJ e o e-mail cadastrado na console.',
    },
    { status: 422 }
  )
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // a. Rate-limit por IP — antes de parsear o body.
  const rl = checkRateLimit(request, 'public-ticket', { limit: 5, windowMs: 60_000 })
  if (rl) return rl

  // b. Parse e validação com schema strict.
  // Em erro de Zod, retorna a MESMA resposta 422 genérica (anti-enumeração).
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return generic422()
  }

  const parsed = publicCreateTicketSchema.safeParse(body)
  if (!parsed.success) {
    return generic422()
  }

  const { cnpj, email, name, subject, description, priority, _hp, _t } = parsed.data

  // c. Anti-bot: honeypot não-vazio, OU `_t` ausente (bot omitindo o campo), OU tempo desde
  // render < 2000ms. O form legítimo sempre envia `_t` (set no mount).
  if ((_hp !== undefined && _hp !== '') || _t === undefined || Date.now() - _t < 2000) {
    return generic422()
  }

  // d. Normaliza CNPJ e e-mail; valida comprimento do CNPJ.
  const cnpjNorm = normalizeCnpj(cnpj)
  const emailNorm = normalizeEmail(email)

  if (cnpjNorm.length !== 14) {
    return generic422()
  }

  try {
    // e. Resolve companyId da Defenz (cacheado por instância serverless).
    const companyId = await resolveDefenzCompanyId()

    // f. Verifica se CNPJ+e-mail corresponde a um AuthorizedClient ativo.
    const v = await verifyAuthorizedClient(cnpjNorm, emailNorm, companyId)
    if (!v.ok || !v.client) {
      return generic422()
    }

    // g. Dedup 60s: idempotência anti-double-click (best-effort; não é defesa anti-spam).
    const sixtySecondsAgo = new Date(Date.now() - 60_000)
    const existing = await db.ticket.findFirst({
      where: {
        companyId,
        requesterEmail: emailNorm,
        client: v.client.clientName,
        subject,
        createdAt: { gt: sixtySecondsAgo },
      },
      select: { protocol: true },
    })

    if (existing?.protocol) {
      return NextResponse.json({ success: true, data: { protocol: existing.protocol } })
    }

    // h. Cria o ticket com ator-sistema.
    const systemUserId = await getPortalSystemUserId()
    const protocol = await nextTicketProtocol(new Date())

    const ticket = await db.ticket.create({
      data: {
        companyId,
        status: 'solicitado',
        source: 'portal',
        client: v.client.clientName,
        subject,
        description: description ?? null,
        priority: priority ?? 'media',
        requester: name,
        requesterEmail: emailNorm,
        protocol,
        createdById: systemUserId,
      },
    })

    // AuditLog session-less: ator-sistema conforme SD-ADR-006.
    await createAuditLog({
      action: 'CREATE',
      entityType: 'Ticket',
      entityId: ticket.id,
      userId: systemUserId,
      userEmail: 'portal@defenz.com.br',
      changes: {
        subject: { from: null, to: subject },
        source: { from: null, to: 'portal' },
        authorizedClientId: { from: null, to: v.client.id },
      },
    })

    // i. Responde só com o protocolo (não expõe o ticket inteiro).
    return NextResponse.json({ success: true, data: { protocol } }, { status: 201 })
  } catch {
    // Falha interna → 422 genérico (não revelar detalhes internos na superfície pública).
    return generic422()
  }
}
