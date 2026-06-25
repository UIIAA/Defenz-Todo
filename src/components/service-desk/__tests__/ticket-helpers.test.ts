import { describe, it, expect } from 'vitest'
import { formatMinutesHuman, TICKET_STATUS_META } from '../ticket-helpers'

describe('formatMinutesHuman', () => {
  it('formata faixas de minutos', () => {
    expect(formatMinutesHuman(0)).toBe('0min')
    expect(formatMinutesHuman(45)).toBe('45min')
    expect(formatMinutesHuman(135)).toBe('2h 15min')
    expect(formatMinutesHuman(120)).toBe('2h')
    expect(formatMinutesHuman(1440 * 3 + 60 * 4)).toBe('3d 4h')
  })
  it('nunca negativo', () => {
    expect(formatMinutesHuman(-10)).toBe('0min')
  })
})

describe('TICKET_STATUS_META', () => {
  it('tem os 3 estados', () => {
    expect(TICKET_STATUS_META.open.label).toBe('Aberto')
    expect(TICKET_STATUS_META.paused.label).toBe('Pausado')
    expect(TICKET_STATUS_META.resolved.label).toBe('Resolvido')
  })
})
