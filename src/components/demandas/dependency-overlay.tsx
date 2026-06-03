'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import type { Demanda } from '@/app/dashboard/demandas/helpers'

type ArrowData = {
  id: string
  path: string
  color: string
  opacity: number
  dashed: boolean
}

function depStyle(parentStatus: string): { color: string; opacity: number; dashed: boolean } {
  if (parentStatus === 'concluida') return { color: '#94a3b8', opacity: 0.4, dashed: true }
  if (parentStatus === 'em_andamento') return { color: '#f59e0b', opacity: 0.9, dashed: false }
  return { color: '#ef4444', opacity: 0.85, dashed: false }
}

function isVisibleInContainer(rect: DOMRect, cr: DOMRect): boolean {
  return (
    rect.bottom > cr.top &&
    rect.top < cr.bottom &&
    rect.right > cr.left &&
    rect.left < cr.right
  )
}

const MARKER_COLORS = [
  { hex: '#94a3b8', id: '94a3b8' },
  { hex: '#f59e0b', id: 'f59e0b' },
  { hex: '#ef4444', id: 'ef4444' },
]

export function DependencyOverlay({
  demandas,
  containerRef,
}: {
  demandas: Demanda[]
  containerRef: React.RefObject<HTMLDivElement | null>
}) {
  const [arrows, setArrows] = useState<ArrowData[]>([])
  const frameRef = useRef<number | undefined>(undefined)

  const calculate = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const cr = container.getBoundingClientRect()
    const next: ArrowData[] = []

    for (const d of demandas) {
      if (!d.dependsOn?.length) continue

      const childEl = container.querySelector<HTMLElement>(`[data-demanda-id="${d.id}"]`)
      if (!childEl) continue
      const childRect = childEl.getBoundingClientRect()
      if (!isVisibleInContainer(childRect, cr)) continue

      for (const parentId of d.dependsOn) {
        const parentEl = container.querySelector<HTMLElement>(`[data-demanda-id="${parentId}"]`)
        if (!parentEl) continue
        const parentRect = parentEl.getBoundingClientRect()
        if (!isVisibleInContainer(parentRect, cr)) continue

        const parent = demandas.find((p) => p.id === parentId)
        const { color, opacity, dashed } = depStyle(parent?.status ?? '')

        // Coords relative to container top-left (SVG coordinate space)
        const x1 = childRect.left + childRect.width / 2 - cr.left
        const y1 = childRect.bottom - cr.top
        const x2 = parentRect.left + parentRect.width / 2 - cr.left
        const y2 = parentRect.top - cr.top

        // Vertical Bézier — tension proportional to vertical distance, clamped
        const tension = Math.max(28, Math.min(Math.abs(y2 - y1) * 0.45, 72))
        const path = `M ${x1} ${y1} C ${x1} ${y1 + tension} ${x2} ${y2 - tension} ${x2} ${y2}`

        next.push({ id: `${d.id}→${parentId}`, path, color, opacity, dashed })
      }
    }

    setArrows(next)
  }, [demandas, containerRef])

  const schedule = useCallback(() => {
    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current)
    frameRef.current = requestAnimationFrame(calculate)
  }, [calculate])

  // Recalculate after each render cycle (demandas change = new positions)
  useEffect(() => {
    schedule()
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current)
    }
  }, [schedule])

  // ResizeObserver on container
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(schedule)
    ro.observe(container)
    return () => ro.disconnect()
  }, [containerRef, schedule])

  // Capture scroll events (covers column-level vertical scrolls)
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('scroll', schedule, { capture: true, passive: true })
    return () => container.removeEventListener('scroll', schedule, { capture: true })
  }, [containerRef, schedule])

  if (arrows.length === 0) return null

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 20, overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        {MARKER_COLORS.map(({ hex, id }) => (
          <marker
            key={id}
            id={`dep-${id}`}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M 0 0 L 8 4 L 0 8 z" fill={hex} />
          </marker>
        ))}
      </defs>
      {arrows.map((a) => (
        <path
          key={a.id}
          d={a.path}
          fill="none"
          stroke={a.color}
          strokeWidth={1.5}
          opacity={a.opacity}
          strokeDasharray={a.dashed ? '5 3' : undefined}
          markerEnd={`url(#dep-${a.color.replace('#', '')})`}
        />
      ))}
    </svg>
  )
}
