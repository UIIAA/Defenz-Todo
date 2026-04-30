/**
 * Lógica pura de resolução de assignee string → User (FK).
 * Usada pelo backfill (scripts/backfill-assignee.ts) e testável sem DB.
 */

export type ResolveCandidate = {
  id: string
  name: string | null
  email: string
  // createdAt é usado para tie-break determinístico em multi-match
  createdAt: Date
}

export type ResolveOutcome =
  | { kind: 'resolved'; userId: string; multiMatch: boolean }
  | { kind: 'unresolved'; reason: 'no_company' | 'no_assignee' | 'no_match' }

export interface ResolveInput {
  assignee: string | null | undefined
  demandaCompanyId: string | null | undefined
  candidates: ResolveCandidate[]
}

/**
 * Decide se uma demanda legada (apenas com `assignee` string) pode ser
 * resolvida para um User existente.
 *
 * Regras:
 * 1. Sem `assignee` → unresolved (no_assignee).
 * 2. Sem `demandaCompanyId` → unresolved (no_company). Não tentamos lookup
 *    cross-company para evitar falso-positivo via homônimos.
 * 3. Zero candidatos → unresolved (no_match).
 * 4. 1+ candidatos → resolved. Em multi-match, escolhe o `createdAt` mais
 *    antigo (determinístico) e marca `multiMatch: true` para o caller logar.
 *
 * Premissas do caller (não validadas aqui):
 * - Os `candidates` JÁ foram filtrados por `companyId === demandaCompanyId`.
 * - Os `candidates` JÁ foram filtrados por `name === assignee OR email === assignee`.
 * - Em produção a query usa `orderBy: { createdAt: 'asc' }`, mas esta função
 *   não confia nessa ordem — re-ordena defensivamente.
 */
export function resolveAssignee(input: ResolveInput): ResolveOutcome {
  const assignee = input.assignee?.trim() || null
  if (!assignee) {
    return { kind: 'unresolved', reason: 'no_assignee' }
  }
  if (!input.demandaCompanyId) {
    return { kind: 'unresolved', reason: 'no_company' }
  }
  if (input.candidates.length === 0) {
    return { kind: 'unresolved', reason: 'no_match' }
  }

  const sorted = [...input.candidates].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  )
  return {
    kind: 'resolved',
    userId: sorted[0].id,
    multiMatch: sorted.length > 1,
  }
}
