'use client'

import { useDroppable } from '@dnd-kit/core'
import { TicketCard, type TicketCardData } from './ticket-card'
import { STATUS_LABELS, type TicketStatus } from '@/lib/service-desk-config'

const COLUMN_ICONS: Record<TicketStatus, string> = {
  solicitado: '📥',
  em_atendimento: '⚡',
  concluido: '✅',
}

export function TicketColumn({
  status,
  items,
  wipLimit,
  onClickCard,
  onOpenDemanda,
}: {
  status: TicketStatus
  items: TicketCardData[]
  wipLimit: number | null
  onClickCard: (t: TicketCardData) => void
  onOpenDemanda?: (demandaId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  const count = items.length
  const isOverLimit = wipLimit !== null && count > wipLimit
  const isAtLimit = wipLimit !== null && count === wipLimit

  return (
    <div
      ref={setNodeRef}
      className={[
        'flex-1 min-w-[200px] rounded-lg p-2 transition-all',
        isOver ? 'ring-2 ring-blue-400/50 bg-blue-50/30 dark:bg-blue-900/10' : '',
        isOverLimit ? 'ring-2 ring-red-400/60 bg-red-50/20 dark:bg-red-900/10' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Header da coluna */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-base">{COLUMN_ICONS[status]}</span>
        <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-100">
          {STATUS_LABELS[status]}
        </span>
        {wipLimit !== null ? (
          <span
            className={[
              'text-[11px] font-bold px-2 py-0.5 rounded-full',
              isOverLimit
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : isAtLimit
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {count}/{wipLimit}
          </span>
        ) : (
          <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
            {count}
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-2 min-h-[60px] max-h-[60vh] overflow-y-auto pr-1">
        {items.map((t) => (
          <TicketCard
            key={t.id}
            ticket={t}
            onClick={onClickCard}
            onOpenDemanda={onOpenDemanda}
          />
        ))}
      </div>
    </div>
  )
}
