import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'

/**
 * Utilitários de autenticação para Server Components e API Routes
 */

/**
 * Retorna a sessão atual do NextAuth
 */
export async function getSession() {
  return await getServerSession(authOptions)
}

/**
 * Retorna o usuário atual autenticado
 * @returns User com id, email, name, role ou undefined
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

/**
 * Requer autenticação - lança erro se não autenticado
 * @throws Error('Unauthorized') se usuário não autenticado
 * @returns User autenticado
 */
export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}
