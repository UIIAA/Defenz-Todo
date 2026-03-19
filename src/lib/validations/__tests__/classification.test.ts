import { describe, it, expect } from 'vitest'
import { createDemandaSchema, updateDemandaSchema } from '../demanda'

describe('createDemandaSchema — classification field', () => {
  it('accepts valid classification', () => {
    const result = createDemandaSchema.parse({
      title: 'Test',
      classification: 'marketing',
    })
    expect(result.classification).toBe('marketing')
  })

  it('accepts all 9 classification values', () => {
    const ids = [
      'marketing', 'administrativo', 'vendas', 'financeiro',
      'operacional', 'tecnologia', 'juridico', 'rh', 'estrategico',
    ]
    for (const id of ids) {
      const result = createDemandaSchema.parse({ title: 'Test', classification: id })
      expect(result.classification).toBe(id)
    }
  })

  it('accepts null classification', () => {
    const result = createDemandaSchema.parse({ title: 'Test', classification: null })
    expect(result.classification).toBeNull()
  })

  it('accepts undefined (omitted) classification', () => {
    const result = createDemandaSchema.parse({ title: 'Test' })
    expect(result.classification).toBeUndefined()
  })

  it('rejects invalid classification', () => {
    expect(() =>
      createDemandaSchema.parse({ title: 'Test', classification: 'invalida' })
    ).toThrow()
  })
})

describe('updateDemandaSchema — classification field', () => {
  it('accepts classification in partial update', () => {
    const result = updateDemandaSchema.parse({
      id: 'abc',
      classification: 'tecnologia',
    })
    expect(result.classification).toBe('tecnologia')
  })

  it('accepts null to clear classification', () => {
    const result = updateDemandaSchema.parse({
      id: 'abc',
      classification: null,
    })
    expect(result.classification).toBeNull()
  })
})
