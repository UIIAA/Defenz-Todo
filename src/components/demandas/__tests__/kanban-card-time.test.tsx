// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { DndContext } from '@dnd-kit/core'
import { KanbanCard } from '../kanban-card'
import {
  totalSpentMinutes,
  totalEstimatedMinutes,
  type Demanda,
} from '@/app/dashboard/demandas/helpers'

const STATUS_IDS = ['solicitada', 'selecionada', 'em_andamento', 'concluida', 'bloqueada']

function makeDemanda(over: Partial<Demanda> = {}): Demanda {
  return {
    id: 'd1',
    title: 'Tarefa',
    description: null,
    origin: 'fernando',
    status: 'solicitada',
    priority: 'media',
    classification: null,
    assignee: null,
    assignedToId: null,
    previousStatus: null,
    dateIn: '2026-06-01',
    dateStarted: null,
    deadline: null,
    dateDone: null,
    reminderDate: null,
    reminderSent: false,
    subtasks: [],
    links: [],
    dependsOn: [],
    estimatedMinutes: null,
    spentMinutes: 0,
    ...over,
  }
}

function renderCard(d: Demanda) {
  return render(
    <DndContext>
      <KanbanCard d={d} onClick={() => {}} />
    </DndContext>
  )
}

afterEach(() => cleanup())

describe('KanbanCard — badge de horas em todas as colunas', () => {
  it.each(STATUS_IDS)('renderiza sem quebrar com horas no status "%s"', (status) => {
    const d = makeDemanda({ status, spentMinutes: 90, estimatedMinutes: 480 })
    renderCard(d)
    expect(screen.getByText('1,5/8h')).toBeTruthy()
  })

  it('não mostra badge quando não há horas', () => {
    renderCard(makeDemanda({ spentMinutes: 0, estimatedMinutes: null }))
    expect(screen.queryByText(/\dh/)).toBeNull()
    expect(screen.queryByTitle(/Horas/)).toBeNull()
  })

  it('mostra apenas gasto quando não há estimado (sem "/")', () => {
    renderCard(makeDemanda({ spentMinutes: 120 }))
    expect(screen.getByText('2h')).toBeTruthy()
  })

  it('estouro de orçamento aplica estilo vermelho', () => {
    renderCard(makeDemanda({ spentMinutes: 600, estimatedMinutes: 480 }))
    const badge = screen.getByText('10/8h').closest('span')!
    expect(badge.className).toContain('text-red-500')
  })

  it('gasto 0 com estimado preenchido mostra "0/Xh"', () => {
    renderCard(makeDemanda({ spentMinutes: 0, estimatedMinutes: 480 }))
    expect(screen.getByText('0/8h')).toBeTruthy()
  })

  it('valores enormes não quebram a renderização', () => {
    renderCard(makeDemanda({ spentMinutes: 6_000_000, estimatedMinutes: 6_000_000 }))
    expect(screen.getByText('100000/100000h')).toBeTruthy()
  })

  it('total no card soma subtarefas (card 1h + subs 0,5h+0,25h = 1,75h)', () => {
    const d = makeDemanda({
      spentMinutes: 60,
      subtasks: [
        { id: 's1', title: 'a', completed: false, position: 0, demandaId: 'd1', spentMinutes: 30 },
        { id: 's2', title: 'b', completed: true, position: 1, demandaId: 'd1', spentMinutes: 15 },
      ],
    })
    renderCard(d)
    expect(screen.getByText('1,75h')).toBeTruthy()
  })
})

describe('agregação — volume (stress)', () => {
  it('soma 500 subtarefas sem overflow nem perda', () => {
    const subtasks = Array.from({ length: 500 }, (_, i) => ({
      id: `s${i}`,
      title: `sub ${i}`,
      completed: i % 2 === 0,
      position: i,
      demandaId: 'd1',
      spentMinutes: 6, // 0,1h cada → 500 * 6 = 3000 min
      estimatedMinutes: 12,
    }))
    const d = makeDemanda({ spentMinutes: 0, estimatedMinutes: 0, subtasks })
    expect(totalSpentMinutes(d)).toBe(3000) // 50h
    expect(totalEstimatedMinutes(d)).toBe(6000) // 100h
  })

  it('estimado é null quando nada foi estimado em 100 subtarefas', () => {
    const subtasks = Array.from({ length: 100 }, (_, i) => ({
      id: `s${i}`,
      title: 's',
      completed: false,
      position: i,
      demandaId: 'd1',
      spentMinutes: 10,
    }))
    const d = makeDemanda({ subtasks })
    expect(totalSpentMinutes(d)).toBe(1000)
    expect(totalEstimatedMinutes(d)).toBeNull()
  })
})
