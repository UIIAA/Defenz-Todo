import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { POST } from '../route'

const params = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated() // admin, companyId: 'company-defenz'
})

describe('POST /api/tickets/[id]/open-demanda', () => {
  it('happy: cria Demanda a partir do ticket e seta ticket.demandaId', async () => {
    // Ticket sem demanda vinculada
    mockDb.ticket.findUnique.mockResolvedValue({
      id: 't1',
      companyId: 'company-defenz',
      subject: 'Exclusão de arquivo em política',
      description: 'Cliente relatou falso positivo',
      client: 'Bevicred',
      demandaId: null,
    })
    mockDb.demanda.create.mockResolvedValue({
      id: 'd1',
      companyId: 'company-defenz',
      title: 'Exclusão de arquivo em política',
      description: 'Cliente relatou falso positivo',
      client: 'Bevicred',
      status: 'solicitada',
    })
    mockDb.ticket.update.mockResolvedValue({
      id: 't1',
      companyId: 'company-defenz',
      demandaId: 'd1',
    })

    const res = await POST(createRequest('POST'), params('t1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.demanda.id).toBe('d1')
    expect(body.data.demanda.status).toBe('solicitada')
    expect(body.data.demanda.client).toBe('Bevicred')

    // Demanda criada com campos herdados do ticket + criador (FK NOT NULL)
    const createCall = mockDb.demanda.create.mock.calls[0][0].data
    expect(createCall.companyId).toBe('company-defenz')
    expect(createCall.userId).toBe('user-test-123')
    expect(createCall.title).toBe('Exclusão de arquivo em política')
    expect(createCall.description).toBe('Cliente relatou falso positivo')
    expect(createCall.client).toBe('Bevicred')
    expect(createCall.status).toBe('solicitada')

    // Ticket atualizado com demandaId
    const updateCall = mockDb.ticket.update.mock.calls[0][0]
    expect(updateCall.where.id).toBe('t1')
    expect(updateCall.data.demandaId).toBe('d1')

    // Auditoria: CREATE da Demanda + LINK no Ticket (2 logs)
    expect(mockDb.auditLog.create).toHaveBeenCalledTimes(2)
    const actions = mockDb.auditLog.create.mock.calls.map((c) => c[0].data.action)
    expect(actions).toContain('CREATE')
    expect(actions).toContain('LINK')
    const linkCall = mockDb.auditLog.create.mock.calls.find((c) => c[0].data.action === 'LINK')![0].data
    expect(linkCall.entityType).toBe('Ticket')
    expect(linkCall.entityId).toBe('t1')
  })

  it('sad: ticket já tem demandaId → 409 amigável, não cria demanda órfã', async () => {
    mockDb.ticket.findUnique.mockResolvedValue({
      id: 't1',
      companyId: 'company-defenz',
      subject: 'Ticket já vinculado',
      description: null,
      client: null,
      demandaId: 'd-existing',
    })

    const res = await POST(createRequest('POST'), params('t1'))
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.success).toBe(false)
    expect(body.error).toMatch(/já tem demanda/i)

    // Nenhuma demanda criada
    expect(mockDb.demanda.create).not.toHaveBeenCalled()
    expect(mockDb.ticket.update).not.toHaveBeenCalled()
    expect(mockDb.auditLog.create).not.toHaveBeenCalled()
  })

  it('sad: ticket de outra empresa → 403', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-a', companyIds: [] })
    mockDb.ticket.findUnique.mockResolvedValue({
      id: 't1',
      companyId: 'company-b', // empresa diferente
      subject: 'Ticket alienígena',
      description: null,
      client: null,
      demandaId: null,
    })

    const res = await POST(createRequest('POST'), params('t1'))
    expect(res.status).toBe(403)

    // Nenhuma escrita feita
    expect(mockDb.demanda.create).not.toHaveBeenCalled()
    expect(mockDb.ticket.update).not.toHaveBeenCalled()
  })

  it('sad: ticket inexistente → 404', async () => {
    mockDb.ticket.findUnique.mockResolvedValue(null)

    const res = await POST(createRequest('POST'), params('nope'))
    expect(res.status).toBe(404)
    expect(mockDb.demanda.create).not.toHaveBeenCalled()
  })
})
