import { NextRequest } from 'next/server'

export function createRequest(
  method: string,
  options?: {
    body?: unknown
    searchParams?: Record<string, string>
    url?: string
    headers?: Record<string, string>
  }
) {
  const baseUrl = options?.url || 'http://localhost:3000/api/test'
  const url = new URL(baseUrl)

  if (options?.searchParams) {
    Object.entries(options.searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value)
    })
  }

  const init: RequestInit = { method }
  const headers: Record<string, string> = { ...(options?.headers ?? {}) }

  if (options?.body) {
    init.body = JSON.stringify(options.body)
    headers['Content-Type'] = 'application/json'
  }

  if (Object.keys(headers).length > 0) {
    init.headers = headers
  }

  return new NextRequest(url, init)
}
