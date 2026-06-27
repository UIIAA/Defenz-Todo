import { describe, it, expect } from 'vitest'
import { formatMinutesHuman, TICKET_CHANNEL_LABELS, TICKET_PRIORITY_LABELS } from '../ticket-helpers'

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

describe('TICKET_CHANNEL_LABELS', () => {
  it('tem os canais suportados', () => {
    expect(TICKET_CHANNEL_LABELS.email).toBe('E-mail')
    expect(TICKET_CHANNEL_LABELS.whatsapp).toBe('WhatsApp')
    expect(TICKET_CHANNEL_LABELS.telefone).toBe('Telefone')
    expect(TICKET_CHANNEL_LABELS.chat).toBe('Chat')
    expect(TICKET_CHANNEL_LABELS.outro).toBe('Outro')
  })
})

describe('TICKET_PRIORITY_LABELS', () => {
  it('tem as 3 prioridades', () => {
    expect(TICKET_PRIORITY_LABELS.alta).toBe('Alta')
    expect(TICKET_PRIORITY_LABELS.media).toBe('Média')
    expect(TICKET_PRIORITY_LABELS.baixa).toBe('Baixa')
  })
})
