import { describe, it, expect } from 'vitest'
import {
  faixaPorQuantidade,
  calcularInvestimento,
  formatarBRL,
  rotuloAjuste,
} from '../calculo'
import { ApiError } from '@/lib/api-helpers'

describe('faixaPorQuantidade', () => {
  it('resolve a faixa pelos limites inclusivos', () => {
    expect(faixaPorQuantidade(5)).toBe('5-14')
    expect(faixaPorQuantidade(14)).toBe('5-14')
    expect(faixaPorQuantidade(15)).toBe('15-24')
    expect(faixaPorQuantidade(30)).toBe('25-49')
    expect(faixaPorQuantidade(999)).toBe('500-999')
  })

  it('recusa quantidade abaixo de 5 com mensagem explícita', () => {
    expect(() => faixaPorQuantidade(4)).toThrow(ApiError)
    expect(() => faixaPorQuantidade(4)).toThrow(/5 e 999/)
  })

  it('recusa quantidade acima de 999 — a tabela pública não cobre, extrapolar seria inventar preço', () => {
    expect(() => faixaPorQuantidade(1000)).toThrow(ApiError)
  })

  it('recusa quantidade não inteira ou não finita', () => {
    expect(() => faixaPorQuantidade(10.5)).toThrow(ApiError)
    expect(() => faixaPorQuantidade(NaN)).toThrow(ApiError)
  })
})

describe('calcularInvestimento — REGRESSÃO DO ÷36 (spec §2.1)', () => {
  // O erro do ÷48 está em toda proposta que a Defenz já enviou: o unitário/mês
  // da coluna de 36 meses vinha de precoLicenca/48. Estes casos são exatamente
  // os quatro medidos nos documentos reais.
  const casos = [
    { plano: 'BUSINESS_SECURITY', qtd: 30, precoLicenca: 171.97, errado: 3.58, certo: 4.78 },
    { plano: 'PREMIUM', qtd: 30, precoLicenca: 202.32, errado: 4.22, certo: 5.62 },
    { plano: 'ENTERPRISE', qtd: 30, precoLicenca: 356.31, errado: 7.42, certo: 9.9 },
    { plano: 'BUSINESS_SECURITY', qtd: 20, precoLicenca: 182.48, errado: 3.8, certo: 5.07 },
  ] as const

  it.each(casos)(
    '$plano @ $qtd licenças: 36 meses divide por 36 ($certo), não por 48 ($errado)',
    ({ plano, qtd, precoLicenca, errado, certo }) => {
      const r = calcularInvestimento({ quantidade: qtd, planos: [plano], ajustePercent: 0 })
      const tresAnos = r.planos[0].vigencias.find((v) => v.anos === 3)!

      expect(tresAnos.precoLicenca).toBe(precoLicenca)
      expect(round2(tresAnos.valorUnitarioMes)).toBe(certo)
      expect(round2(tresAnos.valorUnitarioMes)).not.toBe(errado)
    }
  )

  it('a coerência é estrutural: unitário/mês × 12 × anos === preço da licença, nas três vigências', () => {
    const r = calcularInvestimento({
      quantidade: 30,
      planos: ['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE'],
      ajustePercent: 0,
    })
    for (const p of r.planos) {
      for (const v of p.vigencias) {
        expect(v.valorUnitarioMes * 12 * v.anos).toBeCloseTo(v.precoLicenca, 8)
      }
    }
  })
})

describe('calcularInvestimento — totais e ajuste', () => {
  it('total é preço da licença × quantidade', () => {
    const r = calcularInvestimento({
      quantidade: 30,
      planos: ['BUSINESS_SECURITY'],
      ajustePercent: 0,
    })
    const tresAnos = r.planos[0].vigencias.find((v) => v.anos === 3)!
    expect(tresAnos.valorTotal).toBeCloseTo(171.97 * 30, 8)
    expect(tresAnos.valorTotalFinal).toBeCloseTo(171.97 * 30, 8)
  })

  it('desconto (ajuste negativo) reduz preço final e total final, sem mexer no de tabela', () => {
    const r = calcularInvestimento({
      quantidade: 30,
      planos: ['BUSINESS_SECURITY'],
      ajustePercent: -10,
    })
    const v = r.planos[0].vigencias.find((x) => x.anos === 3)!
    expect(v.precoLicenca).toBe(171.97)
    expect(v.precoLicencaFinal).toBeCloseTo(171.97 * 0.9, 8)
    expect(v.valorTotalFinal).toBeCloseTo(171.97 * 30 * 0.9, 8)
    expect(r.temAjuste).toBe(true)
  })

  it('acréscimo (ajuste positivo) aumenta o final', () => {
    const r = calcularInvestimento({
      quantidade: 30,
      planos: ['PREMIUM'],
      ajustePercent: 5,
    })
    const v = r.planos[0].vigencias.find((x) => x.anos === 1)!
    expect(v.valorTotalFinal).toBeCloseTo(80.93 * 30 * 1.05, 8)
  })

  it('unitário/mês final acompanha o ajuste — senão o documento se contradiz', () => {
    const r = calcularInvestimento({
      quantidade: 30,
      planos: ['BUSINESS_SECURITY'],
      ajustePercent: -10,
    })
    const v = r.planos[0].vigencias.find((x) => x.anos === 3)!
    expect(v.valorUnitarioMesFinal * 12 * 3).toBeCloseTo(v.precoLicencaFinal, 8)
  })

  it('arredonda só na formatação, nunca no meio da conta', () => {
    // 171,97 × 30 × 0,9 = 4643,19 exato. Se arredondasse o unitário antes,
    // daria 4643,10 (154,77 × 30) — nove centavos de deriva.
    const r = calcularInvestimento({
      quantidade: 30,
      planos: ['BUSINESS_SECURITY'],
      ajustePercent: -10,
    })
    const v = r.planos[0].vigencias.find((x) => x.anos === 3)!
    expect(formatarBRL(v.valorTotalFinal)).toBe('R$ 4.643,19')
  })

  it('preserva a ordem canônica dos planos, não a ordem em que chegaram', () => {
    const r = calcularInvestimento({
      quantidade: 30,
      planos: ['ENTERPRISE', 'BUSINESS_SECURITY'],
      ajustePercent: 0,
    })
    expect(r.planos.map((p) => p.plano)).toEqual(['BUSINESS_SECURITY', 'ENTERPRISE'])
  })

  it('recusa lista de planos vazia', () => {
    expect(() =>
      calcularInvestimento({ quantidade: 30, planos: [], ajustePercent: 0 })
    ).toThrow(ApiError)
  })

  it('carimba a procedência da tabela no resultado (vira precoSnapshot)', () => {
    const r = calcularInvestimento({
      quantidade: 30,
      planos: ['PREMIUM'],
      ajustePercent: 0,
    })
    expect(r.tabelaVigencia).toBe('2024-11-29')
    expect(r.faixa).toBe('25-49')
    expect(r.quantidade).toBe(30)
  })
})

describe('rotuloAjuste — o rótulo fixo do modelo atual mentiria em dois dos três casos', () => {
  it('não existe linha quando é tabela cheia', () => {
    expect(rotuloAjuste(0)).toBeNull()
  })

  it('negativo é "Desconto competitivo"', () => {
    expect(rotuloAjuste(-12.5)).toBe('Desconto competitivo')
  })

  it('positivo é "Acréscimo"', () => {
    expect(rotuloAjuste(7)).toBe('Acréscimo')
  })
})

describe('formatarBRL', () => {
  it('formata em pt-BR com dois dígitos', () => {
    expect(formatarBRL(4.7769444)).toBe('R$ 4,78')
    expect(formatarBRL(5159.1)).toBe('R$ 5.159,10')
    expect(formatarBRL(0)).toBe('R$ 0,00')
  })
})

function round2(n: number): number {
  return Math.round(n * 100) / 100
}
