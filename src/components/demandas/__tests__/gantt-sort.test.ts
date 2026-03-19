import { describe, it, expect } from 'vitest'
import type { Demanda } from '@/app/dashboard/demandas/helpers'

// Test the sort logic used in GanttChart (extracted for unit testing)
function sortByDateIn(demandas: Demanda[]) {
  return [...demandas].sort(
    (a, b) => new Date(a.dateIn).getTime() - new Date(b.dateIn).getTime()
  )
}

const makeDemanda = (id: string, dateIn: string, status = 'em_andamento'): Demanda => ({
  id,
  title: `Demanda ${id}`,
  description: null,
  origin: 'fernando',
  status,
  priority: 'media',
  assignee: null,
  dateIn,
  deadline: null,
  dateDone: null,
})

describe('GanttChart sort by dateIn', () => {
  it('sorts demandas by dateIn ascending', () => {
    const demandas = [
      makeDemanda('3', '2026-03-15'),
      makeDemanda('1', '2026-01-10'),
      makeDemanda('2', '2026-02-20'),
    ]
    const sorted = sortByDateIn(demandas)
    expect(sorted[0].id).toBe('1')
    expect(sorted[1].id).toBe('2')
    expect(sorted[2].id).toBe('3')
  })

  it('preserves order for same dates', () => {
    const demandas = [
      makeDemanda('a', '2026-03-01'),
      makeDemanda('b', '2026-03-01'),
    ]
    const sorted = sortByDateIn(demandas)
    expect(sorted[0].id).toBe('a')
    expect(sorted[1].id).toBe('b')
  })

  it('handles single demanda', () => {
    const demandas = [makeDemanda('x', '2026-06-01')]
    const sorted = sortByDateIn(demandas)
    expect(sorted).toHaveLength(1)
    expect(sorted[0].id).toBe('x')
  })

  it('handles empty array', () => {
    expect(sortByDateIn([])).toEqual([])
  })

  it('filters out concluida before sort', () => {
    const demandas = [
      makeDemanda('done', '2026-01-01', 'concluida'),
      makeDemanda('active', '2026-02-01', 'em_andamento'),
    ]
    const active = demandas.filter((d) => d.status !== 'concluida')
    const sorted = sortByDateIn(active)
    expect(sorted).toHaveLength(1)
    expect(sorted[0].id).toBe('active')
  })
})
