import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-config'

/**
 * Route Handler do NextAuth
 *
 * Importa a configuração de @/lib/auth-config para evitar
 * problemas com exportação de authOptions diretamente de route.ts
 */
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
