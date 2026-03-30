import { describe, it, expect } from 'vitest'
import { createCompanySchema, updateCompanySchema } from '../company'

describe('createCompanySchema', () => {
  it('accepts valid name only', () => {
    const result = createCompanySchema.parse({ name: 'Defenz' })
    expect(result.name).toBe('Defenz')
  })

  it('accepts name + logo + color', () => {
    const result = createCompanySchema.parse({
      name: 'Defenz',
      logoUrl: 'https://cdn.example.com/logo.png',
      accentColor: '#2563eb',
    })
    expect(result.logoUrl).toBe('https://cdn.example.com/logo.png')
    expect(result.accentColor).toBe('#2563eb')
  })

  it('accepts empty logoUrl and accentColor', () => {
    const result = createCompanySchema.parse({ name: 'Test', logoUrl: '', accentColor: '' })
    expect(result.logoUrl).toBe('')
    expect(result.accentColor).toBe('')
  })

  it('rejects empty name', () => {
    expect(() => createCompanySchema.parse({ name: '' })).toThrow()
  })

  it('rejects missing name', () => {
    expect(() => createCompanySchema.parse({})).toThrow()
  })

  it('rejects invalid url', () => {
    expect(() => createCompanySchema.parse({ name: 'Test', logoUrl: 'not-a-url' })).toThrow()
  })

  it('rejects invalid hex color', () => {
    expect(() => createCompanySchema.parse({ name: 'Test', accentColor: 'red' })).toThrow()
    expect(() => createCompanySchema.parse({ name: 'Test', accentColor: '#fff' })).toThrow()
    expect(() => createCompanySchema.parse({ name: 'Test', accentColor: '2563eb' })).toThrow()
  })

  it('accepts valid hex colors', () => {
    expect(createCompanySchema.parse({ name: 'T', accentColor: '#000000' }).accentColor).toBe('#000000')
    expect(createCompanySchema.parse({ name: 'T', accentColor: '#FFFFFF' }).accentColor).toBe('#FFFFFF')
    expect(createCompanySchema.parse({ name: 'T', accentColor: '#aB12cD' }).accentColor).toBe('#aB12cD')
  })
})

describe('updateCompanySchema', () => {
  it('requires id', () => {
    expect(() => updateCompanySchema.parse({})).toThrow()
  })

  it('accepts id + partial name', () => {
    const result = updateCompanySchema.parse({ id: 'abc', name: 'Novo Nome' })
    expect(result.name).toBe('Novo Nome')
  })

  it('accepts id + branding only', () => {
    const result = updateCompanySchema.parse({ id: 'abc', logoUrl: 'https://x.com/l.png', accentColor: '#ff0000' })
    expect(result.logoUrl).toBe('https://x.com/l.png')
    expect(result.name).toBeUndefined()
  })

  it('accepts null logoUrl and accentColor', () => {
    const result = updateCompanySchema.parse({ id: 'abc', logoUrl: null, accentColor: null })
    expect(result.logoUrl).toBeNull()
    expect(result.accentColor).toBeNull()
  })

  it('accepts empty string for logoUrl and accentColor', () => {
    const result = updateCompanySchema.parse({ id: 'abc', logoUrl: '', accentColor: '' })
    expect(result.logoUrl).toBe('')
    expect(result.accentColor).toBe('')
  })
})
