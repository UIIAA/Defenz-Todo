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
  it('mudar para concluido seta resolvedAt e columnChangedAt', async () => {
    mockDb.ticket.findUnique.mockResolvedValue({
      id: 't1', subject: 'A', status: 'em_atendimento', resolvedAt: null,
      companyId: 'company-defenz',
    })
    mockDb.ticket.update.mockResolvedValue({
      id: 't1', subject: 'A', status: 'concluido', resolvedAt: new Date(),
    })

    const res = await PUT(createRequest('PUT', { body: { status: 'concluido' } }), params('t1'))
    expect(res.status).toBe(200)

    const data = mockDb.ticket.update.mock.calls[0][0].data
    expect(data.status).toBe('concluido')
    expect(data.resolvedAt).toBeInstanceOf(Date)
    expect(data.columnChangedAt).toBeInstanceOf(Date)
  })

  it('troca de coluna sem concluido seta columnChangedAt mas não resolvedAt', async () => {
    mockDb.ticket.findUnique.mockResolvedValue({
      id: 't1', status: 'solicitado', resolvedAt: null, companyId: 'company-defenz',
    })
    mockDb.ticket.update.mockResolvedValue({
      id: 't1', status: 'em_atendimento', resolvedAt: null,
    })

    const res = await PUT(
      createRequest('PUT', { body: { status: 'em_atendimento' } }),
      params('t1')
    )
    expect(res.status).toBe(200)

    const data = mockDb.ticket.update.mock.calls[0][0].data
    expect(data.columnChangedAt).toBeInstanceOf(Date)
    expect(data.resolvedAt).toBeUndefined()
  })

  it('reabrir (concluido → solicitado) limpa resolvedAt e seta columnChangedAt', async () => {
    mockDb.ticket.findUnique.mockResolvedValue({
      id: 't1', status: 'concluido', resolvedAt: new Date('2026-01-01'),
      companyId: 'company-defenz',
    })
    mockDb.ticket.update.mockResolvedValue({
      id: 't1', status: 'solicitado', resolvedAt: null,
    })

    const res = await PUT(
      createRequest('PUT', { body: { status: 'solicitado' } }),
      params('t1')
    )
    expect(res.status).toBe(200)

    const data = mockDb.ticket.update.mock.calls[0][0].data
    expect(data.resolvedAt).toBeNull()
    expect(data.columnChangedAt).toBeInstanceOf(Date)
  })

  it('persiste campo client no PUT', async () => {
    mockDb.ticket.findUnique.mockResolvedValue({
      id: 't1', status: 'solicitado', resolvedAt: null,
      client: null, companyId: 'company-defenz',
    })
    mockDb.ticket.update.mockResolvedValue({
      id: 't1', status: 'solicitado', client: 'Bevicred',
    })

    const res = await PUT(
      createRequest('PUT', { body: { client: 'Bevicred' } }),
      params('t1')
    )
    expect(res.status).toBe(200)

    const data = mockDb.ticket.update.mock.calls[0][0].data
    expect(data.client).toBe('Bevicred')
  })

  it('gerência editando ticket de outra empresa → 403', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-a', companyIds: [] })
    mockDb.ticket.findUnique.mockResolvedValue({
      id: 't1', status: 'solicitado', resolvedAt: null, companyId: 'company-b',
    })
    const res = await PUT(
      createRequest('PUT', { body: { status: 'em_atendimento' } }),
      params('t1')
    )
    expect(res.status).toBe(403)
    expect(mockDb.ticket.update).not.toHaveBeenCalled()
  })

  it('atribuir a responsável de outra empresa no PUT → 403', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'company-a', companyIds: [] })
    mockDb.ticket.findUnique.mockResolvedValue({
      id: 't1', status: 'solicitado', resolvedAt: null, companyId: 'company-a',
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
