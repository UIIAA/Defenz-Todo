import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated, mockUnauthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'

vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn(),
  diffChanges: vi.fn(() => null),
}))

import { PUT, DELETE } from '../[id]/route'

const targetUser = {
  id: 'user-target-456',
  name: 'Target User',
  email: 'target@example.com',
  role: 'user',
  position: 'Developer',
  password: 'hashed',
  createdAt: new Date(),
}

function callPut(id: string, body: Record<string, unknown>) {
  const req = createRequest('PUT', {
    body,
    url: `http://localhost:3000/api/users/${id}`,
  })
  return PUT(req, { params: Promise.resolve({ id }) })
}

function callDelete(id: string) {
  const req = createRequest('DELETE', {
    url: `http://localhost:3000/api/users/${id}`,
  })
  return DELETE(req, { params: Promise.resolve({ id }) })
}

// ==================== PUT /api/users/[id] ====================

describe('PUT /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without auth', async () => {
    mockUnauthenticated()
    const res = await callPut('user-target-456', { name: 'New Name' })
    expect(res.status).toBe(401)
  })

  it('returns 403 for role "user"', async () => {
    mockAuthenticated({ role: 'user' })
    const res = await callPut('user-target-456', { name: 'New Name' })
    expect(res.status).toBe(403)
  })

  it('updates name/role/position successfully', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.user.findUnique.mockResolvedValue(targetUser)
    mockDb.user.update.mockResolvedValue({
      ...targetUser,
      name: 'Updated Name',
      role: 'gerencia',
      position: 'Manager',
    })

    const res = await callPut('user-target-456', {
      name: 'Updated Name',
      role: 'gerencia',
      position: 'Manager',
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
    expect(body.data.name).toBe('Updated Name')
  })

  it('does not allow lowering own role', async () => {
    mockAuthenticated({ id: 'user-target-456', role: 'admin' })
    mockDb.user.findUnique.mockResolvedValue({ ...targetUser, id: 'user-target-456', role: 'admin' })

    const res = await callPut('user-target-456', { role: 'user' })
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent user', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.user.findUnique.mockResolvedValue(null)

    const res = await callPut('nonexistent', { name: 'X' })
    expect(res.status).toBe(404)
  })
})

// ==================== DELETE /api/users/[id] ====================

describe('DELETE /api/users/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 without auth', async () => {
    mockUnauthenticated()
    const res = await callDelete('user-target-456')
    expect(res.status).toBe(401)
  })

  it('returns 403 for role "user"', async () => {
    mockAuthenticated({ role: 'user' })
    const res = await callDelete('user-target-456')
    expect(res.status).toBe(403)
  })

  it('deletes user successfully', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.user.findUnique.mockResolvedValue(targetUser)
    mockDb.demanda.updateMany.mockResolvedValue({ count: 0 })
    mockDb.user.delete.mockResolvedValue(targetUser)

    const res = await callDelete('user-target-456')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.success).toBe(true)
  })

  it('returns 400 when trying to delete self', async () => {
    mockAuthenticated({ id: 'self-id', role: 'admin' })

    const res = await callDelete('self-id')
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent user', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.user.findUnique.mockResolvedValue(null)

    const res = await callDelete('nonexistent')
    expect(res.status).toBe(404)
  })
})
