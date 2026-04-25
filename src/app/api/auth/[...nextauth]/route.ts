import { NextRequest } from 'next/server'
import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { checkRateLimit } from '@/lib/rate-limit'

const handler = NextAuth(authOptions)

// GET passes through (callback, csrf token, etc.)
export { handler as GET }

// POST: rate-limit login attempts (5/min per IP)
export async function POST(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const limited = checkRateLimit(request, 'auth-login', { limit: 5, windowMs: 60_000 })
  if (limited) return limited
  return handler(request, context)
}
