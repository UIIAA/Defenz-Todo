import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { PUT } from '../route'

// Diário de horas (delta-on-save) no PUT /api/demandas — feature-time-entries.

const baseCurrent = {
  id: 'dem-001',
  title: 'Card X',
  description: null as string | null,
  origin: 'fernando',
  status: 'em_andamento',
  priority: 'media',
  classification: null as string | null,
  client: 'Acme',
  assignee: 'Resp One',
  assignedToId: 'resp-1',
  spentMinutes: 60,
  estimatedMinutes: null as number | null,
  companyId: 'company-defenz',
  teamId: 'team-geral',
  dateIn: new Date('2025-01-15'),
  dateStarted: new Date('2025-01-15'),
  dateDone: null as Date | null,
  reminderDate: null as Date | null,
  reminderSent: false,
  dependsOn: '[]',
  updatedAt: new Date('2025-01-15'),
}

function putBody(body: Record<string, unknown>) {
  return createRequest('PUT', { body, url: 'http://localhost:3000/api/demandas' })
}

describe('PUT /api/demandas — diário de horas (card)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthenticated() // admin por padrão (user-test-123, "Test User")
  })

  it('grava lançamento de delta quando spentMinutes do card muda (atribui Responsável + snapshot cliente)', async () => {
    mockDb.demanda.findUnique.mockResolvedValue(baseCurrent)
    mockDb.demanda.update.mockResolvedValue({ ...baseCurrent, spentMinutes: 90 })

    const res = await PUT(putBody({ id: 'dem-001', spentMinutes: 90 }))
    expect(res.status).toBe(200)

    expect(mockDb.timeEntry.create).toHaveBeenCalledTimes(1)
    const data = mockDb.timeEntry.create.mock.calls[0][0].data
    expect(data.minutes).toBe(30)
    expect(data.userId).toBe('resp-1')
    expect(data.userName).toBe('Resp One')
    expect(data.client).toBe('Acme')
    expect(data.source).toBe('card')
    expect(data.createdById).toBe('user-test-123')
  })

  it('persiste o campo client no update quando enviado (snapshot do cliente atendido)', async () => {
    mockDb.demanda.findUnique.mockResolvedValue(baseCurrent)
    mockDb.demanda.update.mockResolvedValue({ ...baseCurrent, client: 'Globex' })

    await PUT(putBody({ id: 'dem-001', client: 'Globex' }))

    const updateData = mockDb.demanda.update.mock.calls[0][0].data
    expect(updateData.client).toBe('Globex')
  })

  it('NÃO grava quando o delta é 0 (spentMinutes igual ao atual)', async () => {
    mockDb.demanda.findUnique.mockResolvedValue(baseCurrent)
    mockDb.demanda.update.mockResolvedValue(baseCurrent)

    await PUT(putBody({ id: 'dem-001', spentMinutes: 60 }))
    expect(mockDb.timeEntry.create).not.toHaveBeenCalled()
  })

  it('NÃO grava quando spentMinutes não é enviado', async () => {
    mockDb.demanda.findUnique.mockResolvedValue(baseCurrent)
    mockDb.demanda.update.mockResolvedValue({ ...baseCurrent, title: 'Novo titulo' })

    await PUT(putBody({ id: 'dem-001', title: 'Novo titulo' }))
    expect(mockDb.timeEntry.create).not.toHaveBeenCalled()
  })

  it('atribui ao editor quando o card não tem Responsável', async () => {
    const noResp = { ...baseCurrent, assignedToId: null, assignee: null, client: null }
    mockDb.demanda.findUnique.mockResolvedValue(noResp)
    mockDb.demanda.update.mockResolvedValue({ ...noResp, spentMinutes: 100 })

    await PUT(putBody({ id: 'dem-001', spentMinutes: 100 }))

    const data = mockDb.timeEntry.create.mock.calls[0][0].data
    expect(data.minutes).toBe(40)
    expect(data.userId).toBe('user-test-123')
    expect(data.userName).toBe('Test User')
    expect(data.client).toBeNull()
  })
})
