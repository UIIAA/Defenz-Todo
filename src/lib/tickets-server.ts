/**
 * Service layer do Service Desk — funções puras (sem DB), testáveis.
 * Single source of truth dos timestamps de relógio do ticket e do cálculo de métricas.
 * Ver feature-service-desk.
 */

type TicketState = { status: string; resolvedAt: Date | null }
type TicketPatch = { status?: string }

/**
 * Calcula os timestamps derivados de uma transição de status.
 * - → resolved: grava resolvedAt = now.
 * - resolved → outro (reabrir): limpa resolvedAt.
 * - demais: não toca (retorna {} para spread seguro no update do Prisma).
 */
export function computeTicketTimestamps(
  current: TicketState,
  patch: TicketPatch,
  now: Date
): { resolvedAt?: Date | null } {
  if (patch.status === undefined || patch.status === current.status) return {}
  if (patch.status === 'resolved') return { resolvedAt: now }
  if (current.status === 'resolved') return { resolvedAt: null } // reabriu
  return {}
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

/** Agrega as 5 prioridades do Marcos a partir dos tickets (calendar time puro). */
export function computeServiceDeskMetrics(tickets: MetricTicket[], now: Date): ServiceDeskMetrics {
  const total = tickets.length
  const backlog = tickets.filter((t) => t.status !== 'resolved').length
  const escalated = tickets.filter((t) => t.escalatedAt !== null)
  const escalatedCount = escalated.length
  const totalReplies = tickets.reduce((s, t) => s + (t.replyCount ?? 0), 0)

  const resolved = tickets.filter((t) => t.resolvedAt !== null)
  const avgResolutionMinutes = resolved.length
    ? resolved.reduce((s, t) => s + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) /
      resolved.length /
      60000
    : 0

  const open = tickets.filter((t) => t.status !== 'resolved')
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
