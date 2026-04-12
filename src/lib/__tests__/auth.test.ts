import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetServerSession } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
}))

vi.mock('next-auth', () => ({
  getServerSession: mockGetServerSession,
}))

vi.mock('@/lib/auth-config', () => ({
  authOptions: {},
}))

import { getSession, getCurrentUser, requireAuth, assertCompanyAccess, isAdmin, companyScopeWhere } from '../auth'
import { ApiError } from '../api-helpers'

describe('auth utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSession returns session from getServerSession', async () => {
    const session = { user: { id: '1', name: 'Test', email: 'a@b.com' } }
    mockGetServerSession.mockResolvedValue(session)
    const result = await getSession()
    expect(result).toEqual(session)
  })

  it('getCurrentUser returns user from session', async () => {
    const session = { user: { id: '1', name: 'Test', email: 'a@b.com' } }
    mockGetServerSession.mockResolvedValue(session)
    const user = await getCurrentUser()
    expect(user).toEqual(session.user)
  })

  it('getCurrentUser returns undefined without session', async () => {
    mockGetServerSession.mockResolvedValue(null)
    const user = await getCurrentUser()
    expect(user).toBeUndefined()
  })

  it('requireAuth returns user when authenticated', async () => {
    const session = { user: { id: '1', name: 'Test', email: 'a@b.com' } }
    mockGetServerSession.mockResolvedValue(session)
    const user = await requireAuth()
    expect(user).toEqual(session.user)
  })

  it('requireAuth throws Unauthorized without session', async () => {
    mockGetServerSession.mockResolvedValue(null)
    await expect(requireAuth()).rejects.toThrow('Unauthorized')
  })

  describe('isAdmin', () => {
    it('returns true for admin role', () => {
      expect(isAdmin({ role: 'admin' })).toBe(true)
    })
    it('returns false for gerencia and user roles', () => {
      expect(isAdmin({ role: 'gerencia' })).toBe(false)
      expect(isAdmin({ role: 'user' })).toBe(false)
    })
  })

  describe('assertCompanyAccess', () => {
    it('admin bypass: no throw regardless of entityCompanyId', () => {
      expect(() => assertCompanyAccess('any-company', { role: 'admin', companyId: 'other' })).not.toThrow()
      expect(() => assertCompanyAccess(null, { role: 'admin' })).not.toThrow()
    })

    it('gerencia same company: no throw', () => {
      expect(() =>
        assertCompanyAccess('defenz-id', { role: 'gerencia', companyId: 'defenz-id' })
      ).not.toThrow()
    })

    it('gerencia different company: throws ApiError 403', () => {
      expect(() =>
        assertCompanyAccess('cowcycling-id', { role: 'gerencia', companyId: 'defenz-id' })
      ).toThrow(ApiError)
      try {
        assertCompanyAccess('cowcycling-id', { role: 'gerencia', companyId: 'defenz-id' })
      } catch (e) {
        expect((e as ApiError).statusCode).toBe(403)
      }
    })

    it('user without companyId: throws', () => {
      expect(() =>
        assertCompanyAccess('any', { role: 'user', companyId: undefined })
      ).toThrow(ApiError)
    })

    it('null entityCompanyId for non-admin: throws', () => {
      expect(() =>
        assertCompanyAccess(null, { role: 'gerencia', companyId: 'defenz-id' })
      ).toThrow(ApiError)
    })
  })

  describe('companyScopeWhere', () => {
    it('returns empty where for admin', () => {
      expect(companyScopeWhere({ role: 'admin', companyId: 'x' })).toEqual({})
    })
    it('returns companyId filter for gerencia', () => {
      expect(companyScopeWhere({ role: 'gerencia', companyId: 'defenz-id' })).toEqual({
        companyId: 'defenz-id',
      })
    })
    it('returns sentinel for user with no companyId (blocks results)', () => {
      expect(companyScopeWhere({ role: 'user', companyId: undefined })).toEqual({
        companyId: '__none__',
      })
    })
  })
})
