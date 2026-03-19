import { describe, it, expect } from 'vitest'
import { createDemandaSchema } from '../demanda'

describe('createDemandaSchema — assignee nullable', () => {
  it('accepts null assignee', () => {
    const result = createDemandaSchema.parse({ title: 'Test', assignee: null })
    expect(result.assignee).toBeNull()
  })

  it('accepts undefined assignee', () => {
    const result = createDemandaSchema.parse({ title: 'Test' })
    expect(result.assignee).toBeUndefined()
  })

  it('accepts string assignee', () => {
    const result = createDemandaSchema.parse({ title: 'Test', assignee: 'Marcos' })
    expect(result.assignee).toBe('Marcos')
  })

  it('rejects non-string assignee', () => {
    expect(() =>
      createDemandaSchema.parse({ title: 'Test', assignee: 123 })
    ).toThrow()
  })
})
