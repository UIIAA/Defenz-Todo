import { describe, it, expect, vi } from 'vitest'

// Evita o fail-fast do auth-config (NEXTAUTH_SECRET) ao importar auth.ts.
vi.mock('next-auth', () => ({ getServerSession: vi.fn() }))
vi.mock('@/lib/auth-config', () => ({ authOptions: {} }))

import {
  accessibleCompanyIds,
  assertCompanyAccess,
  companyScopeWhere,
  resolveActiveCompany,
} from '../auth'
import { ApiError } from '../api-helpers'

// Esta suíte testa a IMPLEMENTAÇÃO REAL (sem mock) — é a fonte da verdade
// da lógica de tenant isolation por conjunto de empresas. O mock em
// src/test/mocks/auth.ts deve espelhar exatamente este comportamento.

describe('accessibleCompanyIds', () => {
  it('admin → null (sem restrição)', () => {
    expect(accessibleCompanyIds({ role: 'admin', companyId: 'a' })).toBeNull()
  })

  it('single-company → [companyId] (backward-compat)', () => {
    expect(accessibleCompanyIds({ role: 'gerencia', companyId: 'a' })).toEqual(['a'])
  })

  it('multi-company → dedup [primária, ...adicionais]', () => {
    expect(
      accessibleCompanyIds({ role: 'user', companyId: 'a', companyIds: ['a', 'b'] })
    ).toEqual(['a', 'b'])
  })

  it('sem empresa → []', () => {
    expect(accessibleCompanyIds({ role: 'user', companyId: undefined })).toEqual([])
  })
})

describe('companyScopeWhere (set)', () => {
  it('admin → {}', () => {
    expect(companyScopeWhere({ role: 'admin', companyId: 'a' })).toEqual({})
  })

  it('single → scalar (backward-compat)', () => {
    expect(companyScopeWhere({ role: 'gerencia', companyId: 'a' })).toEqual({ companyId: 'a' })
  })

  it('multi → { companyId: { in: [...] } }', () => {
    expect(
      companyScopeWhere({ role: 'gerencia', companyId: 'a', companyIds: ['a', 'b'] })
    ).toEqual({ companyId: { in: ['a', 'b'] } })
  })

  it('sem empresa → sentinela __none__', () => {
    expect(companyScopeWhere({ role: 'user', companyId: undefined })).toEqual({
      companyId: '__none__',
    })
  })
})

describe('assertCompanyAccess (set)', () => {
  const multi = { role: 'user', companyId: 'a', companyIds: ['a', 'b'] }

  it('entity ∈ set → não lança', () => {
    expect(() => assertCompanyAccess('b', multi)).not.toThrow()
    expect(() => assertCompanyAccess('a', multi)).not.toThrow()
  })

  it('entity fora do set → ApiError 403', () => {
    expect(() => assertCompanyAccess('c', multi)).toThrow(ApiError)
    try {
      assertCompanyAccess('c', multi)
    } catch (e) {
      expect((e as ApiError).statusCode).toBe(403)
    }
  })
})

describe('resolveActiveCompany', () => {
  const multi = { role: 'user', companyId: 'a', companyIds: ['a', 'b'] }

  it('requested ∈ set → retorna requested', () => {
    expect(resolveActiveCompany(multi, 'b')).toBe('b')
  })

  it('requested fora do set → ApiError 403', () => {
    expect(() => resolveActiveCompany(multi, 'c')).toThrow(ApiError)
  })

  it('sem requested → empresa primária', () => {
    expect(resolveActiveCompany(multi)).toBe('a')
  })

  it('admin com requested fora do set → permitido (cross-company)', () => {
    expect(resolveActiveCompany({ role: 'admin', companyId: 'a' }, 'z')).toBe('z')
  })
})
