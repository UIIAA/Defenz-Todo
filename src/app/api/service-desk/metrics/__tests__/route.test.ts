import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { GET } from '../route'

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated() // admin
})

describe('GET /api/service-desk/metrics', () => {
  it('retorna as métricas agregadas', async () => {
    mockDb.ticket.findMany.mockResolvedValue([
      {
        id: 't1', status: 'concluido',
        createdAt: new Date('2026-06-20T10:00:00Z'), resolvedAt: new Date('2026-06-20T12:00:00Z'),
        escalatedAt: new Date('2026-06-20T11:00:00Z'), escalatedTo: 'SecuriSoft',
        _count: { messages: 3 },
      },
      {
        id: 't2', status: 'solicitado',
        createdAt: new Date('2026-06-22T10:00:00Z'), resolvedAt: null,
        escalatedAt: null, escalatedTo: null, _count: { messages: 1 },
      },
    ])

    const res = await GET(createRequest('GET'))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.total).toBe(2)
    expect(json.data.backlog).toBe(1)
    expect(json.data.escalatedCount).toBe(1)
    expect(json.data.escalatedPct).toBeCloseTo(50)
    expect(json.data.avgRepliesPerTicket).toBeCloseTo(2)
    expect(json.data.escalatedByPartner).toEqual([{ partner: 'SecuriSoft', count: 1 }])
  })

  it('gerência: filtro scoped por empresa (companyScopeWhere aplicado)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-a', companyIds: [] })
    mockDb.ticket.findMany.mockResolvedValue([])
    await GET(createRequest('GET'))
    const where = mockDb.ticket.findMany.mock.calls[0][0].where
    expect(where.companyId).toBe('company-a')
  })
})
