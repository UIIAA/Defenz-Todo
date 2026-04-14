import { describe, it, expect } from 'vitest'
import { parseLocalDate, toDateStr, formatDate } from '../date'

describe('parseLocalDate', () => {
  it('parses YYYY-MM-DD as São Paulo midnight', () => {
    const d = parseLocalDate('2026-04-13')
    expect(d).not.toBeNull()
    // Meia-noite SP = 03:00 UTC
    expect(d!.toISOString()).toBe('2026-04-13T03:00:00.000Z')
  })

  it('round-trip: parseLocalDate → toDateStr preserves the day', () => {
    const d = parseLocalDate('2026-04-13')
    expect(toDateStr(d!)).toBe('2026-04-13')
  })

  it('round-trip: parseLocalDate → formatDate renders correctly in SP', () => {
    const d = parseLocalDate('2026-04-13')
    expect(formatDate(d!)).toBe('13/04/2026')
  })

  it('edge case: date near DST boundary (Brazil has no DST since 2019)', () => {
    const d = parseLocalDate('2026-10-15')
    expect(toDateStr(d!)).toBe('2026-10-15')
  })

  it('passes through full ISO strings untouched', () => {
    const iso = '2026-04-13T15:30:00.000Z'
    const d = parseLocalDate(iso)
    expect(d!.toISOString()).toBe(iso)
  })

  it('passes through Date instances', () => {
    const original = new Date('2026-04-13T10:00:00Z')
    const d = parseLocalDate(original)
    expect(d).toBe(original)
  })

  it('returns null for null/undefined/empty', () => {
    expect(parseLocalDate(null)).toBeNull()
    expect(parseLocalDate(undefined)).toBeNull()
    expect(parseLocalDate('')).toBeNull()
    expect(parseLocalDate('   ')).toBeNull()
  })

  it('returns null for invalid strings', () => {
    expect(parseLocalDate('not a date')).toBeNull()
  })

  it('reproduces the original bug when using naive new Date()', () => {
    // Documenta o comportamento buggy que estamos corrigindo
    const buggy = new Date('2026-04-13')
    // new Date("2026-04-13") interpreta como UTC midnight
    expect(buggy.toISOString()).toBe('2026-04-13T00:00:00.000Z')
    // Em SP (GMT-3), isso vira 12/04 21:00 — ERRADO
    expect(toDateStr(buggy)).toBe('2026-04-12')

    // parseLocalDate corrige
    const fixed = parseLocalDate('2026-04-13')
    expect(toDateStr(fixed!)).toBe('2026-04-13')
  })
})
