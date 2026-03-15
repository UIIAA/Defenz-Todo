import { default as nextAuthMiddleware } from 'next-auth/middleware'

export function middleware(...args: Parameters<typeof nextAuthMiddleware>) {
  return nextAuthMiddleware(...args)
}

export const config = {
  matcher: ['/dashboard/:path*']
}
