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
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns demandas for authenticated user', async () => {
    mockAuthenticated()
    mockDb.demanda.findMany.mockResolvedValue(demandaList)
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data).toHaveLength(demandaList.length)
    expect(body.data[0].id).toBe(demandaList[0].id)
    expect(mockDb.demanda.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-test-123' },
      orderBy: { createdAt: 'desc' },
    })
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
    expect(where).toEqual({ id: 'dem-001', userId: 'user-test-123' })
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

  // --- Optimistic locking tests (TDD — RED until implemented) ---

  it('returns 200 when updatedAt matches current record', async () => {
    mockAuthenticated()
    const currentUpdatedAt = new Date('2025-01-15T00:00:00.000Z')
    // findUnique returns the current record with matching updatedAt
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
      updatedAt: new Date('2025-01-20T00:00:00.000Z'), // DB has newer version
    }
    mockDb.demanda.findUnique.mockResolvedValue(currentRecord)

    const req = createRequest('PUT', {
      body: {
        id: 'dem-001',
        title: 'Stale update',
        updatedAt: '2025-01-15T00:00:00.000Z', // Client has older version
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
    // findUnique is called for audit diff but NOT for locking check
    expect(mockDb.demanda.findUnique).toHaveBeenCalled()
  })
})

describe('DELETE /api/demandas', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deletes demanda by id', async () => {
    mockAuthenticated()
    mockDb.demanda.delete.mockResolvedValue(savedDemanda)
    const req = createRequest('DELETE', {
      searchParams: { id: 'dem-001' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await DELETE(req)
    expect(res.status).toBe(200)
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
    mockDb.demanda.delete.mockResolvedValue(savedDemanda)
    const req = createRequest('DELETE', {
      searchParams: { id: 'dem-001' },
      url: 'http://localhost:3000/api/demandas',
    })
    await DELETE(req)
    const where = mockDb.demanda.delete.mock.calls[0][0].where
    expect(where).toEqual({ id: 'dem-001', userId: 'user-test-123' })
  })
})
