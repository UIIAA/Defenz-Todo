import { describe, it, expect, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { GET, PUT } from '../route'

describe('Companies API — multi-empresa', () => {
  beforeEach(() => {
    Object.values(mockDb.company).forEach((fn) => fn.mockReset())
  })

  it('gerencia multi-empresa: GET filtra por id IN do conjunto', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.company.findMany.mockResolvedValue([])
    await GET()
    expect(mockDb.company.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['c1', 'c2'] } } })
    )
  })

  it('gerencia edita branding de empresa SECUNDÁRIA do conjunto (200)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.company.findUnique.mockResolvedValue({ id: 'c2', name: 'Secundaria' })
    mockDb.company.update.mockResolvedValue({
      id: 'c2', name: 'Secundaria', logoUrl: null, accentColor: '#123456',
      _count: { users: 1, teams: 1 },
    })
    const res = await PUT(createRequest('PUT', { body: { id: 'c2', accentColor: '#123456' } }))
    expect(res.status).toBe(200)
  })

  it('gerencia 403 ao editar empresa fora do conjunto', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.company.findUnique.mockResolvedValue({ id: 'c9', name: 'Outra' })
    const res = await PUT(createRequest('PUT', { body: { id: 'c9', accentColor: '#123456' } }))
    expect(res.status).toBe(403)
  })
})
