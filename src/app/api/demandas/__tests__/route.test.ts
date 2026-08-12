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
    // Admin sem filtro = ve tudo (where vazio), com o teto de segurança (I5)
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } }, subtasks: { orderBy: { position: 'asc' } }, links: { orderBy: { position: 'asc' } } },
      take: 2000,
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

  it('restricts user to teams OR assignedToId (FK + tenant) OR legacy assignee fallback', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: ['team-geral'], name: 'Leonardo', companyId: 'company-defenz' })
    mockDb.demanda.findMany.mockResolvedValue(demandaList)
    const req = createRequest('GET', { url: 'http://localhost:3000/api/demandas' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { teamId: { in: ['team-geral'] } },
            { assignedToId: 'user-leo', companyId: 'company-defenz' },
            { assignee: 'Leonardo', companyId: 'company-defenz', assignedToId: null },
          ],
        },
      })
    )
  })

  it('user without team but with assignedToId match: queries by FK with tenant guard (and legacy fallback)', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: [], name: 'Leonardo', companyId: 'company-defenz' })
    mockDb.demanda.findMany.mockResolvedValue([{ ...savedDemanda, assignedToId: 'user-leo', teamId: 'team-other' }])
    const req = createRequest('GET', { url: 'http://localhost:3000/api/demandas' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { assignedToId: 'user-leo', companyId: 'company-defenz' },
            { assignee: 'Leonardo', companyId: 'company-defenz', assignedToId: null },
          ],
        },
      })
    )
  })

  it('user without team and without name nor email queries only by FK (with tenant guard)', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: [], name: null, email: null, companyId: 'company-defenz' })
    mockDb.demanda.findMany.mockResolvedValue([])
    const req = createRequest('GET', { url: 'http://localhost:3000/api/demandas' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ assignedToId: 'user-leo', companyId: 'company-defenz' }] },
      })
    )
  })

  it('user without companyId: BOTH FK and legacy fallback dropped (tenant guard strict)', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: ['team-geral'], name: 'Test User', companyId: undefined })
    mockDb.demanda.findMany.mockResolvedValue([])
    const req = createRequest('GET', { url: 'http://localhost:3000/api/demandas' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [{ teamId: { in: ['team-geral'] } }],
        },
      })
    )
  })

  it('user with no team and no companyId returns []', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: [], name: null, email: null, companyId: undefined })
    const req = createRequest('GET', { url: 'http://localhost:3000/api/demandas' })
    const res = await GET(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual([])
    expect(mockDb.demanda.findMany).not.toHaveBeenCalled()
  })

  it('legacy fallback uses email when name is null (FK still tenant-guarded)', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: [], name: null, email: 'leo@example.com', companyId: 'company-defenz' })
    mockDb.demanda.findMany.mockResolvedValue([])
    const req = createRequest('GET', { url: 'http://localhost:3000/api/demandas' })
    await GET(req)
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { assignedToId: 'user-leo', companyId: 'company-defenz' },
            { assignee: 'leo@example.com', companyId: 'company-defenz', assignedToId: null },
          ],
        },
      })
    )
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

  it('POST without assignedToId stores assignee string only (legacy flow)', async () => {
    mockAuthenticated({ id: 'user-marcos', role: 'admin', companyId: 'company-defenz' })
    mockDb.demanda.create.mockResolvedValue({ ...savedDemanda, assignedToId: null, assignee: 'Free String' })
    const req = createRequest('POST', {
      body: { title: 'Legacy', assignee: 'Free String' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(mockDb.user.findUnique).not.toHaveBeenCalled()
    const createCall = mockDb.demanda.create.mock.calls[0][0]
    expect(createCall.data.assignedToId).toBeNull()
    expect(createCall.data.assignee).toBe('Free String')
  })

  it('POST with neither assignee nor assignedToId stores both as null', async () => {
    mockAuthenticated({ id: 'user-marcos', role: 'admin', companyId: 'company-defenz' })
    mockDb.demanda.create.mockResolvedValue({ ...savedDemanda, assignedToId: null, assignee: null })
    const req = createRequest('POST', {
      body: { title: 'No assignee at all' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const createCall = mockDb.demanda.create.mock.calls[0][0]
    expect(createCall.data.assignedToId).toBeNull()
    expect(createCall.data.assignee).toBeNull()
  })

  it('POST with both assignedToId and assignee string: FK takes precedence (server overwrites string)', async () => {
    mockAuthenticated({ id: 'user-marcos', role: 'admin', companyId: 'company-defenz' })
    mockDb.user.findUnique.mockResolvedValue({
      id: 'user-leo',
      name: 'Leonardo Real',
      email: 'leo@example.com',
      companyId: 'company-defenz',
    })
    mockDb.demanda.create.mockResolvedValue({ ...savedDemanda, assignedToId: 'user-leo', assignee: 'Leonardo Real' })
    const req = createRequest('POST', {
      body: { title: 'Both fields', assignedToId: 'user-leo', assignee: 'Leo Apelido' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const createCall = mockDb.demanda.create.mock.calls[0][0]
    expect(createCall.data.assignedToId).toBe('user-leo')
    // Server resolves from User and overwrites the string
    expect(createCall.data.assignee).toBe('Leonardo Real')
  })

  it('POST with assignedToId resolves user (same company) and auto-populates assignee string', async () => {
    mockAuthenticated({ id: 'user-marcos', role: 'user', companyId: 'company-defenz', teamIds: ['team-a'] })
    mockDb.user.findUnique.mockResolvedValue({
      id: 'user-leo',
      name: 'Leonardo',
      email: 'leo@example.com',
      companyId: 'company-defenz',
    })
    mockDb.demanda.create.mockResolvedValue({ ...savedDemanda, assignedToId: 'user-leo', assignee: 'Leonardo' })
    const req = createRequest('POST', {
      body: { title: 'FK demanda', assignedToId: 'user-leo' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    expect(mockDb.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-leo' } })
    const createCall = mockDb.demanda.create.mock.calls[0][0]
    expect(createCall.data.assignedToId).toBe('user-leo')
    expect(createCall.data.assignee).toBe('Leonardo')
  })

  it('POST returns 403 when assignedToId points to user in another company (tenant guard)', async () => {
    mockAuthenticated({ id: 'user-marcos', role: 'user', companyId: 'company-defenz', teamIds: ['team-a'] })
    mockDb.user.findUnique.mockResolvedValue({
      id: 'user-cross',
      name: 'Cross-Company',
      email: 'cross@example.com',
      companyId: 'company-other',
    })
    const req = createRequest('POST', {
      body: { title: 'Hack via FK', assignedToId: 'user-cross' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(403)
    expect(mockDb.demanda.create).not.toHaveBeenCalled()
  })

  it('POST returns 400 when assignedToId references a non-existent user', async () => {
    mockAuthenticated({ id: 'user-marcos', role: 'user', companyId: 'company-defenz', teamIds: ['team-a'] })
    mockDb.user.findUnique.mockResolvedValue(null)
    const req = createRequest('POST', {
      body: { title: 'Bad FK', assignedToId: 'cknopxlbz0000aaaabbbbccccdef' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
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

  // --- Time tracking ---

  it('persists spentMinutes/estimatedMinutes on update', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, spentMinutes: 90 })
    const req = createRequest('PUT', {
      body: { id: 'dem-001', spentMinutes: 90, estimatedMinutes: 480 },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    const updateData = mockDb.demanda.update.mock.calls[0][0].data
    expect(updateData.spentMinutes).toBe(90)
    expect(updateData.estimatedMinutes).toBe(480)
  })

  it('returns 400 when spentMinutes is negative', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    const req = createRequest('PUT', {
      body: { id: 'dem-001', spentMinutes: -10 },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  // --- Dependências ---

  it('persists dependsOn (valid, no cycle)', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    mockDb.demanda.findMany.mockResolvedValue([
      { id: 'dem-001', dependsOn: '[]' },
      { id: 'dep-002', dependsOn: '[]' },
    ])
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, dependsOn: '["dep-002"]' })
    const req = createRequest('PUT', {
      body: { id: 'dem-001', dependsOn: ['dep-002'] },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    const updateData = mockDb.demanda.update.mock.calls[0][0].data
    expect(updateData.dependsOn).toBe(JSON.stringify(['dep-002']))
  })

  it('returns 400 on self-dependency', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    const req = createRequest('PUT', {
      body: { id: 'dem-001', dependsOn: ['dem-001'] },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 on dependency cycle', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    mockDb.demanda.findMany.mockResolvedValue([
      { id: 'dem-001', dependsOn: '[]' },
      { id: 'dep-002', dependsOn: '["dem-001"]' }, // dep-002 já depende de dem-001
    ])
    const req = createRequest('PUT', {
      body: { id: 'dem-001', dependsOn: ['dep-002'] }, // criaria dem-001 → dep-002 → dem-001
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
    expect(mockDb.demanda.update).not.toHaveBeenCalled()
  })

  it('returns 400 on invalid dependency id', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    mockDb.demanda.findMany.mockResolvedValue([{ id: 'dem-001', dependsOn: '[]' }])
    const req = createRequest('PUT', {
      body: { id: 'dem-001', dependsOn: ['ghost-id'] },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  // --- Authorization tests: 3 levels ---

  it('returns 403 when user edits demanda from another team and is neither FK nor legacy assignee', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: ['team-geral'], name: 'Leonardo', companyId: 'company-defenz' })
    mockDb.demanda.findUnique.mockResolvedValue({
      ...savedDemanda,
      teamId: 'team-other',
      assignedToId: 'user-other',
      assignee: 'Outra Pessoa',
      companyId: 'company-defenz',
    })
    const req = createRequest('PUT', {
      body: { id: 'dem-001', title: 'Hacked' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(403)
  })

  it('allows user to edit demanda from another team when assignedToId === user.id (FK path)', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: ['team-geral'], name: 'Leonardo', companyId: 'company-defenz' })
    mockDb.demanda.findUnique.mockResolvedValue({
      ...savedDemanda,
      teamId: 'team-other',
      assignedToId: 'user-leo',
      assignee: 'Leonardo',
      companyId: 'company-defenz',
    })
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, status: 'em_andamento' })
    const req = createRequest('PUT', {
      body: { id: 'dem-001', status: 'em_andamento' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
  })

  it('allows user to edit legacy demanda where assignedToId is null and assignee string matches (legacy fallback)', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: ['team-geral'], name: 'Leonardo', companyId: 'company-defenz' })
    mockDb.demanda.findUnique.mockResolvedValue({
      ...savedDemanda,
      teamId: 'team-other',
      assignedToId: null,
      assignee: 'Leonardo',
      companyId: 'company-defenz',
    })
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, status: 'em_andamento' })
    const req = createRequest('PUT', {
      body: { id: 'dem-001', status: 'em_andamento' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
  })

  it('FK takes precedence: when assignedToId belongs to other user, string match does NOT authorize', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: ['team-geral'], name: 'Leonardo', companyId: 'company-defenz' })
    mockDb.demanda.findUnique.mockResolvedValue({
      ...savedDemanda,
      teamId: 'team-other',
      assignedToId: 'user-other',
      assignee: 'Leonardo',
      companyId: 'company-defenz',
    })
    const req = createRequest('PUT', {
      body: { id: 'dem-001', title: 'Hacked via legacy string' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(403)
  })

  it('PUT with assignedToId=null clears both FK and assignee string', async () => {
    mockAuthenticated({ id: 'user-marcos', role: 'admin' })
    mockDb.demanda.findUnique.mockResolvedValue({
      ...savedDemanda,
      assignedToId: 'user-leo',
      assignee: 'Leonardo',
    })
    mockDb.demanda.update.mockResolvedValue(savedDemanda)
    const req = createRequest('PUT', {
      body: { id: 'dem-001', assignedToId: null },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    const updateData = mockDb.demanda.update.mock.calls[0][0].data
    expect(updateData.assignedToId).toBeNull()
    expect(updateData.assignee).toBeNull()
  })

  it('PUT with assignedToId resolves new user and updates both FK and assignee string', async () => {
    mockAuthenticated({ id: 'user-marcos', role: 'admin', companyId: 'company-defenz' })
    mockDb.demanda.findUnique.mockResolvedValue({
      ...savedDemanda,
      assignedToId: null,
      assignee: null,
    })
    mockDb.user.findUnique.mockResolvedValue({
      id: 'user-leo',
      name: 'Leonardo',
      email: 'leo@example.com',
      companyId: 'company-defenz',
    })
    mockDb.demanda.update.mockResolvedValue(savedDemanda)
    const req = createRequest('PUT', {
      body: { id: 'dem-001', assignedToId: 'user-leo' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    const updateData = mockDb.demanda.update.mock.calls[0][0].data
    expect(updateData.assignedToId).toBe('user-leo')
    expect(updateData.assignee).toBe('Leonardo')
  })

  it('PUT non-admin cannot reassign to user from another company', async () => {
    mockAuthenticated({ id: 'user-mgr', role: 'gerencia', companyId: 'company-defenz' })
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    mockDb.user.findUnique.mockResolvedValue({
      id: 'user-cross',
      name: 'Cross-Company',
      email: 'cross@example.com',
      companyId: 'company-other',
    })
    const req = createRequest('PUT', {
      body: { id: 'dem-001', assignedToId: 'user-cross' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(403)
    expect(mockDb.demanda.update).not.toHaveBeenCalled()
  })

  it('returns 403 when FK match is in another company (tenant guard)', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: [], name: 'Leonardo', companyId: 'company-defenz' })
    mockDb.demanda.findUnique.mockResolvedValue({
      ...savedDemanda,
      teamId: null,
      assignedToId: 'user-leo',
      assignee: 'Leonardo',
      companyId: 'company-other',
    })
    const req = createRequest('PUT', {
      body: { id: 'dem-001', title: 'Cross-company hack' },
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

  it('returns 403 when user deletes demanda from another team with no FK/legacy match', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: ['team-geral'], name: 'Leonardo', companyId: 'company-defenz' })
    mockDb.demanda.findUnique.mockResolvedValue({
      ...savedDemanda,
      teamId: 'team-other',
      assignedToId: 'user-other',
      assignee: 'Outra Pessoa',
      companyId: 'company-defenz',
    })
    const req = createRequest('DELETE', {
      searchParams: { id: 'dem-001' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await DELETE(req)
    expect(res.status).toBe(403)
  })

  it('allows user to delete demanda when assignedToId === user.id (FK path)', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: ['team-geral'], name: 'Leonardo', companyId: 'company-defenz' })
    mockDb.demanda.findUnique.mockResolvedValue({
      ...savedDemanda,
      teamId: 'team-other',
      assignedToId: 'user-leo',
      companyId: 'company-defenz',
    })
    mockDb.demanda.delete.mockResolvedValue(savedDemanda)
    const req = createRequest('DELETE', {
      searchParams: { id: 'dem-001' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
  })

  it('allows user to delete legacy demanda where assignedToId is null and assignee matches', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: ['team-geral'], name: 'Leonardo', companyId: 'company-defenz' })
    mockDb.demanda.findUnique.mockResolvedValue({
      ...savedDemanda,
      teamId: 'team-other',
      assignedToId: null,
      assignee: 'Leonardo',
      companyId: 'company-defenz',
    })
    mockDb.demanda.delete.mockResolvedValue(savedDemanda)
    const req = createRequest('DELETE', {
      searchParams: { id: 'dem-001' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
  })

  it('returns 403 when FK match is in another company (DELETE tenant guard)', async () => {
    mockAuthenticated({ id: 'user-leo', role: 'user', teamIds: [], name: 'Leonardo', companyId: 'company-defenz' })
    mockDb.demanda.findUnique.mockResolvedValue({
      ...savedDemanda,
      teamId: null,
      assignedToId: 'user-leo',
      companyId: 'company-other',
    })
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
