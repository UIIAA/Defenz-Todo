/** Helpers puros de apresentação do Service Desk (testáveis, sem React). */

export const TICKET_STATUS_META: Record<string, { label: string; cls: string }> = {
  open: { label: 'Aberto', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300' },
  paused: { label: 'Pausado', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300' },
  resolved: { label: 'Resolvido', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300' },
}

export const TICKET_CHANNEL_LABELS: Record<string, string> = {
  email: 'E-mail',
  whatsapp: 'WhatsApp',
  telefone: 'Telefone',
  chat: 'Chat',
  outro: 'Outro',
}

export const TICKET_PRIORITY_LABELS: Record<string, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa',
}

/** Formata minutos em texto humano: 0min · 45min · 2h 15min · 3d 4h. */
export function formatMinutesHuman(min: number): string {
  const m = Math.max(0, Math.round(min))
  if (m < 60) return `${m}min`
  if (m < 1440) {
    const h = Math.floor(m / 60)
    const rem = m % 60
    return rem ? `${h}h ${rem}min` : `${h}h`
  }
  const d = Math.floor(m / 1440)
  const h = Math.floor((m % 1440) / 60)
  return h ? `${d}d ${h}h` : `${d}d`
}
