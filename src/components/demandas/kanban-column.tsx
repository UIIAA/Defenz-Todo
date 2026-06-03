'use client'

import { useDroppable } from '@dnd-kit/core'
import { KanbanCard } from './kanban-card'
import type { Demanda, Status } from '@/app/dashboard/demandas/helpers'

type DepMeta = { id: string; title: string; status: string }

export function KanbanColumn({
  status,
  items,
  onClickCard,
  onOpenDemanda,
  isLast,
  highlightedCardId,
  wipLimit,
  demandaMap,
}: {
  status: Status
  items: Demanda[]
  onClickCard: (d: Demanda) => void
  onOpenDemanda?: (id: string) => void
  isLast?: boolean
  highlightedCardId?: string | null
  wipLimit?: number
  demandaMap?: Record<string, DepMeta>
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status.id,
  })

  const isAtLimit = wipLimit ? items.length >= wipLimit : false
  const isOverLimit = wipLimit ? items.length > wipLimit : false

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[140px] sm:min-w-[180px] rounded-lg p-1 transition-all${!isLast ? ' border-r border-dashed border-slate-200/60 dark:border-slate-600/40 pr-3' : ''}${isOver ? ' ring-2 ring-blue-400/50 bg-blue-50/30 dark:bg-blue-900/10' : ''}${isOverLimit ? ' border-red-300 dark:border-red-700' : ''}`}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-base">{status.icon}</span>
        <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-100">
          {status.label}
        </span>
        {wipLimit ? (
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            isOverLimit
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : isAtLimit
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
          }`}>
            {items.length}/{wipLimit}
          </span>
        ) : (
          <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 min-h-[60px] max-h-[55vh] overflow-y-auto pr-1">
        {items.map((d) => {
          const dependsOnMeta = demandaMap
            ? (d.dependsOn ?? []).map((id) => demandaMap[id]).filter(Boolean)
            : undefined
          return (
            <KanbanCard
              key={d.id}
              d={d}
              onClick={onClickCard}
              onOpenDemanda={onOpenDemanda}
              highlighted={highlightedCardId === d.id}
              dependsOnMeta={dependsOnMeta}
            />
          )
        })}
      </div>
    </div>
  )
}
