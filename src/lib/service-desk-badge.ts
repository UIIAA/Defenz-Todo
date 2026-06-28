/**
 * Helper puro para o badge "N novos" do Service Desk.
 * Sem dependencias de browser — testavel em Node/Vitest.
 */

export interface TicketWithCreatedAt {
  createdAt: string | Date
}

/**
 * Conta quantos tickets foram criados DEPOIS de `lastSeen`.
 *
 * @param tickets  Lista de tickets (basta ter `createdAt`)
 * @param lastSeen Timestamp ISO do ultimo acesso (de localStorage), ou null/undefined
 *                 se o usuario nunca abriu a pagina. Quando null, retorna 0 (sem baseline).
 */
export function contarNovos(
  tickets: TicketWithCreatedAt[],
  lastSeen: string | null | undefined,
): number {
  if (!lastSeen) return 0
  const since = new Date(lastSeen).getTime()
  if (isNaN(since)) return 0
  return tickets.filter((t) => new Date(t.createdAt).getTime() > since).length
}
