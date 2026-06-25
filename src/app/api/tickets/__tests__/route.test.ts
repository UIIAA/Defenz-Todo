import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { GET, POST } from '../route'

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated() // admin, companyId='company-defenz'
})

describe('GET /api/tickets', () => {
  it('lista tickets do escopo', async () => {
    mockDb.ticket.findMany.mockResolvedValue([
      { id: 't1', subject: 'A', status: 'open', _count: { messages: 2 } },
    ])
    const res = await GET(createRequest('GET'))
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data).toHaveLength(1)
    expect(mockDb.ticket.findMany).toHaveBeenCalledOnce()
  })

  it('filtra escalated=true', async () => {
    mockDb.ticket.findMany.mockResolvedValue([])
    await GET(createRequest('GET', { searchParams: { escalated: 'true' } }))
    const where = mockDb.ticket.findMany.mock.calls[0][0].where
    expect(where.escalatedAt).toEqual({ not: null })
  })
})

describe('POST /api/tickets', () => {
  it('admin cria ticket → 201, companyId resolvido, audit CREATE', async () => {
    mockDb.ticket.create.mockResolvedValue({ id: 't1', subject: 'Acesso BM', status: 'open' })
    const res = await POST(createRequest('POST', { body: { subject: 'Acesso BM' } }))
    expect(res.status).toBe(201)

    const data = mockDb.ticket.create.mock.calls[0][0].data
    expect(data.companyId).toBe('company-defenz')
    expect(data.createdById).toBe('user-test-123')
    expect(mockDb.auditLog.create).toHaveBeenCalledOnce()
  })

  it('gerência criando em empresa fora do escopo → 403', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-a', companyIds: [] })
    const res = await POST(
      createRequest('POST', { body: { subject: 'X', companyId: 'company-b' } })
    )
    expect(res.status).toBe(403)
    expect(mockDb.ticket.create).not.toHaveBeenCalled()
  })

  it('atribuir a responsável de outra empresa → 403 (guard de tenant no assignee)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-a', companyIds: [] })
    mockDb.user.findUnique.mockResolvedValue({ id: 'u-b', companyId: 'company-b' })
    const res = await POST(
      createRequest('POST', { body: { subject: 'X', assignedToId: 'u-b' } })
    )
    expect(res.status).toBe(403)
    expect(mockDb.ticket.create).not.toHaveBeenCalled()
  })
})
