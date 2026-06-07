import { describe, it, expect, vi, beforeEach } from 'vitest'

// Este teste exercita o caminho Bearer ATRAVÉS da rota real (resolveActor roda
// de verdade). Por isso NÃO importamos o mock de @/lib/auth — apenas mockamos
// @/lib/db, next-auth, auth-config e audit.
import { mockDb } from '@/test/mocks/prisma'
import { createRequest } from '@/test/mocks/next-server'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth-config', () => ({ authOptions: {} }))
vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn(),
  diffChanges: vi.fn(() => ({ status: { from: 'solicitada', to: 'em_andamento' } })),
}))

import { POST, PUT } from '../route'
import { createAuditLog } from '@/lib/audit'
import { hashToken } from '@/lib/auth'
import { getServerSession } from 'next-auth'

const RAW = 'defz_' + 'b2'.repeat(28)

// Usuário 'gerencia' escopado à empresa comp-x, dono do token.
const tokenUser = {
  id: 'u-marcos',
  role: 'gerencia',
  name: 'Marcos',
  email: 'marcos@x.com',
  department: null,
  company: { id: 'comp-x', name: 'X', logoUrl: null, accentColor: null },
  teams: [{ team: { id: 't1' } }],
  userCompanies: [],
}

function bearer(method: 'POST' | 'PUT', body: unknown) {
  return createRequest(method, {
    url: 'http://localhost:3000/api/demandas',
    body,
    headers: { Authorization: `Bearer ${RAW}` },
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockDb.apiToken.findUnique.mockResolvedValue({
    id: 'tok1', revokedAt: null, expiresAt: null, user: tokenUser,
  })
  mockDb.apiToken.update.mockResolvedValue({})
})

describe('POST /api/demandas via Bearer (acceptance a + c)', () => {
  it('cria demanda na empresa do token e grava AuditLog com userId do dono', async () => {
    mockDb.demanda.create.mockResolvedValue({ id: 'd1', title: 'Teste', companyId: 'comp-x' })

    const res = await POST(bearer('POST', { title: 'Teste' }))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json.success).toBe(true)
    // grava na empresa do usuário dono do token (resolveActor herdou comp-x)
    expect(mockDb.demanda.create.mock.calls[0][0].data.companyId).toBe('comp-x')
    expect(mockDb.demanda.create.mock.calls[0][0].data.userId).toBe('u-marcos')
    // audit com o userId do dono do token (acceptance c)
    expect(createAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u-marcos', userEmail: 'marcos@x.com' })
    )
    // lookup foi pelo hash SHA-256 do token
    expect(mockDb.apiToken.findUnique.mock.calls[0][0].where.tokenHash).toBe(hashToken(RAW))
  })
})

describe('PUT /api/demandas via Bearer (acceptance b — não cruza empresas)', () => {
  it('token de comp-x tentando editar demanda de comp-y → 403, sem update', async () => {
    mockDb.demanda.findUnique.mockResolvedValue({
      id: 'd-y', companyId: 'comp-y', status: 'solicitada', updatedAt: new Date(),
    })

    const res = await PUT(bearer('PUT', { id: 'd-y', status: 'em_andamento' }))

    expect(res.status).toBe(403)
    expect(mockDb.demanda.update).not.toHaveBeenCalled()
  })
})

describe('sem Bearer e sem sessão → 401', () => {
  it('POST sem auth retorna 401', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never)
    const res = await POST(
      createRequest('POST', { url: 'http://localhost:3000/api/demandas', body: { title: 'x' } })
    )
    expect(res.status).toBe(401)
  })
})
