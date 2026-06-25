import { describe, it, expect } from 'vitest'
import { computeTicketTimestamps, computeServiceDeskMetrics } from '../tickets-server'

const NOW = new Date('2026-06-24T12:00:00Z')

describe('computeTicketTimestamps', () => {
  it('seta resolvedAt ao ir para resolved', () => {
    const r = computeTicketTimestamps({ status: 'open', resolvedAt: null }, { status: 'resolved' }, NOW)
    expect(r.resolvedAt).toEqual(NOW)
  })

  it('limpa resolvedAt ao reabrir (resolved -> open)', () => {
    const r = computeTicketTimestamps({ status: 'resolved', resolvedAt: NOW }, { status: 'open' }, NOW)
    expect(r.resolvedAt).toBeNull()
  })

  it('não toca resolvedAt em mudança que não envolve resolved', () => {
    const r = computeTicketTimestamps({ status: 'open', resolvedAt: null }, { status: 'paused' }, NOW)
    expect(r).not.toHaveProperty('resolvedAt')
  })

  it('não toca resolvedAt quando status não muda', () => {
    const r = computeTicketTimestamps({ status: 'open', resolvedAt: null }, {}, NOW)
    expect(r).not.toHaveProperty('resolvedAt')
  })
})

describe('computeServiceDeskMetrics', () => {
  it('calcula volume, backlog, interações, tempo e % escalado', () => {
    const tickets = [
      {
        id: 't1', status: 'resolved',
        createdAt: new Date('2026-06-20T10:00:00Z'), resolvedAt: new Date('2026-06-20T12:00:00Z'),
        escalatedAt: new Date('2026-06-20T11:00:00Z'), escalatedTo: 'SecuriSoft', replyCount: 3,
      },
      {
        id: 't2', status: 'open',
        createdAt: new Date('2026-06-24T10:00:00Z'), resolvedAt: null,
        escalatedAt: null, escalatedTo: null, replyCount: 1,
      },
    ]
    const m = computeServiceDeskMetrics(tickets, NOW)
    expect(m.total).toBe(2)
    expect(m.backlog).toBe(1)
    expect(m.escalatedCount).toBe(1)
    expect(m.escalatedPct).toBeCloseTo(50)
    expect(m.avgRepliesPerTicket).toBeCloseTo(2) // (3+1)/2
    expect(m.avgResolutionMinutes).toBeCloseTo(120) // t1: 2h
    expect(m.avgOpenAgeMinutes).toBeCloseTo(120) // t2: 10h->12h = 2h aberto
    expect(m.escalatedByPartner).toEqual([{ partner: 'SecuriSoft', count: 1 }])
  })

  it('lista vazia → zeros sem divisão por zero', () => {
    const m = computeServiceDeskMetrics([], NOW)
    expect(m.total).toBe(0)
    expect(m.escalatedPct).toBe(0)
    expect(m.avgRepliesPerTicket).toBe(0)
    expect(m.avgResolutionMinutes).toBe(0)
    expect(m.escalatedByPartner).toEqual([])
  })
})
