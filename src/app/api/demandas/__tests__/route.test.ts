import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import {
  getCurrentUser,
  mockAuthenticated,
  mockUnauthenticated,
} from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { savedDemanda, demandaList, validDemanda } from '@/test/fixtures/demandas'

import { GET, POST, PUT, DELETE } from '../route'

describe('GET /api/demandas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without authentication', async () => {
    mockUnauthenticated()
    const req = createRequest('GET', { url: 'http://localhost:3000/api/demandas' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns demandas for authenticated admin (all companies/teams)', async () => {
    mockAuthenticated()
    mockDb.demanda.findMany.mockResolvedValue(demandaList)
    const req = createRequest('GET', { url: 'http://localhost:3000/api/demandas' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(demandaList.length)
    // Admin sem filtro = ve tudo (where vazio)
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } }, subtasks: { orderBy: { position: 'asc' } } },
    })
  })

  it('filters by companyId for admin when param provided', async () => {
    mockAuthenticated()
    mockDb.demanda.findMany.mockResolvedValue([demandaList[0]])
    const req = createRequest('GET', { url: 'http://localhost:3000/api/demandas?companyId=company-other' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'company-other' } })
    )
  })

  it('filters by teamId for admin when param provided', async () => {
    mockAuthenticated()
    mockDb.demanda.findMany.mockResolvedValue([demandaList[0]])
    const req = createRequest('GET', { url: 'http://localhost:3000/api/demandas?teamId=team-other' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teamId: 'team-other' } })
    )
  })

  it('restricts gerencia to own company', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz' })
    mockDb.demanda.findMany.mockResolvedValue(demandaList)
    const req = createRequest('GET', { url: 'http://localhost:3000/api/demandas' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 'company-defenz' } })
    )
  })

  it('restricts user to own teamIds', async () => {
    mockAuthenticated({ role: 'user', teamIds: ['team-geral'] })
    mockDb.demanda.findMany.mockResolvedValue(demandaList)
    const req = createRequest('GET', { url: 'http://localhost:3000/api/demandas' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { teamId: { in: ['team-geral'] } } })
    )
  })

  it('returns empty for user with no teams', async () => {
    mockAuthenticated({ role: 'user', teamIds: [] })
    const req = createRequest('GET', { url: 'http://localhost:3000/api/demandas' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
    // Should NOT call findMany
    expect(mockDb.demanda.findMany).not.toHaveBeenCalled()
  })
})

describe('POST /api/demandas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates demanda with valid data (201)', async () => {
    mockAuthenticated()
    mockDb.demanda.create.mockResolvedValue(savedDemanda)
    const req = createRequest('POST', {
      body: validDemanda,
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 401 without auth', async () => {
    mockUnauthenticated()
    const req = createRequest('POST', {
      body: validDemanda,
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 with empty title', async () => {
    mockAuthenticated()
    const req = createRequest('POST', {
      body: { ...validDemanda, title: '' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 with invalid origin', async () => {
    mockAuthenticated()
    const req = createRequest('POST', {
      body: { ...validDemanda, origin: 'invalida' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('applies defaults for optional fields', async () => {
    mockAuthenticated()
    mockDb.demanda.create.mockResolvedValue(savedDemanda)
    const req = createRequest('POST', {
      body: { title: 'Minimal' },
      url: 'http://localhost:3000/api/demandas',
    })
    await POST(req)
    const createCall = mockDb.demanda.create.mock.calls[0][0]
    expect(createCall.data.origin).toBe('outra')
    expect(createCall.data.status).toBe('solicitada')
    expect(createCall.data.priority).toBe('media')
  })

  it('sets companyId and teamId from user session', async () => {
    mockAuthenticated({ companyId: 'company-defenz', teamIds: ['team-geral'] })
    mockDb.demanda.create.mockResolvedValue(savedDemanda)
    const req = createRequest('POST', {
      body: { title: 'Test company' },
      url: 'http://localhost:3000/api/demandas',
    })
    await POST(req)
    const createCall = mockDb.demanda.create.mock.calls[0][0]
    expect(createCall.data.companyId).toBe('company-defenz')
    expect(createCall.data.teamId).toBe('team-geral')
  })

  it('creates demanda with null assignee (201)', async () => {
    mockAuthenticated()
    mockDb.demanda.create.mockResolvedValue({ ...savedDemanda, assignee: null })
    const req = createRequest('POST', {
      body: { ...validDemanda, assignee: null },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
  })

  it('creates demanda with classification + null assignee (201)', async () => {
    mockAuthenticated()
    mockDb.demanda.create.mockResolvedValue({ ...savedDemanda, assignee: null, classification: 'marketing' })
    const req = createRequest('POST', {
      body: { title: 'Marketing task', classification: 'marketing', assignee: null },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('uses new Date() when dateIn not provided', async () => {
    mockAuthenticated()
    mockDb.demanda.create.mockResolvedValue(savedDemanda)
    const before = Date.now()
    const req = createRequest('POST', {
      body: { title: 'No date' },
      url: 'http://localhost:3000/api/demandas',
    })
    await POST(req)
    const createCall = mockDb.demanda.create.mock.calls[0][0]
    const dateIn = createCall.data.dateIn as Date
    expect(dateIn.getTime()).toBeGreaterThanOrEqual(before)
  })
})

describe('PUT /api/demandas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates demanda with partial data', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, status: 'concluida' })
    const req = createRequest('PUT', {
      body: { id: 'dem-001', status: 'concluida' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
  })

  it('scopes update to userId', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    mockDb.demanda.update.mockResolvedValue(savedDemanda)
    const req = createRequest('PUT', {
      body: { id: 'dem-001', title: 'Updated' },
      url: 'http://localhost:3000/api/demandas',
    })
    await PUT(req)
    const where = mockDb.demanda.update.mock.calls[0][0].where
    expect(where).toEqual({ id: 'dem-001' })
  })

  it('returns 400 without id', async () => {
    mockAuthenticated()
    const req = createRequest('PUT', {
      body: { title: 'No ID' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  // --- Optimistic locking tests ---

  it('returns 200 when updatedAt matches current record', async () => {
    mockAuthenticated()
    const currentUpdatedAt = new Date('2025-01-15T00:00:00.000Z')
    mockDb.demanda.findUnique.mockResolvedValue({
      ...savedDemanda,
      updatedAt: currentUpdatedAt,
    })
    mockDb.demanda.update.mockResolvedValue({
      ...savedDemanda,
      title: 'Updated title',
      updatedAt: new Date(),
    })

    const req = createRequest('PUT', {
      body: {
        id: 'dem-001',
        title: 'Updated title',
        updatedAt: '2025-01-15T00:00:00.000Z',
      },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
  })

  it('returns 409 when updatedAt diverges (optimistic locking conflict)', async () => {
    mockAuthenticated()
    const currentRecord = {
      ...savedDemanda,
      updatedAt: new Date('2025-01-20T00:00:00.000Z'),
    }
    mockDb.demanda.findUnique.mockResolvedValue(currentRecord)

    const req = createRequest('PUT', {
      body: {
        id: 'dem-001',
        title: 'Stale update',
        updatedAt: '2025-01-15T00:00:00.000Z',
      },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.success).toBe(false)
    expect(body.data).toBeDefined()
    expect(body.data.updatedAt).toBeDefined()
  })

  it('works normally when updatedAt is not provided (backwards compatible)', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, status: 'em_andamento' })

    const req = createRequest('PUT', {
      body: { id: 'dem-001', status: 'em_andamento' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    expect(mockDb.demanda.findUnique).toHaveBeenCalled()
  })

  it('saves previousStatus when moving to bloqueada', async () => {
    mockAuthenticated()
    const current = { ...savedDemanda, status: 'em_andamento' }
    mockDb.demanda.findUnique.mockResolvedValue(current)
    mockDb.demanda.update.mockResolvedValue({ ...current, status: 'bloqueada', previousStatus: 'em_andamento' })

    const req = createRequest('PUT', {
      body: { id: 'dem-001', status: 'bloqueada' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    const updateData = mockDb.demanda.update.mock.calls[0][0].data
    expect(updateData.previousStatus).toBe('em_andamento')
  })

  it('clears previousStatus when unblocking', async () => {
    mockAuthenticated()
    const current = { ...savedDemanda, status: 'bloqueada', previousStatus: 'em_andamento' }
    mockDb.demanda.findUnique.mockResolvedValue(current)
    mockDb.demanda.update.mockResolvedValue({ ...current, status: 'selecionada', previousStatus: null })

    const req = createRequest('PUT', {
      body: { id: 'dem-001', status: 'selecionada' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    const updateData = mockDb.demanda.update.mock.calls[0][0].data
    expect(updateData.previousStatus).toBeNull()
  })

  it('updates demanda with classification field', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, classification: 'marketing' })

    const req = createRequest('PUT', {
      body: { id: 'dem-001', classification: 'marketing' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    const updateData = mockDb.demanda.update.mock.calls[0][0].data
    expect(updateData.classification).toBe('marketing')
  })

  it('clears classification when set to null', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, classification: 'vendas' })
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, classification: null })

    const req = createRequest('PUT', {
      body: { id: 'dem-001', classification: null },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    const updateData = mockDb.demanda.update.mock.calls[0][0].data
    expect(updateData.classification).toBeNull()
  })

  // --- Authorization tests: 3 levels ---

  it('returns 403 when user edits demanda from another team', async () => {
    mockAuthenticated({ role: 'user', teamIds: ['team-geral'] })
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, teamId: 'team-other' })
    const req = createRequest('PUT', {
      body: { id: 'dem-001', title: 'Hacked' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(403)
  })

  it('returns 403 when gerencia edits demanda from another company', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz' })
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, companyId: 'company-other' })
    const req = createRequest('PUT', {
      body: { id: 'dem-001', title: 'Hacked' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(403)
  })

  it('allows admin to edit any demanda', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, companyId: 'company-other', teamId: 'team-other' })
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, title: 'Admin edit' })
    const req = createRequest('PUT', {
      body: { id: 'dem-001', title: 'Admin edit' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
  })

  it('does not set previousStatus when moving between normal statuses', async () => {
    mockAuthenticated()
    const current = { ...savedDemanda, status: 'solicitada' }
    mockDb.demanda.findUnique.mockResolvedValue(current)
    mockDb.demanda.update.mockResolvedValue({ ...current, status: 'em_andamento' })

    const req = createRequest('PUT', {
      body: { id: 'dem-001', status: 'em_andamento' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    const updateData = mockDb.demanda.update.mock.calls[0][0].data
    expect(updateData.previousStatus).toBeUndefined()
  })
})

describe('DELETE /api/demandas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes demanda by id', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    mockDb.demanda.delete.mockResolvedValue(savedDemanda)
    const req = createRequest('DELETE', {
      searchParams: { id: 'dem-001' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
  })

  it('returns 403 when user deletes demanda from another team', async () => {
    mockAuthenticated({ role: 'user', teamIds: ['team-geral'] })
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, teamId: 'team-other' })
    const req = createRequest('DELETE', {
      searchParams: { id: 'dem-001' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await DELETE(req)
    expect(res.status).toBe(403)
  })

  it('returns 403 when gerencia deletes demanda from another company', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz' })
    mockDb.demanda.findUnique.mockResolvedValue({ ...savedDemanda, companyId: 'company-other' })
    const req = createRequest('DELETE', {
      searchParams: { id: 'dem-001' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await DELETE(req)
    expect(res.status).toBe(403)
  })

  it('returns 400 without id', async () => {
    mockAuthenticated()
    const req = createRequest('DELETE', {
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await DELETE(req)
    expect(res.status).toBe(400)
  })

  it('returns 401 without auth', async () => {
    mockUnauthenticated()
    const req = createRequest('DELETE', {
      searchParams: { id: 'dem-001' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await DELETE(req)
    expect(res.status).toBe(401)
  })

  it('scopes delete to userId', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    mockDb.demanda.delete.mockResolvedValue(savedDemanda)
    const req = createRequest('DELETE', {
      searchParams: { id: 'dem-001' },
      url: 'http://localhost:3000/api/demandas',
    })
    await DELETE(req)
    const where = mockDb.demanda.delete.mock.calls[0][0].where
    expect(where).toEqual({ id: 'dem-001' })
  })
})
