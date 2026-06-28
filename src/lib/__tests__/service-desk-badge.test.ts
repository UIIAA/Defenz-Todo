import { describe, it, expect } from 'vitest'
import { contarNovos } from '../service-desk-badge'

const now = new Date('2026-06-27T12:00:00Z')
const before = '2026-06-27T10:00:00Z'
const after = '2026-06-27T14:00:00Z'

const tickets = [
  { createdAt: '2026-06-27T09:00:00Z' }, // antigo
  { createdAt: '2026-06-27T11:00:00Z' }, // novo (posterior ao lastSeen 10h)
  { createdAt: '2026-06-27T13:00:00Z' }, // novo (posterior ao lastSeen 10h)
]

describe('contarNovos', () => {
  it('happy path: conta tickets criados depois do lastSeen', () => {
    expect(contarNovos(tickets, before)).toBe(2)
  })

  it('edge — lastSeen nulo: retorna 0 (sem baseline)', () => {
    expect(contarNovos(tickets, null)).toBe(0)
  })

  it('edge — lastSeen undefined: retorna 0', () => {
    expect(contarNovos(tickets, undefined)).toBe(0)
  })

  it('edge — todos os tickets sao anteriores ao lastSeen: retorna 0', () => {
    expect(contarNovos(tickets, after)).toBe(0)
  })

  it('edge — lista vazia: retorna 0', () => {
    expect(contarNovos([], before)).toBe(0)
  })

  it('edge — lastSeen invalido (string corrompida): retorna 0', () => {
    expect(contarNovos(tickets, 'nao-e-uma-data')).toBe(0)
  })

  it('aceita createdAt como objeto Date', () => {
    const withDate = [
      { createdAt: new Date('2026-06-27T11:00:00Z') },
    ]
    expect(contarNovos(withDate, before)).toBe(1)
  })
})
