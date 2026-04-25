import { NextRequest, NextResponse } from 'next/server'

interface RateLimitOptions {
  limit: number
  windowMs: number
}

const store = new Map<string, { count: number; resetAt: number }>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of store) {
    if (val.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function checkRateLimit(
  request: NextRequest,
  key: string,
  { limit, windowMs }: RateLimitOptions
): NextResponse | null {
  const ip = getClientIp(request)
  const id = `${key}:${ip}`
  const now = Date.now()

  const entry = store.get(id)

  if (!entry || entry.resetAt < now) {
    store.set(id, { count: 1, resetAt: now + windowMs })
    return null
  }

  entry.count++

  if (entry.count > limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: 'Muitas tentativas. Tente novamente em alguns minutos.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    )
  }

  return null
}
