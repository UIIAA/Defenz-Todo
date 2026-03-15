import { vi } from 'vitest'

export const mockUser = {
  id: 'user-test-123',
  name: 'Test User',
  email: 'test@example.com',
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

export function mockAuthenticated() {
  getCurrentUser.mockResolvedValue(mockUser)
  getSession.mockResolvedValue({ user: mockUser })
  requireAuth.mockResolvedValue(mockUser)
}

export function mockUnauthenticated() {
  getCurrentUser.mockResolvedValue(undefined)
  getSession.mockResolvedValue(null)
  requireAuth.mockRejectedValue(new Error('Unauthorized'))
}
