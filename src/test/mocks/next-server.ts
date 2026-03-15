import { NextRequest } from 'next/server'

export function createRequest(
  method: string,
  options?: {
    body?: unknown
    searchParams?: Record<string, string>
    url?: string
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

  if (options?.body) {
    init.body = JSON.stringify(options.body)
    init.headers = { 'Content-Type': 'application/json' }
  }

  return new NextRequest(url, init)
}
