import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated, mockUnauthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { GET, POST, DELETE } from '../route'

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.auditLog.create.mockResolvedValue({})
})

const params = (id = 'u1') => ({ params: Promise.resolve({ id }) })

describe('POST /api/users/[id]/api-tokens', () => {
  it('admin gera token → 201, retorna plaintext UMA vez e persiste só o hash', async () => {
    mockAuthenticated() // mockUser.role === 'admin'
    mockDb.user.findUnique.mockResolvedValue({ id: 'u1', email: 'x@y.com', name: 'X', role: 'gerencia' })
    mockDb.apiToken.create.mockResolvedValue({
      id: 'tok1', name: 'cli', tokenPrefix: 'defz_abc12345', lastUsedAt: null,
      expiresAt: null, revokedAt: null, createdAt: new Date(),
    })

    const res = await POST(createRequest('POST', { body: { name: 'cli' } }), params())
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.data.token).toMatch(/^defz_[0-9a-f]{56}$/) // plaintext retornado
    const createArg = mockDb.apiToken.create.mock.calls[0][0]
    expect(createArg.data.tokenHash).toMatch(/^[0-9a-f]{64}$/) // SHA-256
    expect(createArg.data.tokenHash).not.toBe(json.data.token) // nunca guarda plaintext
    expect(createArg.data.userId).toBe('u1')
    expect(createArg.data.createdBy).toBe('user-test-123')
  })

  it('não-admin → 403 e não cria token', async () => {
    mockAuthenticated({ role: 'user' })
    const res = await POST(createRequest('POST', { body: { name: 'cli' } }), params())
    expect(res.status).toBe(403)
    expect(mockDb.apiToken.create).not.toHaveBeenCalled()
  })

  it('sem nome → 400', async () => {
    mockAuthenticated()
    mockDb.user.findUnique.mockResolvedValue({ id: 'u1', email: 'x', name: 'X', role: 'user' })
    const res = await POST(createRequest('POST', { body: {} }), params())
    expect(res.status).toBe(400)
  })

  it('não autenticado → 401', async () => {
    mockUnauthenticated()
    const res = await POST(createRequest('POST', { body: { name: 'cli' } }), params())
    expect(res.status).toBe(401)
  })
})

describe('GET /api/users/[id]/api-tokens', () => {
  it('admin lista sem expor tokenHash', async () => {
    mockAuthenticated()
    mockDb.apiToken.findMany.mockResolvedValue([
      { id: 't1', name: 'cli', tokenPrefix: 'defz_abc12345', lastUsedAt: null, expiresAt: null, revokedAt: null, createdAt: new Date() },
    ])

    const res = await GET(createRequest('GET'), params())
    const json = await res.json()

    expect(res.status).toBe(200)
    const selectArg = mockDb.apiToken.findMany.mock.calls[0][0].select
    expect(selectArg.tokenHash).toBeUndefined() // hash nunca selecionado
    expect(json.data[0].tokenPrefix).toBe('defz_abc12345')
  })
})

describe('DELETE /api/users/[id]/api-tokens?tokenId=', () => {
  it('admin revoga (set revokedAt)', async () => {
    mockAuthenticated()
    mockDb.apiToken.findUnique.mockResolvedValue({ id: 't1', userId: 'u1', revokedAt: null })
    mockDb.apiToken.update.mockResolvedValue({})

    const res = await DELETE(createRequest('DELETE', { searchParams: { tokenId: 't1' } }), params())

    expect(res.status).toBe(200)
    expect(mockDb.apiToken.update.mock.calls[0][0].data.revokedAt).toBeInstanceOf(Date)
  })

  it('token de outro usuário → 404', async () => {
    mockAuthenticated()
    mockDb.apiToken.findUnique.mockResolvedValue({ id: 't1', userId: 'OUTRO', revokedAt: null })
    const res = await DELETE(createRequest('DELETE', { searchParams: { tokenId: 't1' } }), params())
    expect(res.status).toBe(404)
    expect(mockDb.apiToken.update).not.toHaveBeenCalled()
  })
})
