// ─────────────────────────────────────────────────────────────────────────────
// NUMERAÇÃO · DFZ-<ano>-<seq> (feature-portal-proposta.md §8)
//
// ⚠️ O contador NÃO zera na virada do ano. O ano é rótulo; o número é único e
// monotônico para sempre. Zerar produziria `DFZ-2027-01986` colidindo em
// significado com o de 2026 e quebraria justamente o "para termos controle".
// Por isso a sequência é UMA linha só (id=1), não uma por ano como no
// TicketSequence do Service Desk.
//
// Reserva atômica no mesmo padrão já provado do Service Desk (SD-ADR-007):
// upsert + update dentro de transação, nunca count(*)+1.
// ─────────────────────────────────────────────────────────────────────────────

import { db } from '@/lib/db'

/** Primeira emissão, definida pelo Marcos. */
export const PRIMEIRA_SEQUENCIA = 1986
const SEQUENCE_ID = 1

/** `DFZ-2026-01986`. Mínimo de 5 dígitos; acima disso o número só cresce. */
export function formatarCodigo(ano: number, seq: number): string {
  return `DFZ-${ano}-${String(seq).padStart(5, '0')}`
}

/**
 * Reserva o próximo código de proposta.
 *
 * Dois cliques simultâneos recebem números diferentes: o `increment` acontece
 * no banco, dentro da transação, não em memória do lambda.
 */
export async function nextPropostaCodigo(ano: number): Promise<string> {
  const seq = await db.$transaction(async (tx) => {
    await tx.propostaSequence.upsert({
      where: { id: SEQUENCE_ID },
      create: { id: SEQUENCE_ID, lastSeq: PRIMEIRA_SEQUENCIA - 1 },
      update: {}, // noop — só garante a existência da linha
    })

    const atualizado = await tx.propostaSequence.update({
      where: { id: SEQUENCE_ID },
      data: { lastSeq: { increment: 1 } },
      select: { lastSeq: true },
    })

    return atualizado.lastSeq
  })

  return formatarCodigo(ano, seq)
}
