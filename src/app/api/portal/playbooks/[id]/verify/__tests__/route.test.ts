import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { POST } from '../route'

const ctx = { params: Promise.resolve({ id: 'p1' }) }

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated()
})

describe('POST /api/portal/playbooks/[id]/verify', () => {
  it('grava verificação e RESETA reviewReminderSent (senão o 2º ciclo nunca reavisa)', async () => {
    mockDb.playbook.findFirst.mockResolvedValue({
      id: 'p1',
      companyId: null,
      reviewIntervalDays: 90,
      reviewReminderSent: true,
      verifiedAt: null,
    })
    mockDb.playbook.update.mockResolvedValue({ id: 'p1' })

    const res = await POST(createRequest('POST'), ctx)
    expect(res.status).toBe(200)

    const data = mockDb.playbook.update.mock.calls[0][0].data
    expect(data.verifiedAt).toBeInstanceOf(Date)
    expect(data.verifiedById).toBe('user-test-123')
    expect(data.reviewDueAt).toBeInstanceOf(Date)
    expect(data.reviewReminderSent).toBe(false)
  })

  it('evergreen (reviewIntervalDays null) verifica sem data de vencimento', async () => {
    mockDb.playbook.findFirst.mockResolvedValue({
      id: 'p1',
      companyId: null,
      reviewIntervalDays: null,
      reviewReminderSent: false,
      verifiedAt: null,
    })
    mockDb.playbook.update.mockResolvedValue({ id: 'p1' })

    await POST(createRequest('POST'), ctx)
    expect(mockDb.playbook.update.mock.calls[0][0].data.reviewDueAt).toBeNull()
  })

  it('sad path: 404 fora do escopo', async () => {
    mockDb.playbook.findFirst.mockResolvedValue(null)

    const res = await POST(createRequest('POST'), ctx)
    expect(res.status).toBe(404)
    expect(mockDb.playbook.update).not.toHaveBeenCalled()
  })
})
