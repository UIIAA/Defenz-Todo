import { db } from '@/lib/db'

/**
 * Grava um lançamento (delta) no diário de horas (`TimeEntry`).
 *
 * Append-only e derivado: NÃO altera `spentMinutes` do card/subtarefa (que segue de livre
 * edição e é a fonte da verdade). Atribui ao **Responsável** do card (`assignedToId`),
 * com fallback para o **editor** (ator) quando o card não tem responsável. `userName` e
 * `client` são gravados como **snapshot** (resilientes a mudanças/exclusões futuras).
 *
 * Delta 0 → não grava. Ver feature-time-entries.
 */
export async function logTimeDelta(opts: {
  demanda: {
    id: string
    assignedToId: string | null
    assignee: string | null
    client: string | null
  }
  delta: number
  source: 'card' | 'subtask' | 'seed'
  actor: { id: string; name?: string | null; email?: string | null }
  subtaskId?: string | null
}): Promise<void> {
  if (!opts.delta) return // delta 0 → nada a registrar

  const { demanda, actor } = opts
  const editorName = actor.name ?? actor.email ?? 'Desconhecido'
  const hasResponsavel = !!demanda.assignedToId

  const userId = hasResponsavel ? demanda.assignedToId : actor.id
  // Com Responsável: nome = snapshot do assignee. Se o snapshot estiver vazio (raro,
  // assignee é auto-populado), usa "(sem nome)" — NUNCA o nome do editor, p/ não atribuir
  // o editor ao userId do Responsável. Sem Responsável: o lançamento é do próprio editor.
  const userName = hasResponsavel ? (demanda.assignee ?? '(sem nome)') : editorName

  await db.timeEntry.create({
    data: {
      demandaId: demanda.id,
      userId,
      userName,
      minutes: opts.delta,
      client: demanda.client ?? null,
      source: opts.source,
      subtaskId: opts.subtaskId ?? null,
      createdById: actor.id,
    },
  })
}
