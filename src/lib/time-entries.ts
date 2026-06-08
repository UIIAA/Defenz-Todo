// Helpers PUROS do diário de horas (sem dependência de `db`) — usados no relatório
// (aba "Horas") e nos testes. A GRAVAÇÃO do delta (que toca o banco) vive em
// `src/lib/time-entries-server.ts`, para que este módulo seja seguro no bundle do client.
// Ver feature-time-entries.

/** Delta de minutos entre o valor antigo e o novo. Nullish é tratado como 0. */
export function computeDelta(
  oldMinutes: number | null | undefined,
  newMinutes: number | null | undefined
): number {
  return (newMinutes ?? 0) - (oldMinutes ?? 0)
}

/** Soma o campo `minutes` de uma lista de lançamentos (deltas podem ser negativos). */
export function sumMinutes(entries: ReadonlyArray<{ minutes: number }>): number {
  return entries.reduce((acc, e) => acc + (e.minutes ?? 0), 0)
}

/** Agrupa lançamentos por uma chave derivada. O Map preserva a ordem de inserção. */
export function groupBy<T>(
  entries: ReadonlyArray<T>,
  keyFn: (entry: T) => string
): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const entry of entries) {
    const key = keyFn(entry)
    const bucket = map.get(key)
    if (bucket) bucket.push(entry)
    else map.set(key, [entry])
  }
  return map
}
