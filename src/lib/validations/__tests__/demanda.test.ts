import { describe, it, expect } from 'vitest'
import { createDemandaSchema, updateDemandaSchema } from '../demanda'

describe('createDemandaSchema', () => {
  it('accepts complete valid input', () => {
    const input = {
      title: 'Proposta cliente X',
      description: 'Detalhes',
      origin: 'fernando',
      status: 'solicitada',
      priority: 'alta',
      assignee: 'Marcos',
      dateIn: '2025-01-15',
      deadline: '2025-02-15',
      dateDone: null,
    }
    const result = createDemandaSchema.parse(input)
    expect(result.title).toBe('Proposta cliente X')
    expect(result.origin).toBe('fernando')
    expect(result.priority).toBe('alta')
  })

  it('accepts minimal input (title only)', () => {
    const result = createDemandaSchema.parse({ title: 'Minima' })
    expect(result.title).toBe('Minima')
    expect(result.origin).toBe('outra')
    expect(result.status).toBe('solicitada')
    expect(result.priority).toBe('media')
  })

  it('rejects empty title', () => {
    expect(() => createDemandaSchema.parse({ title: '' })).toThrow()
  })

  it('rejects invalid origin', () => {
    expect(() =>
      createDemandaSchema.parse({ title: 'Test', origin: 'invalida' })
    ).toThrow()
  })

  it('rejects invalid status', () => {
    expect(() =>
      createDemandaSchema.parse({ title: 'Test', status: 'invalido' })
    ).toThrow()
  })

  it('rejects invalid priority', () => {
    expect(() =>
      createDemandaSchema.parse({ title: 'Test', priority: 'urgente' })
    ).toThrow()
  })

  it('allows dateDone null', () => {
    const result = createDemandaSchema.parse({ title: 'Test', dateDone: null })
    expect(result.dateDone).toBeNull()
  })
})

describe('updateDemandaSchema', () => {
  it('requires id', () => {
    expect(() => updateDemandaSchema.parse({ title: 'Test' })).toThrow()
  })

  it('allows partial fields', () => {
    const result = updateDemandaSchema.parse({ id: 'abc', status: 'concluida' })
    expect(result.id).toBe('abc')
    expect(result.status).toBe('concluida')
    expect(result.title).toBeUndefined()
  })

  // --- updatedAt tests (TDD — RED until schema is updated) ---

  it('accepts updatedAt as optional ISO string', () => {
    const result = updateDemandaSchema.parse({
      id: 'abc',
      title: 'Updated',
      updatedAt: '2025-01-15T00:00:00.000Z',
    })
    expect(result.updatedAt).toBe('2025-01-15T00:00:00.000Z')
  })

  it('validates updatedAt format is ISO datetime', () => {
    expect(() =>
      updateDemandaSchema.parse({
        id: 'abc',
        updatedAt: 'not-a-date',
      })
    ).toThrow()
  })
})
