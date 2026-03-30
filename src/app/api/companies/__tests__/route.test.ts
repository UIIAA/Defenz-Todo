import { describe, it, expect, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated, mockUnauthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { GET, POST, PUT, DELETE } from '../route'

describe('Companies API', () => {
  beforeEach(() => {
    Object.values(mockDb.company).forEach((fn) => fn.mockReset())
  })

  // ──────── GET ────────
  describe('GET', () => {
    it('retorna empresas com logoUrl e accentColor', async () => {
      mockAuthenticated({ role: 'admin' })
      const companies = [
        { id: '1', name: 'Defenz', logoUrl: 'https://cdn.test/logo.png', accentColor: '#ff0000', _count: { users: 3, teams: 2 } },
        { id: '2', name: 'Acme', logoUrl: null, accentColor: null, _count: { users: 1, teams: 1 } },
      ]
      mockDb.company.findMany.mockResolvedValue(companies)

      const res = await GET()
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data).toHaveLength(2)
      expect(json.data[0].logoUrl).toBe('https://cdn.test/logo.png')
      expect(json.data[0].accentColor).toBe('#ff0000')
      expect(json.data[1].logoUrl).toBeNull()
    })

    it('gerencia ve apenas sua empresa', async () => {
      mockAuthenticated({ role: 'gerencia', companyId: 'comp-1' })
      const companies = [{ id: 'comp-1', name: 'Defenz', logoUrl: null, accentColor: null, _count: { users: 2, teams: 1 } }]
      mockDb.company.findMany.mockResolvedValue(companies)

      const res = await GET()
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
      expect(mockDb.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'comp-1' } })
      )
    })

    it('403 para user', async () => {
      mockAuthenticated({ role: 'user' })
      const res = await GET()
      expect(res.status).toBe(403)
    })

    it('401 se nao autenticado', async () => {
      mockUnauthenticated()
      const res = await GET()
      expect(res.status).toBe(401)
    })
  })

  // ──────── POST ────────
  describe('POST', () => {
    it('admin cria empresa com branding', async () => {
      mockAuthenticated({ role: 'admin' })
      const created = { id: '3', name: 'Nova Corp', logoUrl: 'https://logo.test/new.png', accentColor: '#00ff00', _count: { users: 0, teams: 0 } }
      mockDb.company.create.mockResolvedValue(created)

      const req = createRequest('POST', {
        body: { name: 'Nova Corp', logoUrl: 'https://logo.test/new.png', accentColor: '#00ff00' },
      })
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(201)
      expect(json.success).toBe(true)
      expect(json.data.accentColor).toBe('#00ff00')
    })

    it('403 para gerencia', async () => {
      mockAuthenticated({ role: 'gerencia' })
      const req = createRequest('POST', { body: { name: 'Test' } })
      const res = await POST(req)
      expect(res.status).toBe(403)
    })

    it('400 sem nome', async () => {
      mockAuthenticated({ role: 'admin' })
      const req = createRequest('POST', { body: { name: '' } })
      const res = await POST(req)
      expect(res.status).toBe(400)
    })

    it('400 com hex invalido', async () => {
      mockAuthenticated({ role: 'admin' })
      const req = createRequest('POST', { body: { name: 'Test', accentColor: 'nothex' } })
      const res = await POST(req)
      const json = await res.json()

      expect(res.status).toBe(400)
      expect(json.error).toContain('hex')
    })
  })

  // ──────── PUT ────────
  describe('PUT', () => {
    it('admin atualiza logoUrl', async () => {
      mockAuthenticated({ role: 'admin' })
      mockDb.company.findUnique.mockResolvedValue({ id: '1', name: 'Defenz' })
      mockDb.company.update.mockResolvedValue({
        id: '1', name: 'Defenz', logoUrl: 'https://new.logo/img.png', accentColor: null,
        _count: { users: 3, teams: 2 },
      })

      const req = createRequest('PUT', {
        body: { id: '1', logoUrl: 'https://new.logo/img.png' },
      })
      const res = await PUT(req)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.logoUrl).toBe('https://new.logo/img.png')
    })

    it('admin atualiza accentColor', async () => {
      mockAuthenticated({ role: 'admin' })
      mockDb.company.findUnique.mockResolvedValue({ id: '1', name: 'Defenz' })
      mockDb.company.update.mockResolvedValue({
        id: '1', name: 'Defenz', logoUrl: null, accentColor: '#e11d48',
        _count: { users: 3, teams: 2 },
      })

      const req = createRequest('PUT', { body: { id: '1', accentColor: '#e11d48' } })
      const res = await PUT(req)
      const json = await res.json()

      expect(json.success).toBe(true)
      expect(json.data.accentColor).toBe('#e11d48')
    })

    it('gerencia atualiza branding da propria empresa', async () => {
      mockAuthenticated({ role: 'gerencia', companyId: 'comp-1' })
      mockDb.company.findUnique.mockResolvedValue({ id: 'comp-1', name: 'Defenz' })
      mockDb.company.update.mockResolvedValue({
        id: 'comp-1', name: 'Defenz', logoUrl: null, accentColor: '#ff0000',
        _count: { users: 2, teams: 1 },
      })

      const req = createRequest('PUT', { body: { id: 'comp-1', accentColor: '#ff0000' } })
      const res = await PUT(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })

    it('gerencia 403 para empresa de outro', async () => {
      mockAuthenticated({ role: 'gerencia', companyId: 'comp-1' })
      mockDb.company.findUnique.mockResolvedValue({ id: 'comp-2', name: 'Outra' })

      const req = createRequest('PUT', { body: { id: 'comp-2', accentColor: '#ff0000' } })
      const res = await PUT(req)
      expect(res.status).toBe(403)
    })

    it('400 com hex invalido', async () => {
      mockAuthenticated({ role: 'admin' })
      const req = createRequest('PUT', { body: { id: '1', accentColor: 'azul' } })
      const res = await PUT(req)
      expect(res.status).toBe(400)
    })

    it('400 sem id', async () => {
      mockAuthenticated({ role: 'admin' })
      const req = createRequest('PUT', { body: { logoUrl: 'http://test.com/logo.png' } })
      const res = await PUT(req)
      expect(res.status).toBe(400)
    })

    it('403 para user', async () => {
      mockAuthenticated({ role: 'user' })
      const req = createRequest('PUT', { body: { id: '1', accentColor: '#ff0000' } })
      const res = await PUT(req)
      expect(res.status).toBe(403)
    })
  })

  // ──────── DELETE ────────
  describe('DELETE', () => {
    it('admin deleta empresa vazia', async () => {
      mockAuthenticated({ role: 'admin' })
      mockDb.company.findUnique.mockResolvedValue({ id: '1', name: 'Vazia', _count: { users: 0, teams: 0 } })
      mockDb.company.delete.mockResolvedValue({})

      const req = createRequest('DELETE', { url: 'http://localhost:3000/api/companies?id=1' })
      const res = await DELETE(req)
      const json = await res.json()

      expect(res.status).toBe(200)
      expect(json.success).toBe(true)
    })

    it('400 se empresa tem equipes', async () => {
      mockAuthenticated({ role: 'admin' })
      mockDb.company.findUnique.mockResolvedValue({ id: '1', name: 'Cheia', _count: { users: 0, teams: 3 } })

      const req = createRequest('DELETE', { url: 'http://localhost:3000/api/companies?id=1' })
      const res = await DELETE(req)
      expect(res.status).toBe(400)
    })

    it('403 para gerencia', async () => {
      mockAuthenticated({ role: 'gerencia' })
      const req = createRequest('DELETE', { url: 'http://localhost:3000/api/companies?id=1' })
      const res = await DELETE(req)
      expect(res.status).toBe(403)
    })

    it('404 se empresa nao existe', async () => {
      mockAuthenticated({ role: 'admin' })
      mockDb.company.findUnique.mockResolvedValue(null)

      const req = createRequest('DELETE', { url: 'http://localhost:3000/api/companies?id=nope' })
      const res = await DELETE(req)
      expect(res.status).toBe(404)
    })
  })
})
