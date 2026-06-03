import { describe, it, expect } from 'vitest'
import { parseHoursToMinutes, minutesToHoursLabel, minutesToHoursInput } from '../duration'

// Stress / edge cases — garantir que nenhuma entrada anômala quebra a conversão.

describe('parseHoursToMinutes — entradas extremas', () => {
  const cases: Array<[unknown, number]> = [
    ['0', 0],
    ['0,01', 1],          // 0.6 min → arredonda p/ 1
    ['0.004', 0],         // 0.24 min → arredonda p/ 0
    ['1,234', 74],        // 74.04 → 74
    ['8', 480],
    ['1000', 60000],
    ['1e2', 6000],        // parseFloat aceita notação científica
    ['  2,5  ', 150],     // espaços ao redor
    ['1.5h', 90],         // sufixo ignorado por parseFloat
    ['', 0],
    ['abc', 0],
    ['-3', 0],            // negativo → 0
    ['NaN', 0],
    ['Infinity', 0],      // não finito → 0
    [null, 0],
    [undefined, 0],
    [2.5, 150],           // number direto
    [-1, 0],
  ]

  it.each(cases)('parse(%o) = %i min', (input, expected) => {
    expect(parseHoursToMinutes(input as string)).toBe(expected)
  })

  it('nunca retorna NaN nem negativo', () => {
    for (const raw of ['', 'x', '-99', 'NaN', '1e999', '...']) {
      const r = parseHoursToMinutes(raw)
      expect(Number.isNaN(r)).toBe(false)
      expect(r).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('minutesToHoursLabel — entradas extremas', () => {
  const cases: Array<[number | null | undefined, string]> = [
    [0, '0h'],
    [null, '0h'],
    [undefined, '0h'],
    [-50, '0h'],          // negativo tratado como 0
    [1, '0,02h'],         // 0.0166 → 0.02
    [30, '0,5h'],
    [90, '1,5h'],
    [120, '2h'],
    [60000, '1000h'],
    [Number.NaN, '0h'],
  ]

  it.each(cases)('label(%o) = %s', (input, expected) => {
    expect(minutesToHoursLabel(input)).toBe(expected)
  })

  it('round-trip parse→label estável para valores comuns', () => {
    for (const h of ['0,5', '1', '1,5', '2', '8', '40']) {
      const min = parseHoursToMinutes(h)
      const label = minutesToHoursLabel(min)
      expect(label.endsWith('h')).toBe(true)
      expect(label).not.toContain('NaN')
    }
  })
})

describe('minutesToHoursInput — vazio para zero/null', () => {
  it('serializa para edição sem ruído', () => {
    expect(minutesToHoursInput(0)).toBe('')
    expect(minutesToHoursInput(null)).toBe('')
    expect(minutesToHoursInput(-10)).toBe('')
    expect(minutesToHoursInput(90)).toBe('1.5')
    expect(minutesToHoursInput(60000)).toBe('1000')
  })
})
