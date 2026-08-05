import { describe, it, expect } from 'vitest'
import { computeTicketTimestamps, computeServiceDeskMetrics } from '../tickets-server'

const NOW = new Date('2026-06-24T12:00:00Z')

// ─── computeTicketTimestamps ─────────────────────────────────────────────────

describe('computeTicketTimestamps', () => {
  it('seta resolvedAt e columnChangedAt ao ir para concluido', () => {
    const r = computeTicketTimestamps(
      { status: 'em_atendimento', resolvedAt: null },
      { status: 'concluido' },
      NOW
    )
    expect(r.resolvedAt).toEqual(NOW)
    expect(r.columnChangedAt).toEqual(NOW)
  })

  it('limpa resolvedAt e seta columnChangedAt ao reabrir (concluido -> solicitado)', () => {
    const r = computeTicketTimestamps(
      { status: 'concluido', resolvedAt: NOW },
      { status: 'solicitado' },
      NOW
    )
    expect(r.resolvedAt).toBeNull()
    expect(r.columnChangedAt).toEqual(NOW)
  })

  it('seta columnChangedAt em troca lateral (solicitado -> em_atendimento) sem mexer em resolvedAt', () => {
    const r = computeTicketTimestamps(
      { status: 'solicitado', resolvedAt: null },
      { status: 'em_atendimento' },
      NOW
    )
    expect(r.columnChangedAt).toEqual(NOW)
    expect(r).not.toHaveProperty('resolvedAt')
  })

  it('não retorna nada quando status não muda', () => {
    const r = computeTicketTimestamps({ status: 'solicitado', resolvedAt: null }, {}, NOW)
    expect(r).toEqual({})
  })

  it('não retorna nada quando patch.status é igual ao status atual', () => {
    const r = computeTicketTimestamps(
      { status: 'em_atendimento', resolvedAt: null },
      { status: 'em_atendimento' },
      NOW
    )
    expect(r).toEqual({})
  })

  // Edge: reabrir de concluido para em_atendimento (não só para solicitado)
  it('limpa resolvedAt ao reabrir para em_atendimento', () => {
    const r = computeTicketTimestamps(
      { status: 'concluido', resolvedAt: NOW },
      { status: 'em_atendimento' },
      NOW
    )
    expect(r.resolvedAt).toBeNull()
    expect(r.columnChangedAt).toEqual(NOW)
  })
})

// ─── computeServiceDeskMetrics ───────────────────────────────────────────────

describe('computeServiceDeskMetrics', () => {
  it('calcula volume, backlog, interações, tempo e % escalado', () => {
    const tickets = [
      {
        id: 't1',
        status: 'concluido',
        source: 'interno',
        createdAt: new Date('2026-06-20T10:00:00Z'),
        resolvedAt: new Date('2026-06-20T12:00:00Z'),
        escalatedAt: new Date('2026-06-20T11:00:00Z'),
        escalatedTo: 'SecuriSoft',
        replyCount: 3,
      },
      {
        id: 't2',
        status: 'solicitado',
        source: 'portal',
        createdAt: new Date('2026-06-24T10:00:00Z'),
        resolvedAt: null,
        escalatedAt: null,
        escalatedTo: null,
        replyCount: 1,
      },
    ]
    const m = computeServiceDeskMetrics(tickets, NOW)
    expect(m.total).toBe(2)
    expect(m.portalCount).toBe(1) // t2 (source === 'portal')
    expect(m.internoCount).toBe(1) // t1
    expect(m.backlog).toBe(1) // só t2 (status !== 'concluido')
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
    expect(m.portalCount).toBe(0)
    expect(m.internoCount).toBe(0)
    expect(m.escalatedPct).toBe(0)
    expect(m.avgRepliesPerTicket).toBe(0)
    expect(m.avgResolutionMinutes).toBe(0)
    expect(m.avgOpenAgeMinutes).toBe(0)
    expect(m.escalatedByPartner).toEqual([])
  })

  it('backlog = apenas status !== concluido', () => {
    const tickets = [
      {
        id: 't1', status: 'solicitado', source: 'interno',
        createdAt: new Date('2026-06-24T10:00:00Z'), resolvedAt: null,
        escalatedAt: null, escalatedTo: null, replyCount: 0,
      },
      {
        id: 't2', status: 'em_atendimento', source: 'interno',
        createdAt: new Date('2026-06-24T10:00:00Z'), resolvedAt: null,
        escalatedAt: null, escalatedTo: null, replyCount: 0,
      },
      {
        id: 't3', status: 'concluido', source: 'interno',
        createdAt: new Date('2026-06-24T08:00:00Z'), resolvedAt: new Date('2026-06-24T10:00:00Z'),
        escalatedAt: null, escalatedTo: null, replyCount: 2,
      },
    ]
    const m = computeServiceDeskMetrics(tickets, NOW)
    expect(m.backlog).toBe(2) // t1 + t2
    expect(m.total).toBe(3)
  })

  it('breakdown por origem (§8.1): conta portal vs interno separadamente', () => {
    const base = {
      status: 'solicitado',
      createdAt: new Date('2026-06-24T10:00:00Z'),
      resolvedAt: null,
      escalatedAt: null,
      escalatedTo: null,
      replyCount: 0,
    }
    const tickets = [
      { ...base, id: 'a', source: 'portal' },
      { ...base, id: 'b', source: 'portal' },
      { ...base, id: 'c', source: 'interno' },
    ]
    const m = computeServiceDeskMetrics(tickets, NOW)
    expect(m.total).toBe(3)
    expect(m.portalCount).toBe(2)
    expect(m.internoCount).toBe(1)
  })
})
