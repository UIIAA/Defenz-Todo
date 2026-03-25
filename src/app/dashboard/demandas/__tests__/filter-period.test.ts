import { describe, it, expect } from 'vitest'
import { filterByPeriod, type Demanda } from '../helpers'
import { getWeekRange, getLastWeekRange, getMonthRange } from '@/lib/date'

function makeDemanda(overrides: Partial<Demanda> = {}): Demanda {
  return {
    id: '1',
    title: 'Test',
    description: null,
    origin: 'fernando',
    status: 'solicitada',
    priority: 'media',
    classification: null,
    assignee: null,
    dateIn: '2026-03-23',
    deadline: null,
    dateDone: null,
    ...overrides,
  }
}

describe('filterByPeriod', () => {
  it('filtro "all" retorna todas as demandas', () => {
    const demandas = [
      makeDemanda({ id: '1', dateIn: '2020-01-01' }),
      makeDemanda({ id: '2', dateIn: '2026-12-31' }),
    ]
    expect(filterByPeriod(demandas, 'all')).toEqual(demandas)
  })

  it('filtro "this_week" retorna concluidas cujo dateDone esta na semana atual', () => {
    const { from, to } = getWeekRange()
    const demandas = [
      makeDemanda({ id: '1', status: 'concluida', dateDone: from, dateIn: '2020-01-01' }),
      makeDemanda({ id: '2', status: 'concluida', dateDone: '2020-01-01', dateIn: from }),
    ]
    const result = filterByPeriod(demandas, 'this_week')
    expect(result.map((d) => d.id)).toEqual(['1'])
  })

  it('filtro "this_week" retorna nao-concluidas cujo dateIn esta na semana atual', () => {
    const { from } = getWeekRange()
    const demandas = [
      makeDemanda({ id: '1', status: 'em_andamento', dateIn: from }),
      makeDemanda({ id: '2', status: 'em_andamento', dateIn: '2020-01-01' }),
    ]
    const result = filterByPeriod(demandas, 'this_week')
    expect(result.map((d) => d.id)).toEqual(['1'])
  })

  it('filtro "last_week" retorna concluidas da semana passada', () => {
    const { from, to } = getLastWeekRange()
    const thisWeek = getWeekRange()
    const demandas = [
      makeDemanda({ id: '1', status: 'concluida', dateDone: from }),
      makeDemanda({ id: '2', status: 'concluida', dateDone: to }),
      makeDemanda({ id: '3', status: 'concluida', dateDone: thisWeek.from }),
    ]
    const result = filterByPeriod(demandas, 'last_week')
    expect(result.map((d) => d.id)).toEqual(['1', '2'])
  })

  it('filtro "this_month" retorna demandas do mes atual', () => {
    const { from, to } = getMonthRange()
    const demandas = [
      makeDemanda({ id: '1', status: 'concluida', dateDone: from }),
      makeDemanda({ id: '2', status: 'em_andamento', dateIn: to }),
      makeDemanda({ id: '3', status: 'em_andamento', dateIn: '2020-01-01' }),
    ]
    const result = filterByPeriod(demandas, 'this_month')
    expect(result.map((d) => d.id)).toEqual(['1', '2'])
  })

  it('filtro "custom" com range de/ate filtra corretamente', () => {
    const demandas = [
      makeDemanda({ id: '1', status: 'concluida', dateDone: '2026-03-17' }),
      makeDemanda({ id: '2', status: 'em_andamento', dateIn: '2026-03-17' }),
      makeDemanda({ id: '3', status: 'em_andamento', dateIn: '2026-03-18' }),
    ]
    const result = filterByPeriod(demandas, 'custom', '2026-03-17', '2026-03-17')
    expect(result.map((d) => d.id)).toEqual(['1', '2'])
  })

  it('demanda concluida sem dateDone e excluida do filtro de periodo', () => {
    const { from } = getWeekRange()
    const demandas = [
      makeDemanda({ id: '1', status: 'concluida', dateDone: null, dateIn: from }),
      makeDemanda({ id: '2', status: 'concluida', dateDone: from }),
    ]
    const result = filterByPeriod(demandas, 'this_week')
    expect(result.map((d) => d.id)).toEqual(['2'])
  })

  it('demanda nao-concluida sem dateIn e excluida do filtro de periodo', () => {
    const { from } = getWeekRange()
    const demandas = [
      makeDemanda({ id: '1', status: 'em_andamento', dateIn: '' }),
      makeDemanda({ id: '2', status: 'em_andamento', dateIn: from }),
    ]
    const result = filterByPeriod(demandas, 'this_week')
    expect(result.map((d) => d.id)).toEqual(['2'])
  })
})
