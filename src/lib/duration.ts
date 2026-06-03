// Helpers de duração — conversão entre horas decimais (UI) e minutos (canônico).
// Persistência sempre em minutos (Int); UI digita/exibe em horas decimais pt-BR.

/**
 * Converte uma entrada de horas decimais em minutos inteiros.
 * Aceita "1,5", "1.5", "0.25" ou number. Inválido/negativo/vazio → 0.
 */
export function parseHoursToMinutes(input: string | number | null | undefined): number {
  if (input === null || input === undefined || input === '') return 0
  const normalized =
    typeof input === 'number' ? input : parseFloat(String(input).replace(',', '.'))
  if (!Number.isFinite(normalized) || normalized < 0) return 0
  return Math.round(normalized * 60)
}

/**
 * Formata minutos como rótulo de horas pt-BR: 90 → "1,5h", 120 → "2h", 0 → "0h".
 */
export function minutesToHoursLabel(min: number | null | undefined): string {
  const m = typeof min === 'number' && Number.isFinite(min) && min > 0 ? min : 0
  const hours = Math.round((m / 60) * 100) / 100
  const str = Number.isInteger(hours)
    ? String(hours)
    : hours.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
  return `${str.replace('.', ',')}h`
}

/**
 * Converte minutos em string de horas decimais para preencher um input (separador ".").
 * 0/null/undefined → "" (campo vazio, sem ruído).
 */
export function minutesToHoursInput(min: number | null | undefined): string {
  if (!min || min <= 0) return ''
  const hours = Math.round((min / 60) * 100) / 100
  return Number.isInteger(hours) ? String(hours) : String(hours)
}
