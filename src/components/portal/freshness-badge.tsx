import { freshnessOf } from '@/lib/playbook-freshness'

const ESTILOS = {
  verificado: {
    label: 'Verificado',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/60',
  },
  precisa_revisao: {
    label: 'Precisa revisão',
    cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/60',
  },
  nunca_verificado: {
    label: 'Nunca verificado',
    cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700',
  },
} as const

/** Badge dos 3 estados de frescor. O estado é derivado, nunca lido do banco. */
export function FreshnessBadge({
  verifiedAt,
  reviewDueAt,
  now,
}: {
  verifiedAt: Date | null
  reviewDueAt: Date | null
  now?: Date
}) {
  const estado = freshnessOf({ verifiedAt, reviewDueAt }, now)
  const { label, cls } = ESTILOS[estado]

  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  )
}
