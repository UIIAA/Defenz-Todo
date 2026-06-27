/**
 * Service layer do Service Desk — funções puras (sem DB), testáveis.
 * Single source of truth dos timestamps de relógio do ticket e do cálculo de métricas.
 * Ver feature-service-desk e service-desk-GUIA §7.
 *
 * Status canônico v2: solicitado | em_atendimento | concluido
 * (migrado de open | paused | resolved — ver GUIA §7 migração)
 */

type TicketState = { status: string; resolvedAt: Date | null }
type TicketPatch = { status?: string }

/**
 * Calcula os timestamps derivados de uma transição de status.
 * - Toda troca de status: seta columnChangedAt = now
 * - → concluido: seta resolvedAt = now + columnChangedAt = now
 * - concluido → outro (reabrir): limpa resolvedAt; seta columnChangedAt = now
 * - status igual ou sem mudança: retorna {} (spread seguro no Prisma update)
 * - firstReplyAt: NUNCA tocado aqui (inalterado; gravado na 1ª reply)
 */
export function computeTicketTimestamps(
  current: TicketState,
  patch: TicketPatch,
  now: Date
): { resolvedAt?: Date | null; columnChangedAt?: Date } {
  if (patch.status === undefined || patch.status === current.status) return {}

  // Toda troca de coluna sempre seta columnChangedAt
  if (patch.status === 'concluido') {
    return { resolvedAt: now, columnChangedAt: now }
  }
  if (current.status === 'concluido') {
    // reabriu — limpa resolvedAt, seta columnChangedAt
    return { resolvedAt: null, columnChangedAt: now }
  }
  // qualquer outra troca de coluna (solicitado ↔ em_atendimento)
  return { columnChangedAt: now }
}

export type MetricTicket = {
  id: string
  status: string
  createdAt: Date
  resolvedAt: Date | null
  escalatedAt: Date | null
  escalatedTo: string | null
  replyCount: number
}

export type ServiceDeskMetrics = {
  total: number
  backlog: number
  escalatedCount: number
  escalatedPct: number
  avgRepliesPerTicket: number
  avgResolutionMinutes: number
  avgOpenAgeMinutes: number
  escalatedByPartner: { partner: string; count: number }[]
}

/** Agrega as 5 prioridades do Marcos a partir dos tickets (calendar time puro).
 * backlog = status !== 'concluido' (v2; era !== 'resolved')
 */
export function computeServiceDeskMetrics(tickets: MetricTicket[], now: Date): ServiceDeskMetrics {
  const total = tickets.length
  const backlog = tickets.filter((t) => t.status !== 'concluido').length
  const escalated = tickets.filter((t) => t.escalatedAt !== null)
  const escalatedCount = escalated.length
  const totalReplies = tickets.reduce((s, t) => s + (t.replyCount ?? 0), 0)

  const resolved = tickets.filter((t) => t.resolvedAt !== null)
  const avgResolutionMinutes = resolved.length
    ? resolved.reduce((s, t) => s + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) /
      resolved.length /
      60000
    : 0

  const open = tickets.filter((t) => t.status !== 'concluido')
  const avgOpenAgeMinutes = open.length
    ? open.reduce((s, t) => s + (now.getTime() - t.createdAt.getTime()), 0) / open.length / 60000
    : 0

  const byPartner = new Map<string, number>()
  for (const t of escalated) {
    const k = t.escalatedTo ?? '(não informado)'
    byPartner.set(k, (byPartner.get(k) ?? 0) + 1)
  }
  const escalatedByPartner = [...byPartner.entries()]
    .map(([partner, count]) => ({ partner, count }))
    .sort((a, b) => b.count - a.count)

  return {
    total,
    backlog,
    escalatedCount,
    escalatedPct: total ? (escalatedCount / total) * 100 : 0,
    avgRepliesPerTicket: total ? totalReplies / total : 0,
    avgResolutionMinutes,
    avgOpenAgeMinutes,
    escalatedByPartner,
  }
}
