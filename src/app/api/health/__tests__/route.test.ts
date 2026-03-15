import { describe, it, expect } from 'vitest'
import { GET } from '../route'

describe('GET /api/health', () => {
  it('returns { message: "Good!" }', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ message: 'Good!' })
  })
})
