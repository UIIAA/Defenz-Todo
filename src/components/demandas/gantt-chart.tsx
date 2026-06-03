'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
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

// Layout constants matching Tailwind classes
const TICK_HEADER_H = 32 // h-7 (28px) + mb-1 (4px)
const GROUP_HEADER_H = 32 // h-8
const ROW_H = 36           // h-9
const BAR_Y_IN_ROW = 18   // top-1.5 (6px) + h-6/2 (12px)

interface DepTooltip { x: number; y: number; text: string }
interface BarCoord { leftPct: number; rightPct: number; yCenterPx: number }

function getLineColor(parent: Demanda | undefined, childStart: number): string {
  if (!parent || parent.status !== 'concluida' || !parent.dateDone) return '#94a3b8'
  return new Date(parent.dateDone).getTime() <= childStart ? '#22c55e' : '#ef4444'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    solicitada: 'Solicitada',
    selecionada: 'Selecionada',
    em_andamento: 'Em andamento',
    concluida: 'Concluida',
    bloqueada: 'Bloqueada',
  }
  return map[status] ?? status
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
  // --- All hooks first (Rules of Hooks) ---
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [tooltip, setTooltip] = useState<DepTooltip | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // --- Derived constants ---
  const config = TIME_RANGE_CONFIG[timeRange]
  const DAY_MS = 86400000
  const now = Date.now()
  const halfSpan = (config.daysSpan / 2) * DAY_MS
  const minDate = useMemo(() => new Date(now - halfSpan), [now, halfSpan])
  const maxDate = useMemo(() => new Date(now + halfSpan), [now, halfSpan])
  const totalMs = maxDate.getTime() - minDate.getTime()
  const todayPos = ((now - minDate.getTime()) / totalMs) * 100

  const activeDemandas = useMemo(
    () => demandas.filter((d) => d.status === 'selecionada' || d.status === 'em_andamento'),
    [demandas]
  )

  const getStartDate = (dem: Demanda) =>
    dem.status === 'em_andamento' && dem.dateStarted ? dem.dateStarted : dem.dateIn

  const visibleDemandas = useMemo(
    () =>
      activeDemandas
        .filter((dem) => {
          const start = new Date(getStartDate(dem)).getTime()
          const end = dem.deadline ? new Date(dem.deadline).getTime() : start + DAY_MS * 7
          return end >= minDate.getTime() && start <= maxDate.getTime()
        })
        .sort(
          (a, b) =>
            new Date(getStartDate(a)).getTime() - new Date(getStartDate(b)).getTime()
        ),
    [activeDemandas, minDate, maxDate, DAY_MS]
  )

  const groups = useMemo(() => {
    const result: { id: string; label: string; color: string; demandas: Demanda[] }[] = []
    const grouped = new Map<string, Demanda[]>()
    for (const dem of visibleDemandas) {
      const key = dem.classification || '__none__'
      if (!grouped.has(key)) grouped.set(key, [])
      grouped.get(key)!.push(dem)
    }
    for (const c of CLASSIFICATIONS) {
      if (grouped.has(c.id))
        result.push({ id: c.id, label: c.label, color: c.color, demandas: grouped.get(c.id)! })
    }
    if (grouped.has('__none__'))
      result.push({
        id: '__none__',
        label: 'Sem classificacao',
        color: '#94a3b8',
        demandas: grouped.get('__none__')!,
      })
    return result
  }, [visibleDemandas])

  // Tick marks
  const ticks = useMemo(() => {
    const tickMs = config.tickHours * 3600000
    const firstTick = new Date(minDate)
    if (timeRange === 'hours') {
      const h = firstTick.getHours()
      firstTick.setHours(h - (h % config.tickHours) + config.tickHours, 0, 0, 0)
    } else if (timeRange === 'months') {
      firstTick.setDate(1)
      firstTick.setHours(0, 0, 0, 0)
    } else if (timeRange === 'weeks') {
      const day = firstTick.getDay()
      firstTick.setDate(firstTick.getDate() + (day === 0 ? -6 : 1 - day))
      firstTick.setHours(0, 0, 0, 0)
    } else {
      firstTick.setHours(0, 0, 0, 0)
    }
    const result: Date[] = []
    const cursor = new Date(firstTick)
    while (cursor <= maxDate) {
      if (cursor >= minDate) result.push(new Date(cursor))
      if (timeRange === 'months') cursor.setMonth(cursor.getMonth() + 1)
      else cursor.setTime(cursor.getTime() + tickMs)
    }
    return result
  }, [minDate, maxDate, config, timeRange])

  // SVG coordinate helpers
  const labelW = containerWidth >= 640 ? 200 : 120
  const timelineW = containerWidth > labelW ? containerWidth - labelW : 0

  const barCoords = useMemo(() => {
    const coords = new Map<string, BarCoord>()
    let yOffset = TICK_HEADER_H
    for (const group of groups) {
      yOffset += GROUP_HEADER_H
      if (!collapsedGroups.has(group.id)) {
        group.demandas.forEach((dem, rowIdx) => {
          const startDate = new Date(getStartDate(dem))
          const endDate = dem.deadline
            ? new Date(dem.deadline)
            : new Date(startDate.getTime() + DAY_MS * 7)
          const cStart = Math.max(startDate.getTime(), minDate.getTime())
          const cEnd = Math.min(endDate.getTime(), maxDate.getTime())
          const leftPct = ((cStart - minDate.getTime()) / totalMs) * 100
          const widthPct = Math.max(((cEnd - cStart) / totalMs) * 100, 1)
          coords.set(dem.id, {
            leftPct,
            rightPct: leftPct + widthPct,
            yCenterPx: yOffset + rowIdx * ROW_H + BAR_Y_IN_ROW,
          })
        })
        yOffset += group.demandas.length * ROW_H
      }
    }
    return coords
  }, [groups, collapsedGroups, minDate, maxDate, totalMs, DAY_MS])

  const demandaById = useMemo(
    () => new Map(demandas.map((d) => [d.id, d])),
    [demandas]
  )

  const totalChartH = useMemo(() => {
    let h = TICK_HEADER_H
    for (const group of groups) {
      h += GROUP_HEADER_H
      if (!collapsedGroups.has(group.id)) h += group.demandas.length * ROW_H
    }
    return h
  }, [groups, collapsedGroups])

  interface DepLine {
    key: string
    x1: number; y1: number
    x2: number; y2: number
    color: string
    parentTitle: string
    parentStatus: string
  }

  const depLines = useMemo<DepLine[]>(() => {
    if (timelineW <= 0) return []
    const lines: DepLine[] = []
    for (const dem of visibleDemandas) {
      if (!dem.dependsOn || dem.dependsOn.length === 0) continue
      const childCoord = barCoords.get(dem.id)
      if (!childCoord) continue
      const childStart = new Date(getStartDate(dem)).getTime()
      for (const parentId of dem.dependsOn) {
        const parent = demandaById.get(parentId)
        let x1: number
        let y1: number

        const parentCoord = barCoords.get(parentId)
        if (parentCoord) {
          x1 = labelW + (timelineW * parentCoord.rightPct) / 100
          y1 = parentCoord.yCenterPx
        } else if (parent?.status === 'concluida') {
          // Parent is done but not rendered as a bar — compute its X from dateDone.
          // Use child's Y so the line arrives horizontally (clearly indicating "dep resolved").
          const endMs = parent.dateDone
            ? new Date(parent.dateDone).getTime()
            : parent.deadline
            ? new Date(parent.deadline).getTime()
            : new Date(getStartDate(parent)).getTime() + DAY_MS * 7
          const clampedEndMs = Math.min(Math.max(endMs, minDate.getTime()), maxDate.getTime())
          const rightPct = ((clampedEndMs - minDate.getTime()) / totalMs) * 100
          x1 = labelW + (timelineW * rightPct) / 100
          y1 = childCoord.yCenterPx
        } else {
          continue
        }

        lines.push({
          key: `${parentId}->${dem.id}`,
          x1,
          y1,
          x2: labelW + (timelineW * childCoord.leftPct) / 100,
          y2: childCoord.yCenterPx,
          color: getLineColor(parent, childStart),
          parentTitle: parent?.title ?? parentId,
          parentStatus: parent?.status ?? 'unknown',
        })
      }
    }
    return lines
  }, [visibleDemandas, barCoords, demandaById, labelW, timelineW, minDate, maxDate, totalMs, DAY_MS])

  // --- Early returns after all hooks ---
  if (activeDemandas.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center py-5">
        Nenhuma demanda selecionada ou em andamento
      </div>
    )
  }

  if (visibleDemandas.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center py-5">
        Nenhuma demanda neste periodo
      </div>
    )
  }

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(groupId)) next.delete(groupId)
      else next.add(groupId)
      return next
    })
  }

  const renderBar = (dem: Demanda) => {
    const origin = ORIGINS.find((o) => o.id === dem.origin)
    const startDate = new Date(getStartDate(dem))
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
      <div
        key={dem.id}
        className="flex items-center h-9 border-b border-blue-100/60 dark:border-slate-700/30"
      >
        <div
          className={`w-[120px] sm:w-[200px] shrink-0 px-2 pl-6 text-[13px] text-slate-800 dark:text-slate-200 font-medium overflow-hidden text-ellipsis whitespace-nowrap${onBarClick ? ' cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors' : ''}`}
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
      <div ref={containerRef} className="relative min-w-[360px] sm:min-w-[500px]">
        {/* Tick headers */}
        <div className="flex border-b border-blue-100/60 dark:border-slate-700/30 mb-1">
          <div className="w-[120px] sm:w-[200px] shrink-0 p-1.5" />
          <div className="flex-1 relative h-7">
            {ticks.map((t, i) => {
              const pos = ((t.getTime() - minDate.getTime()) / totalMs) * 100
              return (
                <span
                  key={i}
                  className="absolute text-[10px] text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap"
                  style={{ left: `${pos}%`, top: 6 }}
                >
                  {t.toLocaleDateString('pt-BR', {
                    ...config.tickFormat,
                    timeZone: 'America/Sao_Paulo',
                  })}
                </span>
              )
            })}
          </div>
        </div>

        {/* Vertical grid lines */}
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

        {/* SVG dependency lines */}
        {depLines.length > 0 && containerWidth > 0 && (
          <svg
            aria-hidden="true"
            className="absolute top-0 left-0 pointer-events-none"
            style={{
              width: containerWidth,
              height: totalChartH,
              overflow: 'visible',
              zIndex: 15,
            }}
          >
            <defs>
              {['22c55e', 'ef4444', '94a3b8'].map((hex) => (
                <marker
                  key={hex}
                  id={`dep-arr-${hex}`}
                  markerWidth="7"
                  markerHeight="7"
                  refX="6"
                  refY="3.5"
                  orient="auto"
                >
                  <path d="M0,0 L0,7 L7,3.5 Z" fill={`#${hex}`} opacity="0.85" />
                </marker>
              ))}
            </defs>

            {depLines.map((line) => {
              const dx = Math.abs(line.x2 - line.x1)
              const curve = Math.max(28, dx * 0.35)
              const d = `M ${line.x1} ${line.y1} C ${line.x1 + curve} ${line.y1} ${line.x2 - curve} ${line.y2} ${line.x2} ${line.y2}`
              const hex = line.color.replace('#', '')

              return (
                <g key={line.key}>
                  <path
                    d={d}
                    stroke={line.color}
                    strokeWidth="1.5"
                    strokeDasharray="5 3"
                    fill="none"
                    opacity="0.75"
                    markerEnd={`url(#dep-arr-${hex})`}
                  />
                  {/* Wide invisible hit area for tooltip */}
                  <path
                    d={d}
                    stroke="transparent"
                    strokeWidth="10"
                    fill="none"
                    style={{ cursor: 'default', pointerEvents: 'stroke' as React.CSSProperties['pointerEvents'] }}
                    onMouseEnter={(e) =>
                      setTooltip({
                        x: e.clientX,
                        y: e.clientY,
                        text: `Bloqueada por ${line.parentTitle} (status: ${statusLabel(line.parentStatus)})`,
                      })
                    }
                    onMouseMove={(e) =>
                      setTooltip((prev) =>
                        prev ? { ...prev, x: e.clientX, y: e.clientY } : null
                      )
                    }
                    onMouseLeave={() => setTooltip(null)}
                  />
                </g>
              )
            })}
          </svg>
        )}

        {/* Grouped rows */}
        {groups.map((group) => {
          const isCollapsed = collapsedGroups.has(group.id)
          return (
            <div key={group.id}>
              <div
                className="flex items-center h-8 cursor-pointer select-none border-b border-blue-100/60 dark:border-slate-700/30"
                style={{ backgroundColor: group.color + '10' }}
                onClick={() => toggleGroup(group.id)}
              >
                <div className="w-[120px] sm:w-[200px] shrink-0 px-2 flex items-center gap-1.5">
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
              {!isCollapsed && group.demandas.map(renderBar)}
            </div>
          )
        })}
      </div>

      {/* Tooltip — fixed so it escapes scroll container */}
      {tooltip && (
        <div
          className="fixed z-50 px-2.5 py-1.5 rounded-lg text-[12px] font-medium text-white shadow-lg pointer-events-none"
          style={{
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            background: 'rgba(15,23,42,0.92)',
            backdropFilter: 'blur(4px)',
            border: '1px solid rgba(255,255,255,0.1)',
            maxWidth: 260,
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
