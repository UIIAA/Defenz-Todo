import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { POST } from '../route'
import { PUT, DELETE } from '../[subtaskId]/route'

// Diário de horas (delta-on-save) nas rotas de subtarefa — feature-time-entries.
// Atribuído ao Responsável do card pai (fallback editor), source="subtask".

const parent = {
  id: 'dem-1',
  companyId: 'company-defenz',
  assignedToId: 'resp-1',
  assignee: 'Resp One',
  client: 'Acme',
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated() // admin (user-test-123, "Test User")
})

describe('POST subtask — diário de horas', () => {
  it('subtarefa criada com horas grava delta positivo atribuído ao Responsável do card', async () => {
    mockDb.demanda.findUnique.mockResolvedValue(parent)
    mockDb.subtask.findFirst.mockResolvedValue(null) // maxPos
    mockDb.subtask.create.mockResolvedValue({ id: 'st-1', title: 'Sub', spentMinutes: 120, demandaId: 'dem-1' })

    const req = createRequest('POST', { body: { title: 'Sub', spentMinutes: 120 } })
    const res = await POST(req, { params: Promise.resolve({ id: 'dem-1' }) })
    expect(res.status).toBe(201)

    expect(mockDb.timeEntry.create).toHaveBeenCalledTimes(1)
    const data = mockDb.timeEntry.create.mock.calls[0][0].data
    expect(data.minutes).toBe(120)
    expect(data.source).toBe('subtask')
    expect(data.subtaskId).toBe('st-1')
    expect(data.userId).toBe('resp-1')
    expect(data.userName).toBe('Resp One')
    expect(data.client).toBe('Acme')
  })

  it('subtarefa criada sem horas NÃO grava lançamento', async () => {
    mockDb.demanda.findUnique.mockResolvedValue(parent)
    mockDb.subtask.findFirst.mockResolvedValue(null)
    mockDb.subtask.create.mockResolvedValue({ id: 'st-2', title: 'Sub', spentMinutes: 0, demandaId: 'dem-1' })

    const req = createRequest('POST', { body: { title: 'Sub' } })
    await POST(req, { params: Promise.resolve({ id: 'dem-1' }) })
    expect(mockDb.timeEntry.create).not.toHaveBeenCalled()
  })
})

describe('PUT subtask — diário de horas', () => {
  it('editar horas da subtarefa grava o delta', async () => {
    mockDb.subtask.findFirst.mockResolvedValue({
      id: 'st-1', title: 'Sub', completed: false, spentMinutes: 30, demandaId: 'dem-1',
      demanda: parent,
    })
    mockDb.subtask.update.mockResolvedValue({ id: 'st-1', title: 'Sub', spentMinutes: 75 })

    const req = createRequest('PUT', { body: { spentMinutes: 75 } })
    const res = await PUT(req, { params: Promise.resolve({ id: 'dem-1', subtaskId: 'st-1' }) })
    expect(res.status).toBe(200)

    const data = mockDb.timeEntry.create.mock.calls[0][0].data
    expect(data.minutes).toBe(45)
    expect(data.source).toBe('subtask')
    expect(data.subtaskId).toBe('st-1')
    expect(data.userId).toBe('resp-1')
    expect(data.userName).toBe('Resp One')
  })

  it('PUT sem mudança de horas NÃO grava', async () => {
    mockDb.subtask.findFirst.mockResolvedValue({
      id: 'st-1', title: 'Sub', completed: false, spentMinutes: 30, demandaId: 'dem-1',
      demanda: parent,
    })
    mockDb.subtask.update.mockResolvedValue({ id: 'st-1', title: 'Outro', spentMinutes: 30 })

    const req = createRequest('PUT', { body: { title: 'Outro' } })
    await PUT(req, { params: Promise.resolve({ id: 'dem-1', subtaskId: 'st-1' }) })
    expect(mockDb.timeEntry.create).not.toHaveBeenCalled()
  })
})

describe('DELETE subtask — diário de horas', () => {
  it('excluir subtarefa com horas grava delta negativo (fallback editor quando sem Responsável)', async () => {
    mockDb.subtask.findFirst.mockResolvedValue({
      id: 'st-1', title: 'Sub', spentMinutes: 60, demandaId: 'dem-1',
      demanda: { ...parent, assignedToId: null, assignee: null, client: null },
    })
    mockDb.subtask.delete.mockResolvedValue({})

    const req = createRequest('DELETE', {})
    const res = await DELETE(req, { params: Promise.resolve({ id: 'dem-1', subtaskId: 'st-1' }) })
    expect(res.status).toBe(200)

    const data = mockDb.timeEntry.create.mock.calls[0][0].data
    expect(data.minutes).toBe(-60)
    expect(data.source).toBe('subtask')
    expect(data.subtaskId).toBe('st-1')
    expect(data.userId).toBe('user-test-123')
    expect(data.userName).toBe('Test User')
  })

  it('excluir subtarefa sem horas NÃO grava', async () => {
    mockDb.subtask.findFirst.mockResolvedValue({
      id: 'st-1', title: 'Sub', spentMinutes: 0, demandaId: 'dem-1', demanda: parent,
    })
    mockDb.subtask.delete.mockResolvedValue({})

    const req = createRequest('DELETE', {})
    await DELETE(req, { params: Promise.resolve({ id: 'dem-1', subtaskId: 'st-1' }) })
    expect(mockDb.timeEntry.create).not.toHaveBeenCalled()
  })
})
