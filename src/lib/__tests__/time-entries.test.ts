import { describe, it, expect } from 'vitest'
import { computeDelta, groupBy, sumMinutes } from '../time-entries'

describe('computeDelta', () => {
  it('returns positive delta when minutes increase', () => {
    expect(computeDelta(60, 90)).toBe(30)
  })

  it('returns negative delta on a correction', () => {
    expect(computeDelta(120, 90)).toBe(-30)
  })

  it('returns 0 when unchanged', () => {
    expect(computeDelta(60, 60)).toBe(0)
  })

  it('treats nullish as 0', () => {
    expect(computeDelta(null, 45)).toBe(45)
    expect(computeDelta(30, undefined)).toBe(-30)
  })
})

describe('sumMinutes', () => {
  it('sums minutes including negative deltas (correções fecham o total)', () => {
    expect(sumMinutes([{ minutes: 60 }, { minutes: -15 }, { minutes: 30 }])).toBe(75)
  })

  it('returns 0 for an empty list', () => {
    expect(sumMinutes([])).toBe(0)
  })
})

describe('groupBy', () => {
  it('groups entries by a derived key and is summable per group', () => {
    const entries = [
      { client: 'Acme', minutes: 60 },
      { client: 'Acme', minutes: 30 },
      { client: 'Globex', minutes: 45 },
    ]
    const grouped = groupBy(entries, (e) => e.client)
    expect(grouped.get('Acme')).toHaveLength(2)
    expect(grouped.get('Globex')).toHaveLength(1)
    expect(sumMinutes(grouped.get('Acme')!)).toBe(90)
    expect(sumMinutes(grouped.get('Globex')!)).toBe(45)
  })

  it('returns an empty map for no entries', () => {
    expect(groupBy([], () => 'x').size).toBe(0)
  })
})
