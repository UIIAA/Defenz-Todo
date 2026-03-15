export const STATUS_CONFIG = {
  solicitada: { label: 'Solicitada', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  selecionada: { label: 'Selecionada', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  em_andamento: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  concluida: { label: 'Concluida', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  bloqueada: { label: 'Bloqueada', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
} as const

export type StatusKey = keyof typeof STATUS_CONFIG

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status as StatusKey]
  if (!config) return <span className="text-xs text-slate-400">{status}</span>

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${config.color}`}>
      {config.label}
    </span>
  )
}
