import { freshnessOf } from '@/lib/playbook-freshness'

const ESTILOS = {
  verificado: {
    label: 'Verificado',
    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  precisa_revisao: {
    label: 'Precisa revisão',
    cls: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  nunca_verificado: {
    label: 'Nunca verificado',
    cls: 'bg-slate-50 text-slate-600 border-slate-200',
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
