import { vi } from 'vitest'
import { ApiError } from '@/lib/api-helpers'

export const mockUser = {
  id: 'user-test-123',
  name: 'Test User',
  email: 'test@example.com',
  role: 'admin',
  companyId: 'company-defenz',
  companyIds: [] as string[],
  companyName: 'Defenz',
  teamIds: ['team-geral'],
  department: undefined,
}

const getCurrentUser = vi.fn()
const getSession = vi.fn()
const requireAuth = vi.fn()
const resolveActor = vi.fn()

// IMPORTANTE: estas cópias DEVEM espelhar src/lib/auth.ts em lockstep.
// A fonte da verdade da lógica é src/lib/__tests__/auth-multicompany.test.ts
// (testa a implementação real). Se a impl real mudar e estas cópias não,
// os testes de rota validam comportamento divergente da produção (falso verde).

function isAdmin(user: { role?: string } | null | undefined): boolean {
  return user?.role === 'admin'
}

function accessibleCompanyIds(user: {
  role?: string
  companyId?: string
  companyIds?: string[]
}): string[] | null {
  if (isAdmin(user)) return null
  const ids = [user.companyId, ...(user.companyIds ?? [])].filter(
    (id): id is string => !!id
  )
  return Array.from(new Set(ids))
}

function assertCompanyAccess(
  entityCompanyId: string | null | undefined,
  user: { role?: string; companyId?: string; companyIds?: string[] }
): void {
  const ids = accessibleCompanyIds(user)
  if (ids === null) return
  if (!entityCompanyId || !ids.includes(entityCompanyId)) {
    throw new ApiError('Acesso negado: recurso de outra empresa', 403, {
      code: 'FORBIDDEN_COMPANY',
    })
  }
}

function companyScopeWhere(user: {
  role?: string
  companyId?: string
  companyIds?: string[]
}): { companyId?: string | { in: string[] } } {
  const ids = accessibleCompanyIds(user)
  if (ids === null) return {}
  if (ids.length === 0) return { companyId: '__none__' }
  if (ids.length === 1) return { companyId: ids[0] }
  return { companyId: { in: ids } }
}

function resolveActiveCompany(
  user: { role?: string; companyId?: string; companyIds?: string[] },
  requestedCompanyId?: string | null
): string | null {
  if (isAdmin(user)) {
    return requestedCompanyId ?? user.companyId ?? null
  }
  const ids = accessibleCompanyIds(user) ?? []
  if (requestedCompanyId) {
    if (!ids.includes(requestedCompanyId)) {
      throw new ApiError('Empresa fora do seu escopo', 403, {
        code: 'FORBIDDEN_COMPANY',
      })
    }
    return requestedCompanyId
  }
  return user.companyId ?? null
}

vi.mock('@/lib/auth', () => ({
  getCurrentUser,
  getSession,
  requireAuth,
  resolveActor,
  isAdmin,
  accessibleCompanyIds,
  assertCompanyAccess,
  companyScopeWhere,
  resolveActiveCompany,
}))

export { getCurrentUser, getSession, requireAuth, resolveActor }

export function mockAuthenticated(overrides?: Partial<typeof mockUser>) {
  const user = { ...mockUser, ...overrides }
  getCurrentUser.mockResolvedValue(user)
  getSession.mockResolvedValue({ user })
  requireAuth.mockResolvedValue(user)
  resolveActor.mockResolvedValue(user)
}

export function mockUnauthenticated() {
  getCurrentUser.mockResolvedValue(undefined)
  getSession.mockResolvedValue(null)
  requireAuth.mockRejectedValue(new Error('Unauthorized'))
  resolveActor.mockRejectedValue(new ApiError('Nao autorizado', 401))
}
