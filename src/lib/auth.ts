import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { ApiError } from '@/lib/api-helpers'

export type SessionUser = {
  id: string
  role: string
  companyId?: string
  companyName?: string
  companyLogoUrl?: string
  companyAccentColor?: string
  teamIds?: string[]
  department?: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export function isAdmin(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'admin'
}

export function assertCompanyAccess(
  entityCompanyId: string | null | undefined,
  user: Pick<SessionUser, 'role' | 'companyId'>
): void {
  if (isAdmin(user)) return
  if (!user.companyId || !entityCompanyId || entityCompanyId !== user.companyId) {
    throw new ApiError('Acesso negado: recurso de outra empresa', 403, { code: 'FORBIDDEN_COMPANY' })
  }
}

export function companyScopeWhere(
  user: Pick<SessionUser, 'role' | 'companyId'>
): { companyId?: string } {
  if (isAdmin(user)) return {}
  return { companyId: user.companyId ?? '__none__' }
}
