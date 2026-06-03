import { describe, it, expect } from 'vitest'
import { parseHoursToMinutes, minutesToHoursLabel, minutesToHoursInput } from '../duration'

describe('parseHoursToMinutes', () => {
  it('parses decimal hours with comma and dot', () => {
    expect(parseHoursToMinutes('1,5')).toBe(90)
    expect(parseHoursToMinutes('1.5')).toBe(90)
    expect(parseHoursToMinutes('0.25')).toBe(15)
    expect(parseHoursToMinutes(2)).toBe(120)
  })

  it('returns 0 for empty/invalid/negative', () => {
    expect(parseHoursToMinutes('')).toBe(0)
    expect(parseHoursToMinutes('abc')).toBe(0)
    expect(parseHoursToMinutes('-1')).toBe(0)
    expect(parseHoursToMinutes(null)).toBe(0)
  })
})

describe('minutesToHoursLabel', () => {
  it('formats minutes as pt-BR hours', () => {
    expect(minutesToHoursLabel(90)).toBe('1,5h')
    expect(minutesToHoursLabel(120)).toBe('2h')
    expect(minutesToHoursLabel(15)).toBe('0,25h')
  })

  it('handles zero/null', () => {
    expect(minutesToHoursLabel(0)).toBe('0h')
    expect(minutesToHoursLabel(null)).toBe('0h')
  })
})

describe('minutesToHoursInput', () => {
  it('returns decimal string or empty for zero/null', () => {
    expect(minutesToHoursInput(90)).toBe('1.5')
    expect(minutesToHoursInput(120)).toBe('2')
    expect(minutesToHoursInput(0)).toBe('')
    expect(minutesToHoursInput(null)).toBe('')
  })
})
