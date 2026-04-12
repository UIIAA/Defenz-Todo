import { vi } from 'vitest'
import { ApiError } from '@/lib/api-helpers'

export const mockUser = {
  id: 'user-test-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  companyId: 'company-defenz',
  companyName: 'Defenz',
  teamIds: ['team-geral'],
  department: undefined,
}

const getCurrentUser = vi.fn()
const getSession = vi.fn()
const requireAuth = vi.fn()

function isAdmin(user: { role?: string } | null | undefined): boolean {
  return user?.role === 'admin'
}

function assertCompanyAccess(
  entityCompanyId: string | null | undefined,
  user: { role?: string; companyId?: string }
): void {
  if (isAdmin(user)) return
  if (!user.companyId || !entityCompanyId || entityCompanyId !== user.companyId) {
    throw new ApiError('Acesso negado: recurso de outra empresa', 403, {
      code: 'FORBIDDEN_COMPANY',
    })
  }
}

function companyScopeWhere(
  user: { role?: string; companyId?: string }
): { companyId?: string } {
  if (isAdmin(user)) return {}
  return { companyId: user.companyId ?? '__none__' }
}

vi.mock('@/lib/auth', () => ({
  getCurrentUser,
  getSession,
  requireAuth,
  isAdmin,
  assertCompanyAccess,
  companyScopeWhere,
}))

export { getCurrentUser, getSession, requireAuth }

export function mockAuthenticated(overrides?: Partial<typeof mockUser>) {
  const user = { ...mockUser, ...overrides }
  getCurrentUser.mockResolvedValue(user)
  getSession.mockResolvedValue({ user })
  requireAuth.mockResolvedValue(user)
}

export function mockUnauthenticated() {
  getCurrentUser.mockResolvedValue(undefined)
  getSession.mockResolvedValue(null)
  requireAuth.mockRejectedValue(new Error('Unauthorized'))
}
