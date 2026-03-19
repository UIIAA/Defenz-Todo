import { describe, it, expect } from 'vitest'
import { STATUSES, ORIGINS, PRIORITIES } from '@/app/dashboard/demandas/helpers'
import type { Subtask, Demanda } from '@/app/dashboard/demandas/helpers'

describe('Demanda type with subtasks', () => {
  it('subtasks is optional on Demanda', () => {
    const demanda: Demanda = {
      id: '1',
      title: 'Test',
      description: null,
      origin: 'fernando',
      status: 'solicitada',
      priority: 'media',
      assignee: null,
      dateIn: '2026-01-01',
      deadline: null,
      dateDone: null,
    }
    expect(demanda.subtasks).toBeUndefined()
  })

  it('Demanda can hold subtasks array', () => {
    const subtasks: Subtask[] = [
      { id: 's1', title: 'Sub 1', completed: false, position: 0, demandaId: '1' },
      { id: 's2', title: 'Sub 2', completed: true, position: 1, demandaId: '1' },
    ]
    const demanda: Demanda = {
      id: '1',
      title: 'Test',
      description: null,
      origin: 'fernando',
      status: 'solicitada',
      priority: 'media',
      assignee: null,
      dateIn: '2026-01-01',
      deadline: null,
      dateDone: null,
      subtasks,
    }
    expect(demanda.subtasks).toHaveLength(2)
    expect(demanda.subtasks![0].completed).toBe(false)
    expect(demanda.subtasks![1].completed).toBe(true)
  })

  it('Subtask has correct shape', () => {
    const subtask: Subtask = {
      id: 'abc',
      title: 'Check something',
      completed: false,
      position: 0,
      demandaId: 'dem1',
    }
    expect(subtask.id).toBe('abc')
    expect(subtask.completed).toBe(false)
    expect(subtask.position).toBe(0)
  })
})

describe('Constants integrity', () => {
  it('STATUSES has 5 items including selecionada', () => {
    expect(STATUSES).toHaveLength(5)
    expect(STATUSES.map((s) => s.id)).toContain('selecionada')
  })

  it('STATUSES includes bloqueada', () => {
    expect(STATUSES.map((s) => s.id)).toContain('bloqueada')
  })

  it('ORIGINS has 4 items', () => {
    expect(ORIGINS).toHaveLength(4)
  })

  it('PRIORITIES has 3 items', () => {
    expect(PRIORITIES).toHaveLength(3)
    expect(PRIORITIES.map((p) => p.id)).toEqual(['alta', 'media', 'baixa'])
  })
})

describe('Kanban statuses filtering (bloqueada lane)', () => {
  it('filtering bloqueada from STATUSES gives 4 columns', () => {
    const kanbanStatuses = STATUSES.filter((s) => s.id !== 'bloqueada')
    expect(kanbanStatuses).toHaveLength(4)
    expect(kanbanStatuses.map((s) => s.id)).not.toContain('bloqueada')
  })

  it('blocked demandas can be grouped by previousStatus', () => {
    const blocked: Demanda[] = [
      {
        id: '1', title: 'A', description: null, origin: 'fernando', status: 'bloqueada',
        priority: 'media', assignee: null, previousStatus: 'em_andamento',
        dateIn: '2026-01-01', deadline: null, dateDone: null,
      },
      {
        id: '2', title: 'B', description: null, origin: 'outra', status: 'bloqueada',
        priority: 'alta', assignee: null, previousStatus: 'solicitada',
        dateIn: '2026-01-01', deadline: null, dateDone: null,
      },
      {
        id: '3', title: 'C', description: null, origin: 'outra', status: 'bloqueada',
        priority: 'baixa', assignee: null, previousStatus: 'em_andamento',
        dateIn: '2026-01-01', deadline: null, dateDone: null,
      },
    ]

    const grouped = blocked.filter((d) => d.previousStatus === 'em_andamento')
    expect(grouped).toHaveLength(2)
    expect(grouped.map((d) => d.id)).toEqual(['1', '3'])

    const fromSolicitada = blocked.filter((d) => d.previousStatus === 'solicitada')
    expect(fromSolicitada).toHaveLength(1)
  })

  it('previousStatus is optional on Demanda', () => {
    const demanda: Demanda = {
      id: '1', title: 'Test', description: null, origin: 'fernando',
      status: 'solicitada', priority: 'media', assignee: null,
      dateIn: '2026-01-01', deadline: null, dateDone: null,
    }
    expect(demanda.previousStatus).toBeUndefined()
  })
})
