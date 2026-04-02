'use client'

import { useDraggable } from '@dnd-kit/core'
import { Link as LinkIcon, Bell } from 'lucide-react'
import { formatDateShort } from '@/lib/date'
import {
  ORIGINS,
  PRIORITIES,
  CLASSIFICATIONS,
  toDateStr,
  todayStr,
  type Demanda,
} from '@/app/dashboard/demandas/helpers'

export function KanbanCard({
  d,
  onClick,
  highlighted,
  isDragOverlay,
}: {
  d: Demanda
  onClick: (d: Demanda) => void
  highlighted?: boolean
  isDragOverlay?: boolean
}) {
  const origin = ORIGINS.find((o) => o.id === d.origin)
  const prio = PRIORITIES.find((p) => p.id === d.priority)
  const classif = d.classification ? CLASSIFICATIONS.find((c) => c.id === d.classification) : null
  const isOverdue = d.deadline && d.status !== 'concluida' && toDateStr(d.deadline) < todayStr()
  const hasReminderToday = d.reminderDate && d.status !== 'concluida' && toDateStr(d.reminderDate) <= todayStr()

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: d.id,
    data: { demanda: d },
    disabled: isDragOverlay,
  })

  return (
    <div
      ref={setNodeRef}
      data-demanda-id={d.id}
      onClick={() => { if (!isDragging) onClick(d) }}
      className={`group bg-white dark:bg-slate-800/90 rounded-xl p-3 cursor-pointer transition-all border border-slate-200 dark:border-slate-700 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.3),0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_2px_6px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_4px_12px_rgba(0,0,0,0.4),0_8px_24px_rgba(0,0,0,0.3)]${highlighted || hasReminderToday ? ' animate-highlight-shake' : ''}${isDragging ? ' opacity-50' : ' hover:-translate-y-0.5'}${isDragOverlay ? ' rotate-2 scale-105 shadow-xl' : ''}${hasReminderToday ? ' ring-2 ring-amber-400/60' : ''}`}
      style={{ borderLeftWidth: 3, borderLeftColor: origin?.color || '#8899aa' }}
      {...listeners}
      {...attributes}
    >
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight flex-1">
          {d.title}
        </span>
        {prio && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0"
            style={{ background: prio.color + '22', color: prio.color }}
          >
            {prio.label}
          </span>
        )}
      </div>
      {d.assignee && (
        <div className="text-[10px] text-slate-400 mb-1 truncate">
          → {d.assignee}
        </div>
      )}
      {classif && (
        <span
          className="inline-block text-[9px] px-1.5 py-0.5 rounded font-medium mb-1"
          style={{ background: classif.color + '22', color: classif.color }}
        >
          {classif.label}
        </span>
      )}
      {d.subtasks && d.subtasks.length > 0 && (
        <div className="flex items-center gap-1.5 mb-1">
          <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${(d.subtasks.filter((s) => s.completed).length / d.subtasks.length) * 100}%` }}
            />
          </div>
          <span className="text-[9px] text-slate-400 font-medium">
            {d.subtasks.filter((s) => s.completed).length}/{d.subtasks.length}
          </span>
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold" style={{ color: origin?.color }}>
            {origin?.label}
          </span>
          {d.links && d.links.length > 0 && (
            <span className="flex items-center gap-0.5 text-[9px] text-blue-400" title={`${d.links.length} link(s)`}>
              <LinkIcon className="h-2.5 w-2.5" />
              {d.links.length}
            </span>
          )}
          {hasReminderToday && (
            <span className="flex items-center text-[9px] text-amber-500 animate-pulse" title="Lembrete para hoje">
              <Bell className="h-3 w-3" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {d.status === 'em_andamento' && d.dateStarted && (
            <span className="text-[9px] text-slate-400" title="Iniciada em">
              ⚡ {formatDateShort(d.dateStarted)}
            </span>
          )}
          {d.status === 'concluida' && d.dateDone && (
            <span className="text-[9px] text-emerald-500" title="Concluida em">
              ✅ {formatDateShort(d.dateDone)}
            </span>
          )}
          {d.deadline && (
            <span className={`text-[10px] ${isOverdue ? 'text-blue-500 dark:text-blue-400' : 'text-slate-500'}`}>
              {isOverdue ? '⚠ ' : ''}
              {formatDateShort(d.deadline)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
