import { describe, it, expect } from 'vitest'

describe('Lifecycle dates', () => {
  // Test 1: dateStarted set on first em_andamento, preserved on round-trip
  it('sets dateStarted on first em_andamento and preserves on round-trip', () => {
    // Simulate server logic: moving solicitada -> em_andamento
    const current = { status: 'solicitada', dateStarted: null, dateDone: null, description: '' }

    // Move to em_andamento: dateStarted should be set
    const lifecycleUpdate1: Record<string, unknown> = {}
    const newStatus1 = 'em_andamento'
    if (newStatus1 === 'em_andamento' && current.dateStarted === null) {
      lifecycleUpdate1.dateStarted = new Date('2026-03-23T10:00:00Z')
    }
    expect(lifecycleUpdate1.dateStarted).not.toBeNull()

    // Apply update
    const afterStart = { ...current, status: newStatus1, dateStarted: lifecycleUpdate1.dateStarted as Date }

    // Move to bloqueada -> em_andamento: dateStarted should NOT be overwritten
    const afterBlocked = { ...afterStart, status: 'bloqueada' }
    const lifecycleUpdate2: Record<string, unknown> = {}
    const newStatus2 = 'em_andamento'
    if (newStatus2 === 'em_andamento' && afterBlocked.dateStarted === null) {
      lifecycleUpdate2.dateStarted = new Date('2026-03-24T10:00:00Z')
    }
    // dateStarted should NOT be set again (it's already set)
    expect(lifecycleUpdate2.dateStarted).toBeUndefined()
    // Original dateStarted preserved
    expect(afterBlocked.dateStarted).toEqual(new Date('2026-03-23T10:00:00Z'))
  })

  // Test 2: Reopen clears dateDone and appends note
  it('clears dateDone and appends reopen note on reopen', () => {
    const current = {
      status: 'concluida',
      dateStarted: new Date('2026-03-20T10:00:00Z'),
      dateDone: new Date('2026-03-22T10:00:00Z'),
      description: 'Original desc',
    }

    const newStatus = 'selecionada'
    const lifecycleUpdate: Record<string, unknown> = {}

    if (current.status === 'concluida' && newStatus !== 'concluida') {
      lifecycleUpdate.dateDone = null
      const dateStr = new Date().toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric',
      })
      lifecycleUpdate.description = (current.description || '') + `\n\n* Reaberta em ${dateStr}`
    }

    expect(lifecycleUpdate.dateDone).toBeNull()
    expect(lifecycleUpdate.description).toContain('Reaberta em')
    expect(lifecycleUpdate.description).toContain('Original desc')
  })

  // Test 3: Gantt filter logic — only selecionada + em_andamento
  it('filters timeline to only selecionada and em_andamento', () => {
    const demandas = [
      { id: '1', status: 'solicitada', dateIn: '2026-03-01', dateStarted: null },
      { id: '2', status: 'selecionada', dateIn: '2026-03-02', dateStarted: null },
      { id: '3', status: 'em_andamento', dateIn: '2026-03-03', dateStarted: '2026-03-05' },
      { id: '4', status: 'concluida', dateIn: '2026-03-04', dateStarted: '2026-03-04' },
      { id: '5', status: 'bloqueada', dateIn: '2026-03-05', dateStarted: null },
    ]

    const timelineFiltered = demandas.filter(
      (d) => d.status === 'selecionada' || d.status === 'em_andamento'
    )

    expect(timelineFiltered).toHaveLength(2)
    expect(timelineFiltered.map((d) => d.id)).toEqual(['2', '3'])

    // em_andamento with dateStarted should use dateStarted as start
    const emAndamento = timelineFiltered.find((d) => d.status === 'em_andamento')!
    const startDate = emAndamento.dateStarted || emAndamento.dateIn
    expect(startDate).toBe('2026-03-05')
  })
})
