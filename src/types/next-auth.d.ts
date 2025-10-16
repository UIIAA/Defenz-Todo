import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

/**
 * Module augmentation para NextAuth.js
 *
 * Estende os tipos padrão para incluir campos customizados:
 * - user.id: ID único do usuário no banco
 * - user.role: Papel do usuário no sistema (admin, user, etc)
 */

declare module 'next-auth' {
  /**
   * Estende a interface User retornada no callback authorize()
   */
  interface User extends DefaultUser {
    id: string
    role: string
  }

  /**
   * Estende a interface Session disponível no cliente e servidor
   */
  interface Session extends DefaultSession {
    user: {
      id: string
      role: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  /**
   * Estende a interface JWT token
   */
  interface JWT extends DefaultJWT {
    id: string
    role: string
  }
}
