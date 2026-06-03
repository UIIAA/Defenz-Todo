import { describe, it, expect } from 'vitest'
import { detectCycle } from '../dependency-graph'

describe('detectCycle', () => {
  it('detecta ciclo direto (A → B, propor B → A)', () => {
    const map = new Map<string, string[]>([
      ['A', ['B']],
      ['B', []],
    ])
    const cycle = detectCycle('B', ['A'], map)
    expect(cycle).not.toBeNull()
    expect(cycle).toContain('A')
    expect(cycle).toContain('B')
  })

  it('detecta ciclo transitivo (A → B → C, propor C → A)', () => {
    const map = new Map<string, string[]>([
      ['A', ['B']],
      ['B', ['C']],
      ['C', []],
    ])
    expect(detectCycle('C', ['A'], map)).not.toBeNull()
  })

  it('retorna null quando não há ciclo', () => {
    const map = new Map<string, string[]>([
      ['A', ['B']],
      ['B', []],
      ['C', []],
    ])
    expect(detectCycle('C', ['A'], map)).toBeNull()
    expect(detectCycle('A', ['C'], map)).toBeNull()
  })

  it('auto-dependência direta é ciclo', () => {
    const map = new Map<string, string[]>([['A', []]])
    expect(detectCycle('A', ['A'], map)).not.toBeNull()
  })
})
