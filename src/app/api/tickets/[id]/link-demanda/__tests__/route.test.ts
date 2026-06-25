import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { POST } from '../route'

const params = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  vi.clearAllMocks()
})

describe('POST /api/tickets/[id]/link-demanda', () => {
  it('vincula demanda da mesma empresa', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-a', companyIds: [] })
    mockDb.ticket.findUnique.mockResolvedValue({ id: 't1', companyId: 'company-a', demandaId: null })
    mockDb.demanda.findUnique.mockResolvedValue({ id: 'd1', companyId: 'company-a' })
    mockDb.ticket.update.mockResolvedValue({ id: 't1', demandaId: 'd1' })

    const res = await POST(createRequest('POST', { body: { demandaId: 'd1' } }), params('t1'))
    expect(res.status).toBe(200)
    expect(mockDb.ticket.update.mock.calls[0][0].data.demandaId).toBe('d1')
  })

  it('demanda de outra empresa → 403 (tenant guard no alvo)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-a', companyIds: [] })
    mockDb.ticket.findUnique.mockResolvedValue({ id: 't1', companyId: 'company-a', demandaId: null })
    mockDb.demanda.findUnique.mockResolvedValue({ id: 'd1', companyId: 'company-b' })

    const res = await POST(createRequest('POST', { body: { demandaId: 'd1' } }), params('t1'))
    expect(res.status).toBe(403)
    expect(mockDb.ticket.update).not.toHaveBeenCalled()
  })
})
