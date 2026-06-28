/**
 * Funções puras do portal público de abertura de ticket (F2).
 * Sem dependência de DB ou HTTP — testáveis de forma isolada.
 *
 * SD-ADR-006: escrita session-less via usuário-sistema portal@defenz.com.br
 * SD-ADR-007: protocolo gerado atomicamente por TicketSequence
 */

/**
 * Normaliza um CNPJ para apenas dígitos.
 * Remove pontos, barras, hífens e espaços.
 */
export function normalizeCnpj(s: string): string {
  return s.replace(/\D/g, '')
}

/**
 * Normaliza um e-mail: trim + lowercase.
 */
export function normalizeEmail(s: string): string {
  return s.trim().toLowerCase()
}

/**
 * Formata o protocolo do ticket.
 * Formato: SD-<ano>-<seq com zero-pad de 6 dígitos>
 * Exemplo: SD-2026-000123
 */
export function formatProtocol(year: number, seq: number): string {
  return `SD-${year}-${String(seq).padStart(6, '0')}`
}
