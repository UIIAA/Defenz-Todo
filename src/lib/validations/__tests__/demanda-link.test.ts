import { describe, it, expect } from 'vitest'
import { createLinkSchema, updateLinkSchema } from '../demanda-link'

describe('createLinkSchema', () => {
  it('accepts valid label and url', () => {
    const result = createLinkSchema.parse({ label: 'Documento', url: 'https://example.com' })
    expect(result.label).toBe('Documento')
    expect(result.url).toBe('https://example.com')
  })

  it('accepts with optional position', () => {
    const result = createLinkSchema.parse({ label: 'Ref', url: 'https://example.com', position: 2 })
    expect(result.position).toBe(2)
  })

  it('rejects empty label', () => {
    expect(() => createLinkSchema.parse({ label: '', url: 'https://example.com' })).toThrow()
  })

  it('rejects missing label', () => {
    expect(() => createLinkSchema.parse({ url: 'https://example.com' })).toThrow()
  })

  it('rejects label over 100 chars', () => {
    expect(() => createLinkSchema.parse({ label: 'a'.repeat(101), url: 'https://example.com' })).toThrow()
  })

  it('accepts label with exactly 100 chars', () => {
    const result = createLinkSchema.parse({ label: 'a'.repeat(100), url: 'https://example.com' })
    expect(result.label).toHaveLength(100)
  })

  it('rejects invalid url', () => {
    expect(() => createLinkSchema.parse({ label: 'Test', url: 'not-a-url' })).toThrow()
  })

  it('rejects empty url', () => {
    expect(() => createLinkSchema.parse({ label: 'Test', url: '' })).toThrow()
  })

  it('rejects url over 2000 chars', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(1981)
    expect(() => createLinkSchema.parse({ label: 'Test', url: longUrl })).toThrow()
  })

  it('accepts http url', () => {
    const result = createLinkSchema.parse({ label: 'Test', url: 'http://example.com' })
    expect(result.url).toBe('http://example.com')
  })
})

describe('updateLinkSchema', () => {
  it('accepts partial update with label only', () => {
    const result = updateLinkSchema.parse({ label: 'Novo rotulo' })
    expect(result.label).toBe('Novo rotulo')
    expect(result.url).toBeUndefined()
  })

  it('accepts partial update with url only', () => {
    const result = updateLinkSchema.parse({ url: 'https://new.com' })
    expect(result.url).toBe('https://new.com')
  })

  it('accepts empty object (no changes)', () => {
    const result = updateLinkSchema.parse({})
    expect(result.label).toBeUndefined()
    expect(result.url).toBeUndefined()
  })

  it('rejects invalid url on partial update', () => {
    expect(() => updateLinkSchema.parse({ url: 'invalid' })).toThrow()
  })

  it('rejects empty label on partial update', () => {
    expect(() => updateLinkSchema.parse({ label: '' })).toThrow()
  })
})
