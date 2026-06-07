/**
 * Status canônicos de uma Demanda (espelha o enum Zod do app Next.js
 * em src/lib/validations/demanda.ts) e o mapeamento coluna→status usado
 * por `move_demanda`.
 */

export const STATUSES = [
  'solicitada',
  'selecionada',
  'em_andamento',
  'concluida',
  'bloqueada',
] as const

export type Status = (typeof STATUSES)[number]

/** Texto de ajuda com as colunas válidas (para descrições e mensagens de erro). */
export const COLUMN_HELP = STATUSES.join(' | ')

/**
 * Normaliza um rótulo de coluna: minúsculas, sem acento, sem espaços nas pontas,
 * espaços/hífens internos viram `_`.
 */
function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove diacríticos (combining marks)
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, '_')
}

/** Sinônimos (já normalizados) → status canônico. */
const SYNONYMS: Record<string, Status> = {
  // solicitada
  solicitada: 'solicitada',
  solicitadas: 'solicitada',
  solicitado: 'solicitada',
  backlog: 'solicitada',
  // selecionada
  selecionada: 'selecionada',
  selecionadas: 'selecionada',
  selecionado: 'selecionada',
  a_fazer: 'selecionada',
  todo: 'selecionada',
  to_do: 'selecionada',
  // em_andamento
  em_andamento: 'em_andamento',
  andamento: 'em_andamento',
  em_progresso: 'em_andamento',
  fazendo: 'em_andamento',
  doing: 'em_andamento',
  in_progress: 'em_andamento',
  // concluida
  concluida: 'concluida',
  concluidas: 'concluida',
  concluido: 'concluida',
  finalizada: 'concluida',
  feito: 'concluida',
  done: 'concluida',
  // bloqueada
  bloqueada: 'bloqueada',
  bloqueadas: 'bloqueada',
  bloqueado: 'bloqueada',
  blocked: 'bloqueada',
}

/**
 * Resolve um nome de coluna humano (ou um status canônico) para o status canônico.
 * Lança erro acionável (listando as colunas válidas) se não reconhecer.
 */
export function resolveStatus(column: string): Status {
  const key = normalize(column)
  const status = SYNONYMS[key]
  if (!status) {
    throw new Error(
      `Coluna desconhecida: "${column}". Colunas válidas: ${COLUMN_HELP} ` +
        `(também aceito rótulos como "Em Andamento", "Concluída", "Bloqueada").`
    )
  }
  return status
}
