import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { POST } from '../route'

const params = (id: string) => ({ params: Promise.resolve({ id }) })

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated()
})

describe('POST /api/tickets/[id]/messages', () => {
  it('1ª reply seta firstReplyAt no ticket', async () => {
    mockDb.ticket.findUnique.mockResolvedValue({ id: 't1', companyId: 'company-defenz', firstReplyAt: null })
    mockDb.ticketMessage.create.mockResolvedValue({ id: 'm1', kind: 'reply' })

    const res = await POST(createRequest('POST', { body: { body: 'oi' } }), params('t1'))
    expect(res.status).toBe(201)
    expect(mockDb.ticket.update).toHaveBeenCalledOnce()
    expect(mockDb.ticket.update.mock.calls[0][0].data.firstReplyAt).toBeInstanceOf(Date)
  })

  it('note NÃO seta firstReplyAt', async () => {
    mockDb.ticket.findUnique.mockResolvedValue({ id: 't1', companyId: 'company-defenz', firstReplyAt: null })
    mockDb.ticketMessage.create.mockResolvedValue({ id: 'm2', kind: 'note' })

    await POST(createRequest('POST', { body: { body: 'nota', kind: 'note' } }), params('t1'))
    expect(mockDb.ticket.update).not.toHaveBeenCalled()
  })

  it('reply quando firstReplyAt já existe NÃO regrava', async () => {
    mockDb.ticket.findUnique.mockResolvedValue({ id: 't1', companyId: 'company-defenz', firstReplyAt: new Date() })
    mockDb.ticketMessage.create.mockResolvedValue({ id: 'm3', kind: 'reply' })

    await POST(createRequest('POST', { body: { body: '2a resposta' } }), params('t1'))
    expect(mockDb.ticket.update).not.toHaveBeenCalled()
  })
})
