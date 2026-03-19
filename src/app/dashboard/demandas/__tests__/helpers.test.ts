import { describe, it, expect } from 'vitest'
import { toDateStr, todayStr, emptyForm } from '../helpers'

describe('toDateStr', () => {
  it('converts ISO string to YYYY-MM-DD', () => {
    expect(toDateStr('2025-01-15T12:00:00.000Z')).toBe('2025-01-15')
  })

  it('converts Date object', () => {
    expect(toDateStr(new Date('2025-03-01'))).toBe('2025-03-01')
  })

  it('returns empty string for null', () => {
    expect(toDateStr(null)).toBe('')
  })
})

describe('todayStr', () => {
  it('returns today formatted as YYYY-MM-DD', () => {
    const result = todayStr()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(result).toBe(new Date().toISOString().split('T')[0])
  })
})

describe('emptyForm', () => {
  it('returns correct defaults', () => {
    const form = emptyForm()
    expect(form.title).toBe('')
    expect(form.description).toBe('')
    expect(form.origin).toBe('fernando')
    expect(form.status).toBe('solicitada')
    expect(form.priority).toBe('media')
    expect(form.assignee).toBeNull()
    expect(form.dateDone).toBeNull()
    expect(form.dateIn).toBe(todayStr())
  })

  it('includes previousStatus as null', () => {
    const form = emptyForm()
    expect(form.previousStatus).toBeNull()
  })
})
