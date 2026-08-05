import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { PUT, DELETE } from '../route'

const ctx = { params: Promise.resolve({ id: 'p1' }) }

const playbookBase = {
  id: 'p1',
  kind: 'POP' as const,
  externalUrl: null,
  title: 'Acesso BM',
  body: 'corpo original',
  companyId: null,
  ownerId: 'user-test-123',
  verifiedAt: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated()
})

describe('PUT /api/portal/playbooks/[id]', () => {
  it('editar sendo diferente do dono zera verifiedAt (badge não pode mentir)', async () => {
    mockDb.playbook.findFirst.mockResolvedValue({
      ...playbookBase,
      ownerId: 'outro-usuario',
      verifiedAt: new Date('2026-07-01'),
    })
    mockDb.playbook.update.mockResolvedValue({ ...playbookBase, title: 'B' })

    const res = await PUT(createRequest('PUT', { body: { title: 'B' } }), ctx)
    expect(res.status).toBe(200)
    expect(mockDb.playbook.update.mock.calls[0][0].data.verifiedAt).toBeNull()
  })

  it('PUT parcial NÃO loga campo ausente como null no AuditLog', async () => {
    mockDb.playbook.findFirst.mockResolvedValue(playbookBase)
    mockDb.playbook.update.mockResolvedValue({
      ...playbookBase,
      title: 'Novo título',
    })

    await PUT(createRequest('PUT', { body: { title: 'Novo título' } }), ctx)

    const audit = mockDb.auditLog.create.mock.calls[0]?.[0]?.data
    expect(audit.changes).toContain('title')
    expect(audit.changes).not.toContain('body')
  })

  it('sad path: 404 quando o item está fora do escopo do usuário', async () => {
    mockDb.playbook.findFirst.mockResolvedValue(null)

    const res = await PUT(createRequest('PUT', { body: { title: 'B' } }), ctx)
    expect(res.status).toBe(404)
    expect(mockDb.playbook.update).not.toHaveBeenCalled()
  })

  it('sad path: role `user` não edita (403)', async () => {
    mockAuthenticated({ role: 'user', companyId: 'company-defenz' })
    mockDb.playbook.findFirst.mockResolvedValue({
      ...playbookBase,
      companyId: 'company-defenz',
    })

    const res = await PUT(createRequest('PUT', { body: { title: 'B' } }), ctx)
    expect(res.status).toBe(403)
    expect(mockDb.playbook.update).not.toHaveBeenCalled()
  })

  it('sad path: gerência não edita conteúdo global (403)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-defenz' })
    mockDb.playbook.findFirst.mockResolvedValue({ ...playbookBase, companyId: null })

    const res = await PUT(createRequest('PUT', { body: { title: 'B' } }), ctx)
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/portal/playbooks/[id]', () => {
  it('arquiva (soft delete) em vez de apagar a linha', async () => {
    mockDb.playbook.findFirst.mockResolvedValue(playbookBase)
    mockDb.playbook.update.mockResolvedValue({ ...playbookBase, isArchived: true })

    const res = await DELETE(createRequest('DELETE'), ctx)
    expect(res.status).toBe(200)
    expect(mockDb.playbook.update.mock.calls[0][0].data.isArchived).toBe(true)
    expect(mockDb.playbook.delete).not.toHaveBeenCalled()
  })
})
