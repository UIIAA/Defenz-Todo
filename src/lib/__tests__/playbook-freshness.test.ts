import { describe, it, expect } from 'vitest'
import { freshnessOf, nextReviewDueAt } from '../playbook-freshness'

const agora = new Date('2026-08-05T12:00:00Z')
const ontem = new Date('2026-08-04T12:00:00Z')
const amanha = new Date('2026-08-06T12:00:00Z')

describe('freshnessOf', () => {
  it('nunca verificado quando verifiedAt é null', () => {
    expect(freshnessOf({ verifiedAt: null, reviewDueAt: agora }, agora)).toBe('nunca_verificado')
  })

  it('precisa revisão quando reviewDueAt já passou', () => {
    expect(freshnessOf({ verifiedAt: ontem, reviewDueAt: ontem }, agora)).toBe('precisa_revisao')
  })

  it('verificado quando reviewDueAt está no futuro', () => {
    expect(freshnessOf({ verifiedAt: agora, reviewDueAt: amanha }, agora)).toBe('verificado')
  })

  it('evergreen (reviewDueAt null) nunca fica stale', () => {
    expect(freshnessOf({ verifiedAt: agora, reviewDueAt: null }, agora)).toBe('verificado')
  })
})

describe('nextReviewDueAt', () => {
  it('soma o intervalo em dias', () => {
    expect(nextReviewDueAt(90, agora)?.toISOString()).toBe('2026-11-03T12:00:00.000Z')
  })

  it('devolve null para evergreen', () => {
    expect(nextReviewDueAt(null, agora)).toBeNull()
  })
})
