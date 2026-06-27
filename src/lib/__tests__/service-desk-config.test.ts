import { describe, it, expect } from 'vitest'
import {
  ageColor,
  ageDays,
  STATUS_ORDER,
  STATUS_LABELS,
  WIP_LIMITS,
  AGING_HOURS,
} from '../service-desk-config'

const now = new Date('2026-06-27T12:00:00-03:00')

describe('STATUS_ORDER / STATUS_LABELS / WIP_LIMITS', () => {
  it('tem os 3 status canônicos na ordem correta', () => {
    expect(STATUS_ORDER).toEqual(['solicitado', 'em_atendimento', 'concluido'])
    expect(STATUS_LABELS.solicitado).toBe('Solicitado')
    expect(STATUS_LABELS.em_atendimento).toBe('Em atendimento')
    expect(STATUS_LABELS.concluido).toBe('Concluído')
  })

  it('WIP_LIMITS: somente em_atendimento tem limite', () => {
    expect(WIP_LIMITS.solicitado).toBeNull()
    expect(WIP_LIMITS.em_atendimento).toBe(5)
    expect(WIP_LIMITS.concluido).toBeNull()
  })

  it('AGING_HOURS: concluido nao envelhece', () => {
    expect(AGING_HOURS.concluido).toBeNull()
    expect(AGING_HOURS.solicitado).toBeTruthy()
    expect(AGING_HOURS.em_atendimento).toBeTruthy()
  })
})

describe('ageColor', () => {
  it('retorna green se dentro do warn (solicitado < 24h)', () => {
    const changed = new Date(now.getTime() - 10 * 60 * 60 * 1000) // 10h atrás
    expect(ageColor('solicitado', changed, now)).toBe('green')
  })

  it('retorna amber entre warn e crit (solicitado 30h)', () => {
    const changed = new Date(now.getTime() - 30 * 60 * 60 * 1000) // 30h atrás
    expect(ageColor('solicitado', changed, now)).toBe('amber')
  })

  it('retorna black apos crit (solicitado > 72h)', () => {
    const changed = new Date(now.getTime() - 80 * 60 * 60 * 1000) // 80h atrás
    expect(ageColor('solicitado', changed, now)).toBe('black')
  })

  it('em_atendimento: verde em <48h, ambar 50h, preto >96h', () => {
    const h = (n: number) => new Date(now.getTime() - n * 60 * 60 * 1000)
    expect(ageColor('em_atendimento', h(20), now)).toBe('green')
    expect(ageColor('em_atendimento', h(50), now)).toBe('amber')
    expect(ageColor('em_atendimento', h(100), now)).toBe('black')
  })

  it('concluido nunca envelhece — sempre green', () => {
    const changed = new Date(now.getTime() - 200 * 60 * 60 * 1000) // 200h atrás
    expect(ageColor('concluido', changed, now)).toBe('green')
  })

  it('columnChangedAt nulo → green', () => {
    expect(ageColor('solicitado', null, now)).toBe('green')
  })

  it('columnChangedAt undefined → green', () => {
    expect(ageColor('solicitado', undefined, now)).toBe('green')
  })

  it('status desconhecido → green', () => {
    const changed = new Date(now.getTime() - 200 * 60 * 60 * 1000)
    expect(ageColor('open', changed, now)).toBe('green')
  })

  it('aceita string ISO como columnChangedAt', () => {
    const changedStr = new Date(now.getTime() - 80 * 60 * 60 * 1000).toISOString()
    expect(ageColor('solicitado', changedStr, now)).toBe('black')
  })
})

describe('ageDays', () => {
  it('calcula dias completos', () => {
    const changed = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) // 3 dias
    expect(ageDays(changed, now)).toBe(3)
  })

  it('retorna 0 se nulo', () => {
    expect(ageDays(null, now)).toBe(0)
  })

  it('retorna 0 se menos de 1 dia', () => {
    const changed = new Date(now.getTime() - 10 * 60 * 60 * 1000) // 10h
    expect(ageDays(changed, now)).toBe(0)
  })
})
