const TZ = 'America/Sao_Paulo'
const SP_OFFSET = '-03:00' // Brasil aboliu DST em 2019 — offset fixo

/**
 * Parseia input de data-only (YYYY-MM-DD) como meia-noite de São Paulo.
 * ISO completo (com T) é passado direto para `new Date()`.
 *
 * Fix para bug onde `new Date("2026-04-13")` era interpretado como UTC,
 * perdendo 1 dia ao renderizar em America/Sao_Paulo.
 */
export function parseLocalDate(
  input: string | Date | null | undefined
): Date | null {
  if (!input) return null
  if (input instanceof Date) return input
  if (typeof input !== 'string' || input.trim() === '') return null

  // Date-only (YYYY-MM-DD) → interpreta como meia-noite SP
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T00:00:00${SP_OFFSET}`)
  }

  // ISO completo ou outro formato — passa direto
  const d = new Date(input)
  return isNaN(d.getTime()) ? null : d
}

function toDate(d: string | Date): Date {
  if (d instanceof Date) return d
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    return new Date(`${d}T00:00:00${SP_OFFSET}`)
  }
  return new Date(d)
}

/** Format date for display: "23/03/26, 15:22" */
export function formatDateTime(d: string | Date | null): string {
  if (!d) return ''
  const date = toDate(d)
  return date.toLocaleDateString('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Format date only: "23/03/2026" */
export function formatDate(d: string | Date | null): string {
  if (!d) return ''
  const date = toDate(d)
  return date.toLocaleDateString('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Format short date: "23 mar" */
export function formatDateShort(d: string | Date | null): string {
  if (!d) return ''
  const date = toDate(d)
  return date.toLocaleDateString('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
  })
}

/** Format short date with year: "23 mar 2026" */
export function formatDateShortYear(d: string | Date | null): string {
  if (!d) return ''
  const date = toDate(d)
  return date.toLocaleDateString('pt-BR', {
    timeZone: TZ,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/** YYYY-MM-DD string in SP timezone (for date inputs and comparisons) */
export function toDateStr(d: string | Date | null): string {
  if (!d) return ''
  const date = toDate(d)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
  return parts // en-CA gives YYYY-MM-DD format
}

/** Today as YYYY-MM-DD in SP timezone */
export function todayStr(): string {
  return toDateStr(new Date())
}

/** Get Monday–Sunday range for the week containing `ref` (defaults to today), in SP timezone */
export function getWeekRange(ref?: Date): { from: string; to: string } {
  const d = ref ? new Date(ref) : new Date()
  // Get SP-local date parts
  const spStr = d.toLocaleDateString('en-CA', { timeZone: TZ })
  const local = new Date(spStr + 'T12:00:00')
  const day = local.getDay() // 0=Sun
  const diffToMon = day === 0 ? -6 : 1 - day
  const monday = new Date(local)
  monday.setDate(local.getDate() + diffToMon)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    from: toDateStr(monday),
    to: toDateStr(sunday),
  }
}

/** Get Monday–Sunday range for the previous week relative to `ref` */
export function getLastWeekRange(ref?: Date): { from: string; to: string } {
  const d = ref ? new Date(ref) : new Date()
  const spStr = d.toLocaleDateString('en-CA', { timeZone: TZ })
  const local = new Date(spStr + 'T12:00:00')
  const day = local.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const thisMon = new Date(local)
  thisMon.setDate(local.getDate() + diffToMon)
  const lastMon = new Date(thisMon)
  lastMon.setDate(thisMon.getDate() - 7)
  const lastSun = new Date(lastMon)
  lastSun.setDate(lastMon.getDate() + 6)
  return {
    from: toDateStr(lastMon),
    to: toDateStr(lastSun),
  }
}

/** Get 1st–last day range for the month containing `ref` */
export function getMonthRange(ref?: Date): { from: string; to: string } {
  const d = ref ? new Date(ref) : new Date()
  const spStr = d.toLocaleDateString('en-CA', { timeZone: TZ })
  const [y, m] = spStr.split('-').map(Number)
  const first = new Date(y, m - 1, 1, 12)
  const last = new Date(y, m, 0, 12) // day 0 of next month = last day of this month
  return {
    from: toDateStr(first),
    to: toDateStr(last),
  }
}
