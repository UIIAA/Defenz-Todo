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
    mockDb.demanda.createManyAndReturn.mockResolvedValue([
      { id: 'd1', title: 'Item 1' },
      { id: 'd2', title: 'Item 2' },
    ])
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
    mockDb.demanda.createManyAndReturn.mockResolvedValue([{ id: 'd1', title: 'X' }])
    const req = createRequest('POST', {
      body: { items: [{ title: 'Test' }] },
      url: 'http://localhost:3000/api/demandas/import',
    })
    await POST(req)
    const data = mockDb.demanda.createManyAndReturn.mock.calls[0][0].data
    expect(data[0].status).toBe('solicitada')
  })

  it('applies defaults for origin and priority', async () => {
    mockAuthenticated()
    mockDb.demanda.createManyAndReturn.mockResolvedValue([{ id: 'd1', title: 'X' }])
    const req = createRequest('POST', {
      body: { items: [{ title: 'Test' }] },
      url: 'http://localhost:3000/api/demandas/import',
    })
    await POST(req)
    const data = mockDb.demanda.createManyAndReturn.mock.calls[0][0].data
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

describe('POST /api/demandas/import — auditoria (ADR-003)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('grava um AuditLog por demanda importada, com o id real', async () => {
    // O import criava em lote com `createMany` e NÃO logava nada — violando o
    // ADR-003 ("toda mutação de Demanda → AuditLog"). Demanda importada abria
    // sem resposta para "quem criou isto?".
    mockAuthenticated()
    mockDb.demanda.createManyAndReturn.mockResolvedValue([
      { id: 'd1', title: 'Item 1' },
      { id: 'd2', title: 'Item 2' },
    ])

    const req = createRequest('POST', {
      body: { items: [{ title: 'Item 1' }, { title: 'Item 2' }] },
      url: 'http://localhost:3000/api/demandas/import',
    })
    const res = await POST(req)

    expect(res.status).toBe(200)
    expect((await res.json()).data.count).toBe(2)

    expect(mockDb.auditLog.createMany).toHaveBeenCalledTimes(1)
    const linhas = mockDb.auditLog.createMany.mock.calls[0][0].data
    expect(linhas).toHaveLength(2)
    expect(linhas[0]).toMatchObject({
      action: 'IMPORT',
      entityType: 'Demanda',
      entityId: 'd1',
    })
    expect(linhas.map((l: { entityId: string }) => l.entityId)).toEqual(['d1', 'd2'])
  })

  it('falha da auditoria NÃO derruba o import', async () => {
    mockAuthenticated()
    mockDb.demanda.createManyAndReturn.mockResolvedValue([{ id: 'd1', title: 'X' }])
    // `Once`: `clearAllMocks` não remove implementação, e um reject persistente
    // faria qualquer teste acrescentado depois rodar contra auditoria quebrada.
    mockDb.auditLog.createMany.mockRejectedValueOnce(new Error('audit fora do ar'))

    const req = createRequest('POST', {
      body: { items: [{ title: 'X' }] },
      url: 'http://localhost:3000/api/demandas/import',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('recusa lote acima do teto em vez de tentar importar sem limite', async () => {
    mockAuthenticated()
    const req = createRequest('POST', {
      body: { items: Array.from({ length: 1001 }, (_, i) => ({ title: `Item ${i}` })) },
      url: 'http://localhost:3000/api/demandas/import',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
