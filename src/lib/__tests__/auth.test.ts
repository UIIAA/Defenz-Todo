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

import { getSession, getCurrentUser, requireAuth } from '../auth'

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
})
