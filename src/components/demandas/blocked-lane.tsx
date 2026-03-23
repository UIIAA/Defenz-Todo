'use client'

import { useDroppable } from '@dnd-kit/core'
import { KanbanCard } from './kanban-card'
import type { Demanda, Status } from '@/app/dashboard/demandas/helpers'

function BlockedDropZone({
  statusId,
  items,
  onClickCard,
  highlightedCardId,
}: {
  statusId: string
  items: Demanda[]
  onClickCard: (d: Demanda) => void
  highlightedCardId?: string | null
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `blocked-${statusId}`,
  })

  const isEmpty = items.length === 0

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-w-[140px] sm:min-w-[180px] min-h-[60px] rounded-lg p-1 transition-all ${
        isOver
          ? 'ring-2 ring-red-400/50 bg-red-50/30 dark:bg-red-900/10'
          : isEmpty
            ? 'border border-dashed border-slate-200 dark:border-slate-700/50'
            : ''
      }`}
    >
      {isEmpty ? (
        <div className={`flex items-center justify-center h-full min-h-[52px] transition-opacity ${
          isOver ? 'opacity-80' : 'opacity-40'
        }`}>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 select-none">
            Arraste para bloquear
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((d) => (
            <KanbanCard
              key={d.id}
              d={d}
              onClick={onClickCard}
              highlighted={highlightedCardId === d.id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function BlockedLane({
  demandas,
  kanbanStatuses,
  onClickCard,
  highlightedCardId,
}: {
  demandas: Demanda[]
  kanbanStatuses: Status[]
  onClickCard: (d: Demanda) => void
  highlightedCardId?: string | null
}) {
  return (
    <div className="mt-4 pt-3 border-t-2 border-dashed border-red-200/60 dark:border-red-800/30">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-base">🚫</span>
        <span className="text-[12px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
          Bloqueada
        </span>
        {demandas.length > 0 && (
          <span className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
            {demandas.length}
          </span>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto">
        {kanbanStatuses.map((s) => {
          const items = demandas.filter((d) => d.previousStatus === s.id)
          return (
            <BlockedDropZone
              key={s.id}
              statusId={s.id}
              items={items}
              onClickCard={onClickCard}
              highlightedCardId={highlightedCardId}
            />
          )
        })}
      </div>
    </div>
  )
}
