import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { GET, POST } from '../route'

// Reseta o cache do resolveDefenzCompanyId entre testes.
vi.mock('@/lib/service-desk-server', () => ({
  resolveDefenzCompanyId: vi.fn().mockResolvedValue('company-defenz'),
}))

import { resolveDefenzCompanyId } from '@/lib/service-desk-server'

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated() // admin, companyId='company-defenz'
  // Re-aplica o mock após clearAllMocks.
  vi.mocked(resolveDefenzCompanyId).mockResolvedValue('company-defenz')
})

describe('GET /api/tickets', () => {
  it('lista tickets do escopo', async () => {
    mockDb.ticket.findMany.mockResolvedValue([
      { id: 't1', subject: 'A', status: 'solicitado', _count: { messages: 2 } },
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
  it('cria ticket com companyId Defenz resolvido server-side (ignora body), audit CREATE', async () => {
    mockDb.ticket.create.mockResolvedValue({
      id: 't1',
      subject: 'Acesso BM',
      status: 'solicitado',
      client: null,
    })

    const res = await POST(
      createRequest('POST', { body: { subject: 'Acesso BM' } })
    )
    expect(res.status).toBe(201)

    const data = mockDb.ticket.create.mock.calls[0][0].data
    // companyId sempre Defenz, resolvido pelo helper — não vem do body nem da sessão.
    expect(data.companyId).toBe('company-defenz')
    expect(data.createdById).toBe('user-test-123')
    expect(mockDb.auditLog.create).toHaveBeenCalledOnce()

    // helper de resolução foi chamado
    expect(resolveDefenzCompanyId).toHaveBeenCalledOnce()
  })

  it('companyId do body é ignorado — Defenz sempre forçado server-side', async () => {
    mockDb.ticket.create.mockResolvedValue({
      id: 't2',
      subject: 'Y',
      status: 'solicitado',
      client: null,
    })

    // Mesmo que body envie outra empresa, o companyId gravado deve ser Defenz.
    const res = await POST(
      createRequest('POST', { body: { subject: 'Y', companyId: 'outra-empresa' } })
    )
    expect(res.status).toBe(201)

    const data = mockDb.ticket.create.mock.calls[0][0].data
    expect(data.companyId).toBe('company-defenz')
  })

  it('seta columnChangedAt na criação (motor do aging — senão ticket novo nunca envelhece)', async () => {
    mockDb.ticket.create.mockResolvedValue({ id: 't4', subject: 'Z', status: 'solicitado', client: null })

    await POST(createRequest('POST', { body: { subject: 'Z' } }))

    const data = mockDb.ticket.create.mock.calls[0][0].data
    expect(data.columnChangedAt).toBeInstanceOf(Date)
  })

  it('persiste campo client no POST', async () => {
    mockDb.ticket.create.mockResolvedValue({
      id: 't3',
      subject: 'Volix - exclusão de arquivo',
      status: 'solicitado',
      client: 'Volix',
    })

    const res = await POST(
      createRequest('POST', { body: { subject: 'Volix - exclusão de arquivo', client: 'Volix' } })
    )
    expect(res.status).toBe(201)

    const data = mockDb.ticket.create.mock.calls[0][0].data
    expect(data.client).toBe('Volix')
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
