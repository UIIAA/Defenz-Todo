import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { logTimeDelta } from '../time-entries-server'

const actor = { id: 'editor-1', name: 'Editor One', email: 'editor@x.com' }

describe('logTimeDelta', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does NOT write when delta is 0', async () => {
    await logTimeDelta({
      demanda: { id: 'd1', assignedToId: 'u1', assignee: 'Resp One', client: 'Acme' },
      delta: 0,
      source: 'card',
      actor,
    })
    expect(mockDb.timeEntry.create).not.toHaveBeenCalled()
  })

  it('attributes to the Responsável (assignedToId + assignee snapshot) and snapshots client', async () => {
    await logTimeDelta({
      demanda: { id: 'd1', assignedToId: 'u1', assignee: 'Resp One', client: 'Acme' },
      delta: 30,
      source: 'card',
      actor,
    })
    expect(mockDb.timeEntry.create).toHaveBeenCalledTimes(1)
    const data = mockDb.timeEntry.create.mock.calls[0][0].data
    expect(data.userId).toBe('u1')
    expect(data.userName).toBe('Resp One')
    expect(data.minutes).toBe(30)
    expect(data.client).toBe('Acme')
    expect(data.source).toBe('card')
    expect(data.createdById).toBe('editor-1')
    expect(data.subtaskId).toBeNull()
  })

  it('falls back to the editor when the card has no Responsável', async () => {
    await logTimeDelta({
      demanda: { id: 'd1', assignedToId: null, assignee: null, client: null },
      delta: 45,
      source: 'card',
      actor,
    })
    const data = mockDb.timeEntry.create.mock.calls[0][0].data
    expect(data.userId).toBe('editor-1')
    expect(data.userName).toBe('Editor One')
    expect(data.client).toBeNull()
  })

  it('usa "Desconhecido" quando não há Responsável e o editor não tem nome nem email', async () => {
    await logTimeDelta({
      demanda: { id: 'd1', assignedToId: null, assignee: null, client: null },
      delta: 10,
      source: 'card',
      actor: { id: 'editor-x' },
    })
    const data = mockDb.timeEntry.create.mock.calls[0][0].data
    expect(data.userId).toBe('editor-x')
    expect(data.userName).toBe('Desconhecido')
  })

  it('records a negative delta (correção) with subtask source + subtaskId', async () => {
    await logTimeDelta({
      demanda: { id: 'd1', assignedToId: 'u1', assignee: 'Resp One', client: 'Acme' },
      delta: -15,
      source: 'subtask',
      subtaskId: 'st-9',
      actor,
    })
    const data = mockDb.timeEntry.create.mock.calls[0][0].data
    expect(data.minutes).toBe(-15)
    expect(data.source).toBe('subtask')
    expect(data.subtaskId).toBe('st-9')
    expect(data.userId).toBe('u1')
  })
})
