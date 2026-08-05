export type Freshness = 'nunca_verificado' | 'precisa_revisao' | 'verificado'

/**
 * Estado de frescor DERIVADO em runtime — nunca persistido.
 *
 * Compara instantes (`reviewDueAt < now`), não fronteiras de dia: por isso não há
 * questão de fuso horário aqui, ao contrário dos filtros de período do resto do app.
 */
export function freshnessOf(
  p: { verifiedAt: Date | null; reviewDueAt: Date | null },
  now: Date = new Date()
): Freshness {
  if (!p.verifiedAt) return 'nunca_verificado'
  if (p.reviewDueAt && p.reviewDueAt.getTime() < now.getTime()) return 'precisa_revisao'
  return 'verificado'
}

/**
 * Próxima data de revisão. `null` = evergreen (nunca expira, nunca notifica).
 *
 * Usado tanto na CRIAÇÃO quanto no verify — sem o da criação, um POP nunca
 * verificado ficaria invisível ao motor de frescor para sempre.
 */
export function nextReviewDueAt(
  intervalDays: number | null | undefined,
  from: Date = new Date()
): Date | null {
  if (intervalDays == null) return null
  return new Date(from.getTime() + intervalDays * 24 * 60 * 60 * 1000)
}
