import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { savedDemanda } from '@/test/fixtures/demandas'

vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn(),
  diffChanges: vi.fn(() => null),
}))

import { GET, POST, PUT, DELETE } from '../route'

const URL = 'http://localhost:3000/api/demandas'

beforeEach(() => {
  vi.clearAllMocks()
})

// ==================== GET (scoping por conjunto) ====================

describe('GET multi-empresa', () => {
  it('gerencia multi-empresa: where companyId IN do conjunto', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.demanda.findMany.mockResolvedValue([])
    await GET(createRequest('GET', { url: URL }))
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: { in: ['c1', 'c2'] } } })
    )
  })

  it('user multi-empresa: clauses FK/legacy usam companyId IN do conjunto', async () => {
    mockAuthenticated({
      id: 'u', role: 'user', teamIds: ['team-geral'], name: 'Leo',
      companyId: 'c1', companyIds: ['c2'],
    })
    mockDb.demanda.findMany.mockResolvedValue([])
    await GET(createRequest('GET', { url: URL }))
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { teamId: { in: ['team-geral'] } },
            { assignedToId: 'u', companyId: { in: ['c1', 'c2'] } },
            { assignee: 'Leo', companyId: { in: ['c1', 'c2'] }, assignedToId: null },
          ],
        },
      })
    )
  })

  it('gerencia pode estreitar por companyId dentro do conjunto', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.demanda.findMany.mockResolvedValue([])
    await GET(createRequest('GET', { url: `${URL}?companyId=c2` }))
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'c2' } })
    )
  })

  it('gerencia: filtro companyId FORA do conjunto é ignorado (mantém conjunto)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.demanda.findMany.mockResolvedValue([])
    await GET(createRequest('GET', { url: `${URL}?companyId=c3` }))
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: { in: ['c1', 'c2'] } } })
    )
  })
})

// ==================== POST (resolveActiveCompany) ====================

describe('POST multi-empresa', () => {
  it('cria na empresa pedida quando ela está no conjunto', async () => {
    mockAuthenticated({ id: 'u', role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.demanda.create.mockResolvedValue({ id: 'd', companyId: 'c2' })
    await POST(createRequest('POST', { url: URL, body: { title: 'X', companyId: 'c2' } }))
    expect(mockDb.demanda.create.mock.calls[0][0].data.companyId).toBe('c2')
  })

  it('usa a empresa primária quando companyId não é informado', async () => {
    mockAuthenticated({ id: 'u', role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.demanda.create.mockResolvedValue({ id: 'd', companyId: 'c1' })
    await POST(createRequest('POST', { url: URL, body: { title: 'X' } }))
    expect(mockDb.demanda.create.mock.calls[0][0].data.companyId).toBe('c1')
  })

  it('403 ao tentar criar em empresa fora do conjunto', async () => {
    mockAuthenticated({ id: 'u', role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    const res = await POST(createRequest('POST', { url: URL, body: { title: 'X', companyId: 'c3' } }))
    expect(res.status).toBe(403)
    expect(mockDb.demanda.create).not.toHaveBeenCalled()
  })
})

// ==================== PUT / DELETE (assertCompanyAccess) ====================

describe('PUT multi-empresa', () => {
  it('gerencia edita demanda de empresa do conjunto (200)', async () => {
    mockAuthenticated({ id: 'u', role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, companyId: 'c2', updatedAt: new Date() })
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, status: 'em_andamento' })
    const res = await PUT(createRequest('PUT', { url: URL, body: { id: 'd', status: 'em_andamento' } }))
    expect(res.status).toBe(200)
  })

  it('gerencia NÃO edita demanda fora do conjunto (403)', async () => {
    mockAuthenticated({ id: 'u', role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, companyId: 'c3', updatedAt: new Date() })
    const res = await PUT(createRequest('PUT', { url: URL, body: { id: 'd', status: 'em_andamento' } }))
    expect(res.status).toBe(403)
    expect(mockDb.demanda.update).not.toHaveBeenCalled()
  })
})

// ==================== lifecycle: dateDone ao concluir (server-side) ====================

describe('PUT — server seta dateDone ao concluir (para callers externos: MCP/curl)', () => {
  it('mover para concluida define dateDone quando ainda nula', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, status: 'em_andamento', dateDone: null, updatedAt: new Date() })
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, status: 'concluida' })
    const res = await PUT(createRequest('PUT', { url: URL, body: { id: 'd', status: 'concluida' } }))
    expect(res.status).toBe(200)
    const data = mockDb.demanda.update.mock.calls[0][0].data
    expect(data.dateDone).toBeInstanceOf(Date)
  })

  it('reabrir uma concluida limpa dateDone (comportamento existente preservado)', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, status: 'concluida', dateDone: new Date(), updatedAt: new Date() })
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, status: 'em_andamento' })
    const res = await PUT(createRequest('PUT', { url: URL, body: { id: 'd', status: 'em_andamento' } }))
    expect(res.status).toBe(200)
    const data = mockDb.demanda.update.mock.calls[0][0].data
    expect(data.dateDone).toBeNull()
  })

  it('respeita dateDone explícito do cliente ao concluir (não sobrescreve com hoje)', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, status: 'em_andamento', dateDone: null, updatedAt: new Date() })
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, status: 'concluida' })
    const res = await PUT(createRequest('PUT', { url: URL, body: { id: 'd', status: 'concluida', dateDone: '2026-01-15' } }))
    expect(res.status).toBe(200)
    const data = mockDb.demanda.update.mock.calls[0][0].data
    // usou a data explícita do cliente, não "hoje"
    expect((data.dateDone as Date).toISOString().slice(0, 10)).toBe('2026-01-15')
  })

  it('não sobrescreve dateDone se a demanda já estava concluida', async () => {
    mockAuthenticated({ role: 'admin' })
    const existing = new Date('2026-01-01T00:00:00.000Z')
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, status: 'concluida', dateDone: existing, updatedAt: new Date() })
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, status: 'concluida' })
    const res = await PUT(createRequest('PUT', { url: URL, body: { id: 'd', priority: 'alta' } }))
    expect(res.status).toBe(200)
    const data = mockDb.demanda.update.mock.calls[0][0].data
    // status não mudou para concluida (já era) → não toca dateDone
    expect(data.dateDone).toBeUndefined()
  })
})

describe('DELETE multi-empresa', () => {
  it('gerencia deleta demanda de empresa do conjunto (200)', async () => {
    mockAuthenticated({ id: 'u', role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, companyId: 'c2' })
    mockDb.demanda.delete.mockResolvedValue(savedDemanda)
    const res = await DELETE(createRequest('DELETE', { url: URL, searchParams: { id: 'd' } }))
    expect(res.status).toBe(200)
  })

  it('gerencia NÃO deleta demanda fora do conjunto (403)', async () => {
    mockAuthenticated({ id: 'u', role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, companyId: 'c3' })
    const res = await DELETE(createRequest('DELETE', { url: URL, searchParams: { id: 'd' } }))
    expect(res.status).toBe(403)
    expect(mockDb.demanda.delete).not.toHaveBeenCalled()
  })
})
