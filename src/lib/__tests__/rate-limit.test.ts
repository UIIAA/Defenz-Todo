import { describe, it, expect } from 'vitest'
import { checkRateLimit } from '../rate-limit'

function makeRequest(ip = '127.0.0.1') {
  return {
    headers: {
      get: (name: string) => {
        if (name === 'x-forwarded-for') return ip
        return null
      },
    },
  } as any
}

describe('checkRateLimit', () => {
  it('allows requests under limit', () => {
    const req = makeRequest('10.0.0.1')
    const result = checkRateLimit(req, 'test-under', { limit: 3, windowMs: 60_000 })
    expect(result).toBeNull()
  })

  it('blocks after exceeding limit', () => {
    const ip = '10.0.0.2'
    const opts = { limit: 2, windowMs: 60_000 }

    checkRateLimit(makeRequest(ip), 'test-over', opts) // 1
    checkRateLimit(makeRequest(ip), 'test-over', opts) // 2
    const result = checkRateLimit(makeRequest(ip), 'test-over', opts) // 3 -> blocked

    expect(result).not.toBeNull()
    expect(result!.status).toBe(429)
  })

  it('different keys are independent', () => {
    const ip = '10.0.0.3'
    const opts = { limit: 1, windowMs: 60_000 }

    checkRateLimit(makeRequest(ip), 'key-a', opts) // 1 for key-a
    const result = checkRateLimit(makeRequest(ip), 'key-b', opts) // 1 for key-b
    expect(result).toBeNull()
  })

  it('different IPs are independent', () => {
    const opts = { limit: 1, windowMs: 60_000 }

    checkRateLimit(makeRequest('10.0.0.4'), 'test-ip', opts) // 1 for .4
    const result = checkRateLimit(makeRequest('10.0.0.5'), 'test-ip', opts) // 1 for .5
    expect(result).toBeNull()
  })
})
