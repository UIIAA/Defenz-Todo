import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { GET, PUT, DELETE } from '../route'

const params = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated() // admin
})

describe('GET /api/tickets/[id]', () => {
  it('retorna o ticket com mensagens', async () => {
    mockDb.ticket.findUnique.mockResolvedValue({
      id: 't1', subject: 'A', companyId: 'company-defenz', messages: [],
    })
    const res = await GET(createRequest('GET'), params('t1'))
    expect(res.status).toBe(200)
  })

  it('404 quando não existe', async () => {
    mockDb.ticket.findUnique.mockResolvedValue(null)
    const res = await GET(createRequest('GET'), params('nope'))
    expect(res.status).toBe(404)
  })
})

describe('PUT /api/tickets/[id]', () => {
  it('mudar para resolved seta resolvedAt', async () => {
    mockDb.ticket.findUnique.mockResolvedValue({
      id: 't1', subject: 'A', status: 'open', resolvedAt: null, companyId: 'company-defenz',
    })
    mockDb.ticket.update.mockResolvedValue({ id: 't1', subject: 'A', status: 'resolved' })

    const res = await PUT(createRequest('PUT', { body: { status: 'resolved' } }), params('t1'))
    expect(res.status).toBe(200)

    const data = mockDb.ticket.update.mock.calls[0][0].data
    expect(data.status).toBe('resolved')
    expect(data.resolvedAt).toBeInstanceOf(Date)
  })

  it('gerência editando ticket de outra empresa → 403', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-a', companyIds: [] })
    mockDb.ticket.findUnique.mockResolvedValue({
      id: 't1', status: 'open', resolvedAt: null, companyId: 'company-b',
    })
    const res = await PUT(createRequest('PUT', { body: { status: 'paused' } }), params('t1'))
    expect(res.status).toBe(403)
    expect(mockDb.ticket.update).not.toHaveBeenCalled()
  })

  it('atribuir a responsável de outra empresa no PUT → 403', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-a', companyIds: [] })
    mockDb.ticket.findUnique.mockResolvedValue({
      id: 't1', status: 'open', resolvedAt: null, companyId: 'company-a',
    })
    mockDb.user.findUnique.mockResolvedValue({ id: 'u-b', companyId: 'company-b' })
    const res = await PUT(createRequest('PUT', { body: { assignedToId: 'u-b' } }), params('t1'))
    expect(res.status).toBe(403)
    expect(mockDb.ticket.update).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/tickets/[id]', () => {
  it('exclui o ticket', async () => {
    mockDb.ticket.findUnique.mockResolvedValue({ id: 't1', subject: 'A', companyId: 'company-defenz' })
    mockDb.ticket.delete.mockResolvedValue({ id: 't1' })
    const res = await DELETE(createRequest('DELETE'), params('t1'))
    expect(res.status).toBe(200)
    expect(mockDb.ticket.delete).toHaveBeenCalledOnce()
  })
})
