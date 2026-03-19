'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import {
  ORIGINS,
  CLASSIFICATIONS,
  toDateStr,
  todayStr,
  type Demanda,
} from '@/app/dashboard/demandas/helpers'

export type TimeRange = 'hours' | 'days' | 'weeks' | 'months'

export const TIME_RANGE_CONFIG: Record<TimeRange, { label: string; daysSpan: number; tickHours: number; tickFormat: Intl.DateTimeFormatOptions }> = {
  hours: { label: 'Horas', daysSpan: 1, tickHours: 3, tickFormat: { hour: '2-digit', minute: '2-digit' } },
  days: { label: 'Dias', daysSpan: 14, tickHours: 24, tickFormat: { day: '2-digit', month: 'short' } },
  weeks: { label: 'Semanas', daysSpan: 60, tickHours: 24 * 7, tickFormat: { day: '2-digit', month: 'short' } },
  months: { label: 'Meses', daysSpan: 180, tickHours: 24 * 30, tickFormat: { month: 'short', year: '2-digit' } },
}

export function GanttChart({
  demandas,
  timeRange,
  onBarClick,
}: {
  demandas: Demanda[]
  timeRange: TimeRange
  onBarClick?: (demandaId: string) => void
}) {
  const activeDemandas = demandas.filter((d) => d.status !== 'concluida')

  if (activeDemandas.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center py-5">
        Nenhuma demanda ativa para exibir no Gantt
      </div>
    )
  }

  const config = TIME_RANGE_CONFIG[timeRange]
  const DAY_MS = 86400000
  const now = Date.now()

  // Window: center on today, span based on timeRange
  const halfSpan = (config.daysSpan / 2) * DAY_MS
  const minDate = new Date(now - halfSpan)
  const maxDate = new Date(now + halfSpan)
  const totalMs = maxDate.getTime() - minDate.getTime()

  const todayPos = ((now - minDate.getTime()) / totalMs) * 100

  // Generate tick marks
  const ticks: Date[] = []
  const tickMs = config.tickHours * 3600000
  const firstTick = new Date(minDate)

  // Align first tick to clean boundary
  if (timeRange === 'hours') {
    const h = firstTick.getHours()
    firstTick.setHours(h - (h % config.tickHours) + config.tickHours, 0, 0, 0)
  } else if (timeRange === 'months') {
    firstTick.setDate(1)
    firstTick.setHours(0, 0, 0, 0)
  } else if (timeRange === 'weeks') {
    const day = firstTick.getDay()
    const diff = day === 0 ? -6 : 1 - day
    firstTick.setDate(firstTick.getDate() + diff)
    firstTick.setHours(0, 0, 0, 0)
  } else {
    firstTick.setHours(0, 0, 0, 0)
  }

  const cursor = new Date(firstTick)
  while (cursor <= maxDate) {
    if (cursor >= minDate) {
      ticks.push(new Date(cursor))
    }
    if (timeRange === 'months') {
      cursor.setMonth(cursor.getMonth() + 1)
    } else {
      cursor.setTime(cursor.getTime() + tickMs)
    }
  }

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  // Filter demandas that overlap with visible window, sorted by dateIn ascending
  const visibleDemandas = activeDemandas
    .filter((dem) => {
      const start = new Date(dem.dateIn).getTime()
      const end = dem.deadline ? new Date(dem.deadline).getTime() : start + DAY_MS * 7
      return end >= minDate.getTime() && start <= maxDate.getTime()
    })
    .sort((a, b) => new Date(a.dateIn).getTime() - new Date(b.dateIn).getTime())

  if (visibleDemandas.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center py-5">
        Nenhuma demanda neste periodo
      </div>
    )
  }

  // Group by classification
  const classifMap = Object.fromEntries(CLASSIFICATIONS.map((c) => [c.id, c]))
  const groups: { id: string; label: string; color: string; demandas: typeof visibleDemandas }[] = []
  const grouped = new Map<string, typeof visibleDemandas>()

  for (const dem of visibleDemandas) {
    const key = dem.classification || '__none__'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(dem)
  }

  // Classified groups first (in CLASSIFICATIONS order), then unclassified
  for (const c of CLASSIFICATIONS) {
    if (grouped.has(c.id)) {
      groups.push({ id: c.id, label: c.label, color: c.color, demandas: grouped.get(c.id)! })
    }
  }
  if (grouped.has('__none__')) {
    groups.push({ id: '__none__', label: 'Sem classificacao', color: '#94a3b8', demandas: grouped.get('__none__')! })
  }

  const renderBar = (dem: typeof visibleDemandas[0]) => {
    const origin = ORIGINS.find((o) => o.id === dem.origin)
    const startDate = new Date(dem.dateIn)
    const endDate = dem.deadline
      ? new Date(dem.deadline)
      : new Date(startDate.getTime() + DAY_MS * 7)

    const clampedStart = Math.max(startDate.getTime(), minDate.getTime())
    const clampedEnd = Math.min(endDate.getTime(), maxDate.getTime())

    const startPos = ((clampedStart - minDate.getTime()) / totalMs) * 100
    const width = Math.max(((clampedEnd - clampedStart) / totalMs) * 100, 1)
    const isOverdue = dem.deadline && toDateStr(dem.deadline) < todayStr()
    const isBlocked = dem.status === 'bloqueada'
    const barColor = origin?.color || '#8899aa'

    return (
      <div key={dem.id} className="flex items-center h-9 border-b border-blue-100/60 dark:border-slate-700/30">
        <div
          className={`w-[200px] shrink-0 px-2 pl-6 text-[13px] text-slate-800 dark:text-slate-200 font-medium overflow-hidden text-ellipsis whitespace-nowrap${onBarClick ? ' cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors' : ''}`}
          title={dem.title}
          onClick={onBarClick ? () => onBarClick(dem.id) : undefined}
        >
          {dem.title}
        </div>
        <div className="flex-1 relative h-full">
          <div
            className={`absolute top-1.5 h-6 rounded transition-all${onBarClick ? ' cursor-pointer hover:brightness-110' : ''}`}
            style={{
              left: `${startPos}%`,
              width: `${width}%`,
              background: isBlocked
                ? `repeating-linear-gradient(45deg, ${barColor}33, ${barColor}33 4px, transparent 4px, transparent 8px)`
                : `${barColor}44`,
              border: `1px solid ${isOverdue ? '#ef4444' : barColor}88`,
            }}
            onClick={onBarClick ? () => onBarClick(dem.id) : undefined}
          >
            <div
              className="h-full rounded-sm transition-all duration-300"
              style={{
                background: isOverdue
                  ? `linear-gradient(90deg, ${barColor}88, #ef444466)`
                  : `${barColor}66`,
                width:
                  dem.status === 'em_andamento'
                    ? '60%'
                    : dem.status === 'selecionada'
                    ? '10%'
                    : dem.status === 'concluida'
                    ? '100%'
                    : '5%',
              }}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto relative w-full">
      <div className="relative min-w-[500px]">
        {/* Tick headers */}
        <div className="flex border-b border-blue-100/60 dark:border-slate-700/30 mb-1">
          <div className="w-[200px] shrink-0 p-1.5" />
          <div className="flex-1 relative h-7">
            {ticks.map((t, i) => {
              const pos = ((t.getTime() - minDate.getTime()) / totalMs) * 100
              return (
                <span
                  key={i}
                  className="absolute text-[10px] text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap"
                  style={{ left: `${pos}%`, top: 6 }}
                >
                  {t.toLocaleDateString('pt-BR', config.tickFormat)}
                </span>
              )
            })}
          </div>
        </div>

        {/* Vertical grid lines at each tick */}
        {ticks.map((t, i) => {
          const pos = ((t.getTime() - minDate.getTime()) / totalMs) * 100
          return (
            <div
              key={`grid-${i}`}
              className="absolute top-8 bottom-0 w-px bg-blue-200/40 dark:bg-slate-600/30 pointer-events-none"
              style={{ left: `calc(200px + (100% - 200px) * ${pos} / 100)` }}
            />
          )
        })}

        {/* Today line */}
        {todayPos >= 0 && todayPos <= 100 && (
          <div
            className="absolute top-8 bottom-0 w-0.5 bg-blue-500 opacity-60 z-10"
            style={{ left: `calc(200px + (100% - 200px) * ${todayPos} / 100)` }}
          />
        )}

        {/* Grouped Rows */}
        {groups.map((group) => {
          const isCollapsed = collapsedGroups.has(group.id)
          return (
            <div key={group.id}>
              {/* Group header */}
              <div
                className="flex items-center h-8 cursor-pointer select-none border-b border-blue-100/60 dark:border-slate-700/30"
                style={{ backgroundColor: group.color + '10' }}
                onClick={() => toggleGroup(group.id)}
              >
                <div className="w-[200px] shrink-0 px-2 flex items-center gap-1.5">
                  {isCollapsed ? (
                    <ChevronRight className="h-3.5 w-3.5" style={{ color: group.color }} />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" style={{ color: group.color }} />
                  )}
                  <span className="text-[12px] font-bold" style={{ color: group.color }}>
                    {group.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ({group.demandas.length})
                  </span>
                </div>
              </div>
              {/* Group items */}
              {!isCollapsed && group.demandas.map(renderBar)}
            </div>
          )
        })}
      </div>
    </div>
  )
}
