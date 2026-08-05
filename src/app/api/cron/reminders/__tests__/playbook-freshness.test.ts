import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'

vi.mock('@/lib/email', () => ({
  sendEmailWithChecks: vi.fn().mockResolvedValue({ success: true }),
}))

import { sendEmailWithChecks } from '@/lib/email'
import { notificarPlaybooksVencidos } from '../route'

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(sendEmailWithChecks).mockResolvedValue({ success: true })
})

describe('notificarPlaybooksVencidos', () => {
  it('notifica o dono e marca reviewReminderSent', async () => {
    mockDb.playbook.findMany.mockResolvedValue([
      {
        id: 'p1',
        title: 'Acesso ao BM',
        owner: { id: 'u1', email: 'cris@defenz.com.br', name: 'Cris' },
      },
    ])
    mockDb.playbook.update.mockResolvedValue({ id: 'p1' })

    const enviados = await notificarPlaybooksVencidos()

    expect(enviados).toBe(1)
    expect(sendEmailWithChecks).toHaveBeenCalledOnce()
    expect(mockDb.playbook.update.mock.calls[0][0].data.reviewReminderSent).toBe(true)
  })

  it('busca só os vencidos e ainda não avisados, com take', async () => {
    mockDb.playbook.findMany.mockResolvedValue([])

    await notificarPlaybooksVencidos()

    const args = mockDb.playbook.findMany.mock.calls[0][0]
    expect(args.where.reviewReminderSent).toBe(false)
    expect(args.where.isArchived).toBe(false)
    expect(args.where.reviewDueAt.lte).toBeInstanceOf(Date)
    expect(args.take).toBeDefined()
  })

  it('sad path: playbook sem dono não gera e-mail nem marca como avisado', async () => {
    mockDb.playbook.findMany.mockResolvedValue([{ id: 'p2', title: 'Órfão', owner: null }])

    const enviados = await notificarPlaybooksVencidos()

    expect(enviados).toBe(0)
    expect(sendEmailWithChecks).not.toHaveBeenCalled()
    expect(mockDb.playbook.update).not.toHaveBeenCalled()
  })
})
