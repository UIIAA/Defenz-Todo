import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { savedDemanda } from '@/test/fixtures/demandas'

import { POST, PUT } from '../route'

describe('POST /api/demandas — classification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates demanda with classification', async () => {
    mockAuthenticated()
    const withClassification = { ...savedDemanda, classification: 'marketing' }
    mockDb.demanda.create.mockResolvedValue(withClassification)

    const req = createRequest('POST', {
      body: { title: 'Campanha digital', classification: 'marketing' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)

    const createCall = mockDb.demanda.create.mock.calls[0][0]
    expect(createCall.data.classification).toBe('marketing')
  })

  it('creates demanda without classification (null)', async () => {
    mockAuthenticated()
    mockDb.demanda.create.mockResolvedValue(savedDemanda)

    const req = createRequest('POST', {
      body: { title: 'Sem categoria' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(201)

    const createCall = mockDb.demanda.create.mock.calls[0][0]
    expect(createCall.data.classification).toBeNull()
  })

  it('rejects invalid classification value', async () => {
    mockAuthenticated()
    const req = createRequest('POST', {
      body: { title: 'Test', classification: 'invalida' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('PUT /api/demandas — classification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates classification field', async () => {
    mockAuthenticated()
    mockDb.demanda.findUnique.mockResolvedValue(savedDemanda)
    mockDb.demanda.update.mockResolvedValue({ ...savedDemanda, classification: 'tecnologia' })

    const req = createRequest('PUT', {
      body: { id: 'dem-001', classification: 'tecnologia' },
      url: 'http://localhost:3000/api/demandas',
    })
    const res = await PUT(req)
    expect(res.status).toBe(200)

    const updateData = mockDb.demanda.update.mock.calls[0][0].data
    expect(updateData.classification).toBe('tecnologia')
  })

  it('clears classification with null', async () => {
    mockAuthenticated()
    const withClassification = { ...savedDemanda, classification: 'marketing' }
    mockDb.demanda.findUnique.mockResolvedValue(withClassification)
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
})
