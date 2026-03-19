import { describe, it, expect } from 'vitest'
import { createSubtaskSchema, updateSubtaskSchema } from '../subtask'

describe('createSubtaskSchema', () => {
  it('accepts valid title', () => {
    const result = createSubtaskSchema.parse({ title: 'Fazer revisao' })
    expect(result.title).toBe('Fazer revisao')
  })

  it('accepts title with position', () => {
    const result = createSubtaskSchema.parse({ title: 'Item', position: 3 })
    expect(result.position).toBe(3)
  })

  it('rejects empty title', () => {
    expect(() => createSubtaskSchema.parse({ title: '' })).toThrow()
  })

  it('rejects missing title', () => {
    expect(() => createSubtaskSchema.parse({})).toThrow()
  })

  it('rejects title over 200 chars', () => {
    expect(() => createSubtaskSchema.parse({ title: 'a'.repeat(201) })).toThrow()
  })

  it('rejects negative position', () => {
    expect(() => createSubtaskSchema.parse({ title: 'Ok', position: -1 })).toThrow()
  })

  it('allows position 0', () => {
    const result = createSubtaskSchema.parse({ title: 'First', position: 0 })
    expect(result.position).toBe(0)
  })
})

describe('updateSubtaskSchema', () => {
  it('accepts completed toggle', () => {
    const result = updateSubtaskSchema.parse({ completed: true })
    expect(result.completed).toBe(true)
  })

  it('accepts title update', () => {
    const result = updateSubtaskSchema.parse({ title: 'Novo titulo' })
    expect(result.title).toBe('Novo titulo')
  })

  it('accepts position update', () => {
    const result = updateSubtaskSchema.parse({ position: 5 })
    expect(result.position).toBe(5)
  })

  it('accepts empty object (no changes)', () => {
    const result = updateSubtaskSchema.parse({})
    expect(result.completed).toBeUndefined()
    expect(result.title).toBeUndefined()
  })

  it('rejects empty title string', () => {
    expect(() => updateSubtaskSchema.parse({ title: '' })).toThrow()
  })

  it('rejects title over 200 chars', () => {
    expect(() => updateSubtaskSchema.parse({ title: 'x'.repeat(201) })).toThrow()
  })
})
