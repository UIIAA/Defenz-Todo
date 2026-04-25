import { describe, it, expect } from 'vitest'
import { passwordSchema, registerSchema } from '../validations/password'

describe('passwordSchema', () => {
  it('rejects password shorter than 8 chars', () => {
    const result = passwordSchema.safeParse('Aa1@xyz')
    expect(result.success).toBe(false)
  })

  it('rejects password without uppercase', () => {
    const result = passwordSchema.safeParse('abcd1234@')
    expect(result.success).toBe(false)
  })

  it('rejects password without lowercase', () => {
    const result = passwordSchema.safeParse('ABCD1234@')
    expect(result.success).toBe(false)
  })

  it('rejects password without number', () => {
    const result = passwordSchema.safeParse('Abcdefgh@')
    expect(result.success).toBe(false)
  })

  it('rejects password without special char', () => {
    const result = passwordSchema.safeParse('Abcdefg1')
    expect(result.success).toBe(false)
  })

  it('accepts strong password', () => {
    const result = passwordSchema.safeParse('Damaso123@@')
    expect(result.success).toBe(true)
  })
})

describe('registerSchema', () => {
  it('validates a complete registration payload', () => {
    const result = registerSchema.safeParse({
      email: 'Test@Example.COM',
      password: 'StrongPass1!',
      name: 'Test User',
      token: 'abc-123',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('test@example.com') // lowercased + trimmed
    }
  })

  it('rejects missing token', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'StrongPass1!',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      email: 'not-an-email',
      password: 'StrongPass1!',
      token: 'abc',
    })
    expect(result.success).toBe(false)
  })
})
