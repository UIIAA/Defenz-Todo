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

describe('POST /api/tickets/[id]/escalate', () => {
  it('escala: seta escalatedAt + escalatedTo + AuditLog ESCALATE', async () => {
    mockDb.ticket.findUnique.mockResolvedValue({ id: 't1', companyId: 'company-defenz', escalatedAt: null, escalatedTo: null })
    mockDb.ticket.update.mockResolvedValue({ id: 't1', escalatedTo: 'SecuriSoft' })

    const res = await POST(createRequest('POST', { body: { escalatedTo: 'SecuriSoft' } }), params('t1'))
    expect(res.status).toBe(200)

    const data = mockDb.ticket.update.mock.calls[0][0].data
    expect(data.escalatedAt).toBeInstanceOf(Date)
    expect(data.escalatedTo).toBe('SecuriSoft')
    expect(mockDb.auditLog.create).toHaveBeenCalledOnce()
    expect(mockDb.auditLog.create.mock.calls[0][0].data.action).toBe('ESCALATE')
  })

  it('re-escalar mantém o escalatedAt original (idempotente), atualiza o destino', async () => {
    const original = new Date('2026-06-20T10:00:00Z')
    mockDb.ticket.findUnique.mockResolvedValue({ id: 't1', companyId: 'company-defenz', escalatedAt: original, escalatedTo: 'SecuriSoft' })
    mockDb.ticket.update.mockResolvedValue({ id: 't1' })

    await POST(createRequest('POST', { body: { escalatedTo: 'Bitdefender N2' } }), params('t1'))
    const data = mockDb.ticket.update.mock.calls[0][0].data
    expect(data.escalatedAt).toBe(original)
    expect(data.escalatedTo).toBe('Bitdefender N2')
  })
})
