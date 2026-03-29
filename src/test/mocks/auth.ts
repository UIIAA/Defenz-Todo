import { vi } from 'vitest'

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

vi.mock('@/lib/auth', () => ({
  getCurrentUser,
  getSession,
  requireAuth,
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
