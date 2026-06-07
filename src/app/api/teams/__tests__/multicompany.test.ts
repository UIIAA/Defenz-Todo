import { describe, it, expect, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { GET, POST, PUT } from '../route'

beforeEach(() => {
  Object.values(mockDb.team).forEach((fn) => fn.mockReset())
})

describe('Teams API — multi-empresa', () => {
  it('gerencia multi-empresa: GET filtra por companyId IN do conjunto', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.team.findMany.mockResolvedValue([])
    await GET(createRequest('GET', { url: 'http://localhost:3000/api/teams' }))
    expect(mockDb.team.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: { in: ['c1', 'c2'] } } })
    )
  })

  it('gerencia cria equipe em empresa SECUNDÁRIA do conjunto', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.team.create.mockResolvedValue({
      id: 't', name: 'Nova', companyId: 'c2', company: { name: 'C2' },
      _count: { members: 0, demandas: 0 },
    })
    const res = await POST(createRequest('POST', { body: { name: 'Nova', companyId: 'c2' } }))
    expect(res.status).toBe(201)
    expect(mockDb.team.create.mock.calls[0][0].data.companyId).toBe('c2')
  })

  it('gerencia 403 ao criar equipe em empresa fora do conjunto', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    const res = await POST(createRequest('POST', { body: { name: 'Nova', companyId: 'c9' } }))
    expect(res.status).toBe(403)
    expect(mockDb.team.create).not.toHaveBeenCalled()
  })

  it('gerencia edita equipe de empresa SECUNDÁRIA do conjunto (200)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.team.findUnique.mockResolvedValue({ id: 't', name: 'Old', companyId: 'c2' })
    mockDb.team.update.mockResolvedValue({
      id: 't', name: 'New', companyId: 'c2', company: { name: 'C2' },
      _count: { members: 0, demandas: 0 },
    })
    const res = await PUT(createRequest('PUT', { body: { id: 't', name: 'New' } }))
    expect(res.status).toBe(200)
  })
})
