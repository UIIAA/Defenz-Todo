import { describe, it, expect, vi, beforeEach } from 'vitest'
import crypto from 'crypto'
import type { NextRequest } from 'next/server'

vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth-config', () => ({ authOptions: {} }))
vi.mock('@/lib/db', () => ({
  db: {
    apiToken: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

import { resolveActor, hashToken, extractBearerToken } from '../auth'
import { db } from '@/lib/db'
import { getServerSession } from 'next-auth'

// Token plaintext válido no formato `defz_` + 56 hex.
const RAW = 'defz_' + 'a1'.repeat(28)

function reqWith(headers: Record<string, string> = {}): NextRequest {
  const lower: Record<string, string> = {}
  for (const [k, v] of Object.entries(headers)) lower[k.toLowerCase()] = v
  return {
    headers: { get: (k: string) => lower[k.toLowerCase()] ?? null },
  } as unknown as NextRequest
}

const tokenUser = {
  id: 'u-marcos',
  role: 'gerencia',
  name: 'Marcos',
  email: 'marcos@x.com',
  department: null,
  company: { id: 'comp-a', name: 'A', logoUrl: null, accentColor: null },
  teams: [{ team: { id: 't1' } }],
  userCompanies: [{ companyId: 'comp-b' }],
}

describe('hashToken / extractBearerToken', () => {
  it('hashToken = SHA-256 hex do raw', () => {
    expect(hashToken(RAW)).toBe(crypto.createHash('sha256').update(RAW).digest('hex'))
  })
  it('extrai token de "Bearer x"', () => {
    expect(extractBearerToken(reqWith({ authorization: 'Bearer abc' }))).toBe('abc')
  })
  it('sem header → null', () => {
    expect(extractBearerToken(reqWith())).toBeNull()
  })
  it('header sem Bearer → null', () => {
    expect(extractBearerToken(reqWith({ authorization: 'abc' }))).toBeNull()
  })
})

describe('resolveActor (Bearer)', () => {
  beforeEach(() => vi.clearAllMocks())

  it('token válido → SessionUser do usuário dono', async () => {
    vi.mocked(db.apiToken.findUnique).mockResolvedValue({
      id: 'tok1', revokedAt: null, expiresAt: null, user: tokenUser,
    } as never)
    vi.mocked(db.apiToken.update).mockResolvedValue({} as never)

    const actor = await resolveActor(reqWith({ authorization: `Bearer ${RAW}` }))

    expect(actor.id).toBe('u-marcos')
    expect(actor.role).toBe('gerencia')
    expect(actor.companyId).toBe('comp-a')
    expect(actor.companyIds).toEqual(['comp-b'])
    expect(actor.teamIds).toEqual(['t1'])
    // lookup pelo hash SHA-256 do raw
    expect(vi.mocked(db.apiToken.findUnique).mock.calls[0][0].where.tokenHash).toBe(hashToken(RAW))
    // lastUsedAt atualizado (fire-and-forget)
    expect(db.apiToken.update).toHaveBeenCalled()
  })

  it('token inexistente → 401', async () => {
    vi.mocked(db.apiToken.findUnique).mockResolvedValue(null as never)
    await expect(resolveActor(reqWith({ authorization: `Bearer ${RAW}` }))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('token revogado → 401 e NÃO atualiza lastUsedAt', async () => {
    vi.mocked(db.apiToken.findUnique).mockResolvedValue({
      id: 'tok1', revokedAt: new Date('2020-01-01'), expiresAt: null, user: tokenUser,
    } as never)
    await expect(resolveActor(reqWith({ authorization: `Bearer ${RAW}` }))).rejects.toMatchObject({ statusCode: 401 })
    expect(db.apiToken.update).not.toHaveBeenCalled()
  })

  it('token expirado → 401', async () => {
    vi.mocked(db.apiToken.findUnique).mockResolvedValue({
      id: 'tok1', revokedAt: null, expiresAt: new Date('2020-01-01'), user: tokenUser,
    } as never)
    await expect(resolveActor(reqWith({ authorization: `Bearer ${RAW}` }))).rejects.toMatchObject({ statusCode: 401 })
  })

  it('formato inválido → 401 sem consultar o banco (sem fallback)', async () => {
    await expect(
      resolveActor(reqWith({ authorization: 'Bearer not-a-valid-token' }))
    ).rejects.toMatchObject({ statusCode: 401 })
    expect(db.apiToken.findUnique).not.toHaveBeenCalled()
  })

  it('sem header → fallback para sessão NextAuth', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: 'sess-user', role: 'admin' } } as never)
    const actor = await resolveActor(reqWith())
    expect(actor.id).toBe('sess-user')
    expect(db.apiToken.findUnique).not.toHaveBeenCalled()
  })

  it('sem header e sem sessão → 401', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as never)
    await expect(resolveActor(reqWith())).rejects.toMatchObject({ statusCode: 401 })
  })
})
