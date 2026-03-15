import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated, mockUnauthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'

import { POST } from '../import/route'

describe('POST /api/demandas/import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('imports array of items', async () => {
    mockAuthenticated()
    mockDb.demanda.createMany.mockResolvedValue({ count: 2 })
    const req = createRequest('POST', {
      body: {
        items: [
          { title: 'Item 1' },
          { title: 'Item 2' },
        ],
      },
      url: 'http://localhost:3000/api/demandas/import',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.count).toBe(2)
  })

  it('returns 401 without auth', async () => {
    mockUnauthenticated()
    const req = createRequest('POST', {
      body: { items: [{ title: 'Item' }] },
      url: 'http://localhost:3000/api/demandas/import',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 400 with empty array', async () => {
    mockAuthenticated()
    const req = createRequest('POST', {
      body: { items: [] },
      url: 'http://localhost:3000/api/demandas/import',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('sets status=solicitada on all items', async () => {
    mockAuthenticated()
    mockDb.demanda.createMany.mockResolvedValue({ count: 1 })
    const req = createRequest('POST', {
      body: { items: [{ title: 'Test' }] },
      url: 'http://localhost:3000/api/demandas/import',
    })
    await POST(req)
    const data = mockDb.demanda.createMany.mock.calls[0][0].data
    expect(data[0].status).toBe('solicitada')
  })

  it('applies defaults for origin and priority', async () => {
    mockAuthenticated()
    mockDb.demanda.createMany.mockResolvedValue({ count: 1 })
    const req = createRequest('POST', {
      body: { items: [{ title: 'Test' }] },
      url: 'http://localhost:3000/api/demandas/import',
    })
    await POST(req)
    const data = mockDb.demanda.createMany.mock.calls[0][0].data
    expect(data[0].origin).toBe('outra')
    expect(data[0].priority).toBe('media')
  })

  it('rejects item with empty title', async () => {
    mockAuthenticated()
    const req = createRequest('POST', {
      body: { items: [{ title: '' }] },
      url: 'http://localhost:3000/api/demandas/import',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
