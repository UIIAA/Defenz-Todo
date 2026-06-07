import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'

vi.mock('@/lib/audit', () => ({ createAuditLog: vi.fn(), diffChanges: vi.fn(() => null) }))

import { DELETE } from '../route'

const pending = {
  id: 'inv-1', token: 't', email: 'x@y.com', role: 'user',
  companyId: 'c2', usedAt: null,
  expiresAt: new Date(Date.now() + 7 * 86400000), createdBy: 'u', createdAt: new Date(),
}

function callDelete(id: string) {
  return DELETE(createRequest('DELETE', { searchParams: { id }, url: 'http://localhost:3000/api/invites' }))
}

beforeEach(() => vi.clearAllMocks())

describe('Invites DELETE — multi-empresa', () => {
  it('gerencia revoga convite de empresa SECUNDÁRIA do conjunto (200, não 500)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.inviteToken.findUnique.mockResolvedValue(pending) // companyId c2 ∈ conjunto
    mockDb.inviteToken.delete.mockResolvedValue(pending)
    const res = await callDelete('inv-1')
    expect(res.status).toBe(200)
  })

  it('gerencia 403 ao revogar convite fora do conjunto', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.inviteToken.findUnique.mockResolvedValue({ ...pending, companyId: 'c9' })
    const res = await callDelete('inv-1')
    expect(res.status).toBe(403)
    expect(mockDb.inviteToken.delete).not.toHaveBeenCalled()
  })
})
