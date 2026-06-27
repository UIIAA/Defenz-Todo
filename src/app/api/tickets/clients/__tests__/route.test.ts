import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated, mockUnauthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'

// Service Desk é Defenz-only: o escopo é resolvido pelo helper, não por companyScopeWhere.
vi.mock('@/lib/service-desk-server', () => ({
  resolveDefenzCompanyId: vi.fn().mockResolvedValue('company-defenz'),
}))
import { resolveDefenzCompanyId } from '@/lib/service-desk-server'
import { GET } from '../route'

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated() // admin, companyId='company-defenz'
  vi.mocked(resolveDefenzCompanyId).mockResolvedValue('company-defenz')
})

describe('GET /api/tickets/clients', () => {
  it('happy path — lista distinta de clientes (Demanda+Ticket), escopo fixo Defenz', async () => {
    mockDb.demanda.findMany.mockResolvedValue([{ client: 'Volix' }, { client: 'Bevicred' }])
    mockDb.ticket.findMany.mockResolvedValue([{ client: 'Bevicred' }, { client: 'Zenith Corp' }])

    const res = await GET(createRequest('GET'))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.clients).toEqual(['Bevicred', 'Volix', 'Zenith Corp'])
    expect(json.data.capped).toBe(false)
    // Escopo SEMPRE Defenz (não companyScopeWhere) — admin não vê clientes de outras empresas.
    expect(mockDb.demanda.findMany.mock.calls[0][0].where.companyId).toBe('company-defenz')
    expect(mockDb.ticket.findMany.mock.calls[0][0].where.companyId).toBe('company-defenz')
  })

  it('sad path — sem sessão retorna 401, sem query', async () => {
    mockUnauthenticated()
    const res = await GET(createRequest('GET'))
    expect(res.status).toBe(401)
    expect(mockDb.demanda.findMany).not.toHaveBeenCalled()
    expect(mockDb.ticket.findMany).not.toHaveBeenCalled()
  })

  it('usuário sem acesso a Defenz → 403, sem query', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-a', companyIds: [] })
    const res = await GET(createRequest('GET'))
    expect(res.status).toBe(403)
    expect(mockDb.demanda.findMany).not.toHaveBeenCalled()
    expect(mockDb.ticket.findMany).not.toHaveBeenCalled()
  })

  it('retorna lista vazia quando nenhum cliente cadastrado', async () => {
    mockDb.demanda.findMany.mockResolvedValue([])
    mockDb.ticket.findMany.mockResolvedValue([])
    const res = await GET(createRequest('GET'))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.clients).toEqual([])
    expect(json.data.capped).toBe(false)
  })

  it('ignora valores nulos ou strings vazias', async () => {
    mockDb.demanda.findMany.mockResolvedValue([
      { client: null }, { client: '' }, { client: '  ' }, { client: 'ValorValido' },
    ])
    mockDb.ticket.findMany.mockResolvedValue([])
    const res = await GET(createRequest('GET'))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.clients).toEqual(['ValorValido'])
  })
})
