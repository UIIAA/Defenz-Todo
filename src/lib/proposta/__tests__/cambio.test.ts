import { describe, it, expect } from 'vitest'
import { CAMBIO, converterUSD, notaCambio } from '../cambio'

describe('câmbio — feature-catalogo-opcoes §4.1', () => {
  it('converte e arredonda UMA vez, na entrada (crítica C1)', () => {
    // 48 × 5,1521 = 247,3008 — o documento trabalha com 247,30.
    expect(converterUSD(48)).toBe(247.3)
  })

  it('unitário × quantidade fecha com o total: é o que a C1 protege', () => {
    const unitario = converterUSD(48)
    expect(unitario * 400).toBe(98920)
    // Sem o arredondamento na entrada daria 98.920,32 — 32 centavos de
    // contradição entre a linha e o total impressos.
    expect(48 * CAMBIO.usdBrl * 400).not.toBe(unitario * 400)
  })

  it('a cotação carrega data e fonte, para o preço ser auditável', () => {
    expect(CAMBIO.data).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(CAMBIO.fonte).toContain('Banco Central')
  })

  it('a nota de procedência diz o valor em dólar, a cotação e a data (I-N3)', () => {
    const nota = notaCambio(48)
    expect(nota).toContain('US$ 48,00')
    expect(nota).toContain('R$ 5,1521')
    expect(nota).toContain('17/09/2026')
  })
})
