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

describe('calcularInvestimento — a coluna 36+12 e o divisor de cada coluna', () => {
  // ⚠️ Este bloco JÁ FOI o "teste de regressão do ÷36". Mudou de sentido em
  // 12/08, quando o Marcos esclareceu que a terceira coluna é a oferta 36+12:
  // paga o preço de 3 anos, recebe 48 meses de cobertura. O ÷48 dos documentos
  // antigos estava certo na conta; o RÓTULO ("36 meses") é que mentia.
  //
  // O que se protege agora não é um número, é a propriedade: o unitário mensal
  // sempre fecha com preço ÷ meses de COBERTURA.
  const casos = [
    { plano: 'BUSINESS_SECURITY', qtd: 30, precoLicenca: 171.97, porMes: 3.58 },
    { plano: 'PREMIUM', qtd: 30, precoLicenca: 202.32, porMes: 4.22 },
    { plano: 'ENTERPRISE', qtd: 30, precoLicenca: 356.31, porMes: 7.42 },
    { plano: 'BUSINESS_SECURITY', qtd: 20, precoLicenca: 182.48, porMes: 3.8 },
  ] as const

  it.each(casos)(
    '$plano @ $qtd licenças: paga o preço de 3 anos e divide por 48 meses de cobertura',
    ({ plano, qtd, precoLicenca, porMes }) => {
      const r = calcularInvestimento({ quantidade: qtd, planos: [plano], ajustePercent: 0 })
      const bonus = r.planos[0].vigencias.find((v) => v.bonusMeses > 0)!

      expect(bonus.precoLicenca).toBe(precoLicenca) // preço = coluna de 3 anos
      expect(bonus.meses).toBe(48) // cobertura = 48 meses
      expect(bonus.rotulo).toBe('36+12 meses') // e o rótulo diz isso
      expect(round2(bonus.valorUnitarioMes)).toBe(porMes)
    }
  )

  it('a coerência é estrutural: unitário/mês × meses de COBERTURA === preço da licença', () => {
    // Vale nas três colunas. É o teste que pega qualquer divisor errado,
    // inclusive o antigo ÷36 na coluna que cobre 48 meses.
    const r = calcularInvestimento({
      quantidade: 30,
      planos: ['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE'],
      ajustePercent: 0,
    })
    for (const p of r.planos) {
      for (const v of p.vigencias) {
        expect(v.valorUnitarioMes * v.meses).toBeCloseTo(v.precoLicenca, 8)
      }
    }
  })

  it('as três colunas cobrem 12, 24 e 48 meses — e só a última tem bônus', () => {
    const r = calcularInvestimento({
      quantidade: 30,
      planos: ['BUSINESS_SECURITY'],
      ajustePercent: 0,
    })
    expect(r.planos[0].vigencias.map((v) => v.meses)).toEqual([12, 24, 48])
    expect(r.planos[0].vigencias.map((v) => v.bonusMeses)).toEqual([0, 0, 12])
    expect(r.planos[0].vigencias.map((v) => v.rotulo)).toEqual([
      '12 meses',
      '24 meses',
      '36+12 meses',
    ])
  })

  it('com 36+12, a coluna longa volta a ser a mais barata por mês — em TODAS as faixas', () => {
    // É o que restaura a lógica comercial do destaque em crimson: sem o bônus,
    // 24 meses ganhava em 24 de 24 combinações.
    for (const plano of ['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE'] as const) {
      for (const qtd of [5, 15, 30, 60, 120, 200, 300, 700]) {
        const v = calcularInvestimento({ quantidade: qtd, planos: [plano], ajustePercent: 0 })
          .planos[0].vigencias
        const porMes = v.map((x) => x.valorUnitarioMes)
        expect(Math.min(...porMes)).toBe(porMes[2])
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
    expect(v.valorUnitarioMesFinal * v.meses).toBeCloseTo(v.precoLicencaFinal, 8)
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
