import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated, mockUnauthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { GET } from '../route'

const sampleRows = [
  { id: 'te-1', minutes: 60, client: 'Acme', userName: 'Resp One', userId: 'resp-1', createdAt: new Date(), demanda: { id: 'd1', title: 'Card', teamId: 'team-geral', classification: 'vendas', companyId: 'company-defenz' } },
]

function get(searchParams?: Record<string, string>) {
  return createRequest('GET', { url: 'http://localhost:3000/api/time-entries', searchParams })
}

describe('GET /api/time-entries', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.timeEntry.findMany.mockResolvedValue(sampleRows)
  })

  it('admin: retorna lançamentos sem filtro de empresa (vê tudo)', async () => {
    mockAuthenticated() // admin
    const res = await GET(get())
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.entries).toHaveLength(1)
    expect(body.data.capped).toBe(false)

    const where = mockDb.timeEntry.findMany.mock.calls[0][0].where
    expect(where.demanda).toBeUndefined() // admin não escopa por empresa
  })

  it('gerência: escopa por conjunto via a demanda (companyId do ator)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz', companyIds: [] })
    await GET(get())
    const where = mockDb.timeEntry.findMany.mock.calls[0][0].where
    expect(where.demanda).toEqual({ is: { companyId: 'company-defenz' } })
  })

  it('gerência multi-empresa: escopa pelo conjunto (companyId IN)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz', companyIds: ['company-2', 'company-3'] })
    await GET(get())
    const where = mockDb.timeEntry.findMany.mock.calls[0][0].where
    expect(where.demanda).toEqual({ is: { companyId: { in: ['company-defenz', 'company-2', 'company-3'] } } })
  })

  it('gerência sem nenhuma empresa acessível (conjunto vazio) → bloqueia tudo (__none__)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: undefined, companyIds: [] })
    await GET(get())
    const where = mockDb.timeEntry.findMany.mock.calls[0][0].where
    expect(where.demanda).toEqual({ is: { companyId: '__none__' } })
  })

  it('aplica filtros de período (limites em America/Sao_Paulo), cliente, responsável e equipe', async () => {
    mockAuthenticated() // admin
    await GET(get({ from: '2026-06-01', to: '2026-06-08', client: 'Acme', userId: 'resp-1', teamId: 'team-geral' }))
    const where = mockDb.timeEntry.findMany.mock.calls[0][0].where
    expect(where.createdAt.gte).toEqual(new Date('2026-06-01T00:00:00.000-03:00'))
    expect(where.createdAt.lte).toEqual(new Date('2026-06-08T23:59:59.999-03:00'))
    expect(where.client).toBe('Acme')
    expect(where.userId).toBe('resp-1')
    expect(where.demanda).toEqual({ is: { teamId: 'team-geral' } })
  })

  it('gerência + filtro de equipe: escopo de empresa E equipe são ANDed (sem vazamento cross-company)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz', companyIds: [] })
    // teamId arbitrário (mesmo de outra empresa) não amplia além do conjunto: o AND com companyId vence
    await GET(get({ teamId: 'team-de-outra-empresa' }))
    const where = mockDb.timeEntry.findMany.mock.calls[0][0].where
    expect(where.demanda).toEqual({ is: { companyId: 'company-defenz', teamId: 'team-de-outra-empresa' } })
  })

  it('admin: filtra por empresa (companyId estreita livremente)', async () => {
    mockAuthenticated() // admin
    await GET(get({ companyId: 'company-2' }))
    const where = mockDb.timeEntry.findMany.mock.calls[0][0].where
    expect(where.demanda).toEqual({ is: { companyId: 'company-2' } })
  })

  it('gerência: companyId DENTRO do conjunto estreita o escopo', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz', companyIds: ['company-2'] })
    await GET(get({ companyId: 'company-2' }))
    const where = mockDb.timeEntry.findMany.mock.calls[0][0].where
    expect(where.demanda).toEqual({ is: { companyId: 'company-2' } })
  })

  it('gerência: companyId FORA do conjunto é IGNORADO (não escapa o escopo)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz', companyIds: ['company-2'] })
    await GET(get({ companyId: 'company-de-outra-empresa' }))
    const where = mockDb.timeEntry.findMany.mock.calls[0][0].where
    // mantém o conjunto acessível, sem aplicar o companyId estranho
    expect(where.demanda).toEqual({ is: { companyId: { in: ['company-defenz', 'company-2'] } } })
  })

  it('cliente "__none__" filtra lançamentos sem cliente', async () => {
    mockAuthenticated()
    await GET(get({ client: '__none__' }))
    const where = mockDb.timeEntry.findMany.mock.calls[0][0].where
    expect(where.client).toBeNull()
  })

  it('role user → 403', async () => {
    mockAuthenticated({ role: 'user' })
    const res = await GET(get())
    expect(res.status).toBe(403)
    expect(mockDb.timeEntry.findMany).not.toHaveBeenCalled()
  })

  it('não autenticado → 401', async () => {
    mockUnauthenticated()
    const res = await GET(get())
    expect(res.status).toBe(401)
  })
})
