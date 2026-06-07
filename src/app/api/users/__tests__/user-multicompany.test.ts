import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated, mockUnauthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'

vi.mock('@/lib/audit', () => ({
  createAuditLog: vi.fn(),
  diffChanges: vi.fn(() => null),
}))

import { GET } from '../route'
import { PUT, DELETE } from '../[id]/route'

const target = {
  id: 'u-target',
  name: 'Target',
  email: 'target@x.com',
  role: 'user',
  position: null,
  department: null,
  companyId: 'c1',
  password: 'hashed',
  createdAt: new Date(),
  teams: [] as { teamId: string }[],
  userCompanies: [{ companyId: 'c2' }] as { companyId: string }[],
}

function callPut(id: string, body: Record<string, unknown>) {
  return PUT(createRequest('PUT', { body, url: `http://localhost:3000/api/users/${id}` }), {
    params: Promise.resolve({ id }),
  })
}

function callDelete(id: string) {
  return DELETE(createRequest('DELETE', { url: `http://localhost:3000/api/users/${id}` }), {
    params: Promise.resolve({ id }),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ==================== GET /api/users (scoping por conjunto) ====================

describe('GET /api/users multi-empresa', () => {
  it('admin vê todos (where vazio)', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.user.findMany.mockResolvedValue([])
    await GET()
    expect(mockDb.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} })
    )
  })

  it('gerencia multi-empresa: where companyId IN do conjunto', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.user.findMany.mockResolvedValue([])
    await GET()
    expect(mockDb.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: { in: ['c1', 'c2'] } } })
    )
  })

  it('401 sem autenticação', async () => {
    mockUnauthenticated()
    const res = await GET()
    expect(res.status).toBe(401)
  })
})

// ==================== PUT /api/users/[id] companyIds sync ====================

describe('PUT /api/users/[id] sincroniza UserCompany (companyIds)', () => {
  it('admin: cria as memberships novas e remove as ausentes (diff)', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.user.findUnique.mockResolvedValue(target) // userCompanies atual = [c2]
    mockDb.user.update.mockResolvedValue({ ...target })
    mockDb.userCompany.deleteMany.mockResolvedValue({ count: 1 })
    mockDb.userCompany.createMany.mockResolvedValue({ count: 1 })

    // novo conjunto adicional: [c3] → adiciona c3, remove c2
    const res = await callPut('u-target', { companyIds: ['c3'] })
    expect(res.status).toBe(200)

    expect(mockDb.userCompany.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u-target', companyId: { in: ['c2'] } },
    })
    expect(mockDb.userCompany.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'u-target', companyId: 'c3' }],
    })
  })

  it('admin: companyIds = [] remove todas as memberships adicionais', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.user.findUnique.mockResolvedValue(target) // [c2]
    mockDb.user.update.mockResolvedValue({ ...target })
    mockDb.userCompany.deleteMany.mockResolvedValue({ count: 1 })

    const res = await callPut('u-target', { companyIds: [] })
    expect(res.status).toBe(200)
    expect(mockDb.userCompany.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'u-target', companyId: { in: ['c2'] } },
    })
    expect(mockDb.userCompany.createMany).not.toHaveBeenCalled()
  })

  it('gerência NÃO pode atribuir empresa fora do próprio conjunto (403)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.user.findUnique.mockResolvedValue(target)

    // c9 não está no conjunto da gerência [c1, c2] → 403
    const res = await callPut('u-target', { companyIds: ['c9'] })
    expect(res.status).toBe(403)
    expect(mockDb.userCompany.createMany).not.toHaveBeenCalled()
    expect(mockDb.userCompany.deleteMany).not.toHaveBeenCalled()
  })

  it('gerência PODE atribuir empresa secundária dentro do próprio conjunto', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2', 'c5'] }) // set [c1,c2,c5]
    mockDb.user.findUnique.mockResolvedValue(target) // primary c1, adicional [c2]
    mockDb.user.update.mockResolvedValue({ ...target })
    mockDb.userCompany.createMany.mockResolvedValue({ count: 1 })

    // adiciona c5 (∈ conjunto, ainda não membro); mantém c2
    const res = await callPut('u-target', { companyIds: ['c2', 'c5'] })
    expect(res.status).toBe(200)
    expect(mockDb.userCompany.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'u-target', companyId: 'c5' }],
    })
  })

  it('gerência NÃO pode mover a empresa primária para fora do conjunto (403)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.user.findUnique.mockResolvedValue(target)

    const res = await callPut('u-target', { companyId: 'c9' })
    expect(res.status).toBe(403)
    expect(mockDb.user.update).not.toHaveBeenCalled()
  })

  it('strip primary: companyId primária enviada em companyIds NÃO vira linha UserCompany redundante', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.user.findUnique.mockResolvedValue(target) // primary c1, adicional [c2]
    mockDb.user.update.mockResolvedValue({ ...target })
    mockDb.userCompany.createMany.mockResolvedValue({ count: 1 })
    mockDb.userCompany.deleteMany.mockResolvedValue({ count: 0 })

    // cliente raw envia a primária 'c1' junto — deve ser descartada; só 'c3' é nova
    const res = await callPut('u-target', { companyIds: ['c1', 'c2', 'c3'] })
    expect(res.status).toBe(200)
    expect(mockDb.userCompany.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'u-target', companyId: 'c3' }],
    })
  })
})

// ==================== #1 Target-scope guard (cross-tenant) ====================

describe('PUT/DELETE /api/users/[id] — guard de tenant no usuário-alvo', () => {
  const outsider = { ...target, id: 'u-out', companyId: 'c99', userCompanies: [] as { companyId: string }[] }

  it('gerência 403 ao editar (ex.: reset de senha) usuário de outra empresa', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.user.findUnique.mockResolvedValue(outsider) // companyId c99 ∉ conjunto
    const res = await callPut('u-out', { password: 'novaSenha123' })
    expect(res.status).toBe(403)
    expect(mockDb.user.update).not.toHaveBeenCalled()
  })

  it('gerência 403 ao DELETAR usuário de outra empresa', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.user.findUnique.mockResolvedValue(outsider)
    const res = await callDelete('u-out')
    expect(res.status).toBe(403)
    expect(mockDb.user.delete).not.toHaveBeenCalled()
  })

  it('gerência PODE editar usuário da própria empresa', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.user.findUnique.mockResolvedValue(target) // companyId c1 ∈ conjunto
    mockDb.user.update.mockResolvedValue({ ...target, name: 'Novo' })
    const res = await callPut('u-target', { name: 'Novo' })
    expect(res.status).toBe(200)
  })

  it('admin pode editar/deletar usuário de qualquer empresa', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.user.findUnique.mockResolvedValue(outsider)
    mockDb.user.update.mockResolvedValue({ ...outsider, name: 'X' })
    const res = await callPut('u-out', { name: 'X' })
    expect(res.status).toBe(200)
  })
})

// ==================== #2 teamIds tenant-scope ====================

describe('PUT /api/users/[id] — teamIds escopados ao conjunto', () => {
  it('gerência 403 ao atribuir equipe de empresa fora do conjunto', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.user.findUnique.mockResolvedValue(target) // alvo c1 ∈ conjunto
    mockDb.user.update.mockResolvedValue({ ...target })
    mockDb.team.findMany.mockResolvedValue([{ id: 'team-c9', companyId: 'c9' }]) // c9 ∉ conjunto
    const res = await callPut('u-target', { teamIds: ['team-c9'] })
    expect(res.status).toBe(403)
    expect(mockDb.userTeam.createMany).not.toHaveBeenCalled()
  })

  it('gerência PODE atribuir equipe de empresa do conjunto', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.user.findUnique.mockResolvedValue(target)
    mockDb.user.update.mockResolvedValue({ ...target })
    mockDb.team.findMany.mockResolvedValue([{ id: 'team-c2', companyId: 'c2' }]) // c2 ∈ conjunto
    mockDb.userTeam.createMany.mockResolvedValue({ count: 1 })
    const res = await callPut('u-target', { teamIds: ['team-c2'] })
    expect(res.status).toBe(200)
    expect(mockDb.userTeam.createMany).toHaveBeenCalledWith({
      data: [{ userId: 'u-target', teamId: 'team-c2' }],
    })
  })

  // re-review HIGH: validação ANTES da escrita (sem partial-write quando um guard barra)
  it('NÃO comita user.update quando o guard de teamIds barra (sem partial-write em 403)', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.user.findUnique.mockResolvedValue(target) // alvo c1 ∈ conjunto
    mockDb.user.update.mockResolvedValue({ ...target })
    mockDb.team.findMany.mockResolvedValue([{ id: 'team-c9', companyId: 'c9' }]) // c9 ∉ conjunto
    const res = await callPut('u-target', { password: 'novaSenha123', teamIds: ['team-c9'] })
    expect(res.status).toBe(403)
    expect(mockDb.user.update).not.toHaveBeenCalled() // senha NÃO foi alterada
    expect(mockDb.userTeam.createMany).not.toHaveBeenCalled()
  })

  // re-review LOW: teamId inexistente → 400 (não chega ao createMany / FK 500)
  it('400 quando algum teamId não existe', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] })
    mockDb.user.findUnique.mockResolvedValue(target)
    mockDb.team.findMany.mockResolvedValue([]) // nenhum dos toAdd existe
    const res = await callPut('u-target', { teamIds: ['ghost'] })
    expect(res.status).toBe(400)
    expect(mockDb.userTeam.createMany).not.toHaveBeenCalled()
  })
})

// ==================== re-review LOW: remoção de UserCompany não cruza tenant ====================

describe('PUT /api/users/[id] — gerência não remove membership fora do conjunto', () => {
  it('não deleta UserCompany de empresa fora do conjunto (admin-granted preservado)', async () => {
    const t = { ...target, userCompanies: [{ companyId: 'c2' }, { companyId: 'c99' }] }
    mockAuthenticated({ role: 'gerencia', companyId: 'c1', companyIds: ['c2'] }) // set [c1,c2]
    mockDb.user.findUnique.mockResolvedValue(t) // alvo c1 ∈ conjunto; tem membership c99 (fora)
    mockDb.user.update.mockResolvedValue({ ...t })

    // envia só c2 → c99 sairia do diff, mas é fora do conjunto → NÃO deve ser removido
    const res = await callPut('u-target', { companyIds: ['c2'] })
    expect(res.status).toBe(200)
    expect(mockDb.userCompany.deleteMany).not.toHaveBeenCalled()
  })
})
