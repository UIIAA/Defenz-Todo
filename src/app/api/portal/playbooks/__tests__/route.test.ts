import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'
import { GET, POST } from '../route'

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthenticated()
})

describe('GET /api/portal/playbooks', () => {
  it('lista com take e ordenação determinística', async () => {
    mockDb.playbook.findMany.mockResolvedValue([])

    const res = await GET(createRequest('GET'))
    expect(res.status).toBe(200)

    const args = mockDb.playbook.findMany.mock.calls[0][0]
    expect(args.take).toBe(200)
    expect(args.orderBy).toBeDefined()
  })

  it('busca o termo também no CORPO, não só no título', async () => {
    mockDb.playbook.findMany.mockResolvedValue([])

    await GET(createRequest('GET', { searchParams: { q: 'business manager' } }))

    const where = JSON.stringify(mockDb.playbook.findMany.mock.calls[0][0].where)
    expect(where).toContain('business manager')
    expect(where).toContain('body')
  })
})

describe('POST /api/portal/playbooks', () => {
  it('cria POP já com reviewDueAt (frescor nasce rodando)', async () => {
    mockDb.playbook.create.mockResolvedValue({ id: 'p1', title: 'Acesso BM' })

    const res = await POST(
      createRequest('POST', { body: { title: 'Acesso BM', body: '# passo 1' } })
    )
    expect(res.status).toBe(201)

    const data = mockDb.playbook.create.mock.calls[0][0].data
    expect(data.reviewDueAt).toBeInstanceOf(Date)
    expect(data.createdById).toBe('user-test-123')
    expect(data.ownerId).toBe('user-test-123')
  })

  it('sad path: rejeita título vazio com 400', async () => {
    const res = await POST(createRequest('POST', { body: { title: '', body: 'x' } }))
    expect(res.status).toBe(400)
    expect(mockDb.playbook.create).not.toHaveBeenCalled()
  })
})
