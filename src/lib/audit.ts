import { db } from '@/lib/db'

interface CreateAuditLogParams {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'ESCALATE' | 'LINK'
  entityType: string
  entityId: string
  userId: string
  userEmail: string
  changes?: Record<string, { from: unknown; to: unknown }> | null
}

export async function createAuditLog({
  action,
  entityType,
  entityId,
  userId,
  userEmail,
  changes
}: CreateAuditLogParams) {
  try {
    return await db.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        userEmail,
        changes: changes ? JSON.stringify(changes) : null
      }
    })
  } catch (err) {
    console.error('Audit log failed:', err)
  }
}

/**
 * Compara `before` com `after` nos campos pedidos e devolve só o que mudou.
 *
 * ⚠️ **Campo ausente de `after` significa "não mexa", não "apague".**
 * Num PUT parcial o payload traz só o que o usuário quis mudar. Antes desta
 * regra, `after[campo]` vinha `undefined`, virava `''` na comparação, e o log
 * registrava `{ from: 'Leonardo', to: null }` — uma troca de responsável que
 * nunca aconteceu. Afetava o MCP (`move_demanda`, `update_demanda`) e qualquer
 * curl parcial, e sujava a trilha de auditoria justamente onde ela é usada para
 * responder "quem mudou isso?".
 *
 * A distinção é pela **presença da chave**, não pelo valor: mandar
 * `{ assignee: null }` de propósito é limpar o campo, é mudança real, e continua
 * sendo registrado. Passar o objeto completo (como fazem as rotas que já
 * carregam a entidade atualizada) segue funcionando igual.
 */
export function diffChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[]
): Record<string, { from: unknown; to: unknown }> | null {
  const changes: Record<string, { from: unknown; to: unknown }> = {}

  for (const field of fields) {
    // Chave ausente OU `undefined` explícito = o caller não está tocando neste campo.
    if (!(field in after) || after[field] === undefined) continue

    const fromVal = before[field]
    const toVal = after[field]
    if (String(fromVal ?? '') !== String(toVal ?? '')) {
      changes[field] = { from: fromVal ?? null, to: toVal ?? null }
    }
  }

  return Object.keys(changes).length > 0 ? changes : null
}
