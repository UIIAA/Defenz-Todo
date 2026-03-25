import { describe, it, expect } from 'vitest'
import type { Demanda } from '../helpers'

const makeDemanda = (overrides: Partial<Demanda> = {}): Demanda => ({
  id: '1',
  title: 'Test',
  description: null,
  origin: 'fernando',
  status: 'solicitada',
  priority: 'media',
  classification: null,
  assignee: null,
  dateIn: '2026-03-20',
  dateStarted: null,
  deadline: null,
  dateDone: null,
  ...overrides,
})

function filterByClassification(demandas: Demanda[], classification: string): Demanda[] {
  if (classification === 'all') return demandas
  return demandas.filter((d) => d.classification === classification)
}

describe('Filter by Classification', () => {
  const demandas: Demanda[] = [
    makeDemanda({ id: '1', classification: 'tecnologia' }),
    makeDemanda({ id: '2', classification: 'marketing' }),
    makeDemanda({ id: '3', classification: 'vendas' }),
    makeDemanda({ id: '4', classification: null }),
  ]

  it('returns all demandas when filter is "all"', () => {
    const result = filterByClassification(demandas, 'all')
    expect(result).toHaveLength(4)
  })

  it('filters by specific classification and excludes null', () => {
    const result = filterByClassification(demandas, 'tecnologia')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
    expect(result[0].classification).toBe('tecnologia')
  })
})
