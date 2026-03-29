import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

/**
 * Module augmentation para NextAuth.js
 *
 * Estende os tipos padrão para incluir campos customizados:
 * - user.id: ID único do usuário no banco
 * - user.role: Papel do usuário no sistema (admin, user, gerencia)
 * - user.companyId/companyName: Empresa do usuário
 * - user.teamIds: IDs das equipes do usuário
 * - user.department: Departamento informativo
 */

declare module 'next-auth' {
  interface User extends DefaultUser {
    id: string
    role: string
    companyId?: string
    companyName?: string
    companyLogoUrl?: string
    companyAccentColor?: string
    teamIds?: string[]
    department?: string
  }

  interface Session extends DefaultSession {
    user: {
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
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    companyId?: string
    companyName?: string
    companyLogoUrl?: string
    companyAccentColor?: string
    teamIds?: string[]
    department?: string
  }
}
