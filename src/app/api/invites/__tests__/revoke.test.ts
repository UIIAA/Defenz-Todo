import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated, mockUnauthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'

vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn(),
  diffChanges: vi.fn(() => null),
}))

import { DELETE } from '../route'

const pendingInvite = {
  id: 'inv-001',
  token: 'abc-123',
  email: 'convidado@example.com',
  role: 'user',
  companyId: 'company-defenz',
  usedAt: null,
  expiresAt: new Date(Date.now() + 7 * 86400000), // 7 days from now
  createdBy: 'user-test-123',
  createdAt: new Date(),
}

const usedInvite = {
  ...pendingInvite,
  id: 'inv-002',
  usedAt: new Date(),
}

const expiredInvite = {
  ...pendingInvite,
  id: 'inv-003',
  expiresAt: new Date(Date.now() - 86400000), // yesterday
}

function callDelete(id?: string) {
  const params: Record<string, string> = {}
  if (id) params.id = id
  return DELETE(
    createRequest('DELETE', {
      searchParams: params,
      url: 'http://localhost:3000/api/invites',
    })
  )
}

describe('DELETE /api/invites (revoke)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without auth', async () => {
    mockUnauthenticated()
    const res = await callDelete('inv-001')
    expect(res.status).toBe(401)
  })

  it('returns 403 for role "user"', async () => {
    mockAuthenticated({ role: 'user' })
    const res = await callDelete('inv-001')
    expect(res.status).toBe(403)
  })

  it('returns 400 without id', async () => {
    mockAuthenticated({ role: 'admin' })
    const res = await callDelete()
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent invite', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.inviteToken.findUnique.mockResolvedValue(null)
    const res = await callDelete('inv-nonexistent')
    expect(res.status).toBe(404)
  })

  it('revokes pending invite successfully', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.inviteToken.findUnique.mockResolvedValue(pendingInvite)
    mockDb.inviteToken.delete.mockResolvedValue(pendingInvite)

    const res = await callDelete('inv-001')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(mockDb.inviteToken.delete).toHaveBeenCalledWith({ where: { id: 'inv-001' } })
  })

  it('returns 400 for already used invite', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.inviteToken.findUnique.mockResolvedValue(usedInvite)

    const res = await callDelete('inv-002')
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('pendentes')
  })

  it('returns 400 for expired invite', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.inviteToken.findUnique.mockResolvedValue(expiredInvite)

    const res = await callDelete('inv-003')
    expect(res.status).toBe(400)
  })

  it('allows gerencia role to revoke invite from own company', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz' })
    mockDb.inviteToken.findUnique.mockResolvedValue(pendingInvite)
    mockDb.inviteToken.delete.mockResolvedValue(pendingInvite)

    const res = await callDelete('inv-001')
    expect(res.status).toBe(200)
  })

  it('blocks gerencia from revoking invite of another company', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz' })
    mockDb.inviteToken.findUnique.mockResolvedValue({
      ...pendingInvite,
      companyId: 'company-cowcycling',
    })

    const res = await callDelete('inv-001')
    expect(res.status).toBe(403)
  })
})
