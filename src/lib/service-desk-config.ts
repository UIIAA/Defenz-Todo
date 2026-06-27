/**
 * Configuração do Service Desk — constantes sem tabela (YAGNI).
 * Exporta STATUS_ORDER, STATUS_LABELS, WIP_LIMITS, AGING_HOURS e ageColor.
 * Ver feature-service-desk.md §Config e service-desk-GUIA §7.
 */

export const STATUS_ORDER = ['solicitado', 'em_atendimento', 'concluido'] as const
export type TicketStatus = (typeof STATUS_ORDER)[number]

export const STATUS_LABELS: Record<TicketStatus, string> = {
  solicitado: 'Solicitado',
  em_atendimento: 'Em atendimento',
  concluido: 'Concluído',
}

/** Limite WIP por coluna. null = sem limite. */
export const WIP_LIMITS: Record<TicketStatus, number | null> = {
  solicitado: null,
  em_atendimento: 5,
  concluido: null,
}

/** Limiares de aging em horas por coluna. null = não envelhece (Concluído). */
export const AGING_HOURS: Record<TicketStatus, { warn: number; crit: number } | null> = {
  solicitado: { warn: 24, crit: 72 },
  em_atendimento: { warn: 48, crit: 96 },
  concluido: null,
}

export type AgeColor = 'green' | 'amber' | 'black'

/**
 * Retorna a cor de aging do card baseada em quanto tempo o ticket
 * ficou na coluna atual (columnChangedAt até now).
 * - 'green'  → dentro do prazo warn
 * - 'amber'  → entre warn e crit
 * - 'black'  → passou de crit (mais envelhecido)
 *
 * 'Concluído' nunca envelhece → sempre 'green'.
 *
 * Função pura, testável sem React.
 */
export function ageColor(
  status: string,
  columnChangedAt: Date | string | null | undefined,
  now: Date
): AgeColor {
  const thresholds = AGING_HOURS[status as TicketStatus]
  if (!thresholds || !columnChangedAt) return 'green'

  const changed = columnChangedAt instanceof Date ? columnChangedAt : new Date(columnChangedAt)
  if (isNaN(changed.getTime())) return 'green'

  const ageHours = (now.getTime() - changed.getTime()) / (1000 * 60 * 60)
  if (ageHours >= thresholds.crit) return 'black'
  if (ageHours >= thresholds.warn) return 'amber'
  return 'green'
}

/**
 * Retorna a quantidade de dias completos que o ticket está na coluna atual.
 * Retorna 0 se columnChangedAt for nulo.
 */
export function ageDays(columnChangedAt: Date | string | null | undefined, now: Date): number {
  if (!columnChangedAt) return 0
  const changed = columnChangedAt instanceof Date ? columnChangedAt : new Date(columnChangedAt)
  if (isNaN(changed.getTime())) return 0
  return Math.floor((now.getTime() - changed.getTime()) / (1000 * 60 * 60 * 24))
}
