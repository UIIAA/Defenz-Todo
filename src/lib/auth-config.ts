import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'

/**
 * Configuração do NextAuth
 *
 * IMPORTANTE:
 * - Usa CredentialsProvider (incompatível com PrismaAdapter)
 * - Sessions baseadas em JWT (não em banco de dados)
 * - Campos customizados: id, role, companyId, companyName, teamIds, department
 */
export const authOptions: NextAuthOptions = {
  // Note: PrismaAdapter is NOT compatible with CredentialsProvider
  // We use JWT sessions instead of database sessions
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        const emailNormalized = credentials.email.toLowerCase().trim()

        const user = await db.user.findFirst({
          where: { email: { equals: emailNormalized, mode: 'insensitive' } },
          include: {
            company: { select: { id: true, name: true, logoUrl: true, accentColor: true } },
            teams: {
              select: { team: { select: { id: true } } },
            },
          },
        })

        if (!user || !user.password) {
          throw new Error('Invalid credentials')
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error('Invalid credentials')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.company?.id,
          companyName: user.company?.name,
          companyLogoUrl: user.company?.logoUrl || undefined,
          companyAccentColor: user.company?.accentColor || undefined,
          teamIds: user.teams.map((ut) => ut.team.id),
          department: user.department || undefined,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/',
    error: '/'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.companyId = (user as { companyId?: string }).companyId
        token.companyName = (user as { companyName?: string }).companyName
        token.companyLogoUrl = (user as { companyLogoUrl?: string }).companyLogoUrl
        token.companyAccentColor = (user as { companyAccentColor?: string }).companyAccentColor
        token.teamIds = (user as { teamIds?: string[] }).teamIds
        token.department = (user as { department?: string }).department
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.companyId = token.companyId as string | undefined
        session.user.companyName = token.companyName as string | undefined
        session.user.companyLogoUrl = token.companyLogoUrl as string | undefined
        session.user.companyAccentColor = token.companyAccentColor as string | undefined
        session.user.teamIds = token.teamIds as string[] | undefined
        session.user.department = token.department as string | undefined
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET
}
