import { describe, it, expect, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { PUT, DELETE } from '../route'

describe('Teams API - PUT/DELETE', () => {
  beforeEach(() => {
    Object.values(mockDb.team).forEach((fn) => fn.mockReset())
  })

  // ──────── PUT ────────
  describe('PUT', () => {
    it('admin renomeia equipe', async () => {
      mockAuthenticated({ role: 'admin' })
      mockDb.team.findUnique.mockResolvedValue({ id: 'team-1', name: 'Old Name', companyId: 'company-defenz' })
      mockDb.team.update.mockResolvedValue({
        id: 'team-1', name: 'New Name', companyId: 'company-defenz',
        company: { name: 'Defenz' }, _count: { members: 2, demandas: 5 },
      })

      const req = createRequest('PUT', { body: { id: 'team-1', name: 'New Name' } })
      const res = await PUT(req)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.name).toBe('New Name')
    })

    it('gerencia renomeia equipe da mesma empresa', async () => {
      mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz' })
      mockDb.team.findUnique.mockResolvedValue({ id: 'team-1', name: 'Old', companyId: 'company-defenz' })
      mockDb.team.update.mockResolvedValue({
        id: 'team-1', name: 'Renamed', companyId: 'company-defenz',
        company: { name: 'Defenz' }, _count: { members: 1, demandas: 0 },
      })

      const req = createRequest('PUT', { body: { id: 'team-1', name: 'Renamed' } })
      const res = await PUT(req)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.name).toBe('Renamed')
    })

    it('gerencia 403 para equipe de outra empresa', async () => {
      mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz' })
      mockDb.team.findUnique.mockResolvedValue({ id: 'team-x', name: 'Other', companyId: 'company-other' })

      const req = createRequest('PUT', { body: { id: 'team-x', name: 'Hacked' } })
      const res = await PUT(req)
      expect(res.status).toBe(403)
    })

    it('400 sem nome', async () => {
      mockAuthenticated({ role: 'admin' })
      const req = createRequest('PUT', { body: { id: 'team-1', name: '' } })
      const res = await PUT(req)
      expect(res.status).toBe(400)
    })

    it('403 para user', async () => {
      mockAuthenticated({ role: 'user' })
      const req = createRequest('PUT', { body: { id: 'team-1', name: 'Test' } })
      const res = await PUT(req)
      expect(res.status).toBe(403)
    })
  })

  // ──────── DELETE ────────
  describe('DELETE', () => {
    it('deleta equipe vazia', async () => {
      mockAuthenticated({ role: 'admin' })
      mockDb.team.findUnique.mockResolvedValue({
        id: 'team-1', name: 'Empty', companyId: 'company-defenz',
        _count: { members: 0, demandas: 0 },
      })
      mockDb.team.delete.mockResolvedValue({ id: 'team-1' })

      const req = createRequest('DELETE', { searchParams: { id: 'team-1' } })
      const res = await DELETE(req)
      const json = await res.json()

      expect(json.success).toBe(true)
    })

    it('400 equipe com membros', async () => {
      mockAuthenticated({ role: 'admin' })
      mockDb.team.findUnique.mockResolvedValue({
        id: 'team-1', name: 'Active', companyId: 'company-defenz',
        _count: { members: 3, demandas: 0 },
      })

      const req = createRequest('DELETE', { searchParams: { id: 'team-1' } })
      const res = await DELETE(req)
      expect(res.status).toBe(400)
    })

    it('400 equipe com demandas', async () => {
      mockAuthenticated({ role: 'admin' })
      mockDb.team.findUnique.mockResolvedValue({
        id: 'team-1', name: 'Busy', companyId: 'company-defenz',
        _count: { members: 0, demandas: 5 },
      })

      const req = createRequest('DELETE', { searchParams: { id: 'team-1' } })
      const res = await DELETE(req)
      expect(res.status).toBe(400)
    })

    it('403 para user', async () => {
      mockAuthenticated({ role: 'user' })
      const req = createRequest('DELETE', { searchParams: { id: 'team-1' } })
      const res = await DELETE(req)
      expect(res.status).toBe(403)
    })

    it('gerencia 403 para equipe de outra empresa', async () => {
      mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz' })
      mockDb.team.findUnique.mockResolvedValue({
        id: 'team-x', name: 'Other', companyId: 'company-other',
        _count: { members: 0, demandas: 0 },
      })

      const req = createRequest('DELETE', { searchParams: { id: 'team-x' } })
      const res = await DELETE(req)
      expect(res.status).toBe(403)
    })
  })
})
