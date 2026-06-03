import { describe, it, expect } from 'vitest'
import { toDateStr, todayStr, emptyForm, totalSpentMinutes, totalEstimatedMinutes } from '../helpers'

describe('toDateStr', () => {
  it('converts ISO string to YYYY-MM-DD', () => {
    expect(toDateStr('2025-01-15T12:00:00.000Z')).toBe('2025-01-15')
  })

  it('converts Date object (SP timezone)', () => {
    // new Date('2025-03-01T12:00:00Z') is noon UTC = 9am SP = still March 1st
    expect(toDateStr(new Date('2025-03-01T12:00:00Z'))).toBe('2025-03-01')
  })

  it('returns empty string for null', () => {
    expect(toDateStr(null)).toBe('')
  })
})

describe('todayStr', () => {
  it('returns today formatted as YYYY-MM-DD in SP timezone', () => {
    const result = todayStr()
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
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

  it('includes classification as null', () => {
    const form = emptyForm()
    expect(form.classification).toBeNull()
  })

  it('includes time tracking defaults', () => {
    const form = emptyForm()
    expect(form.spentMinutes).toBe(0)
    expect(form.estimatedMinutes).toBeNull()
  })
})

describe('totalSpentMinutes', () => {
  it('sums own minutes plus subtasks', () => {
    const d = {
      spentMinutes: 60,
      subtasks: [{ spentMinutes: 30 }, { spentMinutes: 15 }],
    } as Parameters<typeof totalSpentMinutes>[0]
    expect(totalSpentMinutes(d)).toBe(105)
  })

  it('uses own minutes when there are no subtasks', () => {
    expect(totalSpentMinutes({ spentMinutes: 45 })).toBe(45)
    expect(totalSpentMinutes({})).toBe(0)
  })
})

describe('totalEstimatedMinutes', () => {
  it('sums estimates, null when nothing estimated', () => {
    expect(
      totalEstimatedMinutes({ estimatedMinutes: 120, subtasks: [{ estimatedMinutes: 60 }] })
    ).toBe(180)
    expect(totalEstimatedMinutes({ subtasks: [{ spentMinutes: 30 }] })).toBeNull()
    expect(totalEstimatedMinutes({})).toBeNull()
  })
})
