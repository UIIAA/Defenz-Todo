import { describe, it, expect } from 'vitest'
import { calcularComplementos, consolidar } from '../calculo-complementos'
import { calcularInvestimento } from '../calculo'
import { COMPLEMENTOS } from '../complementos'

describe('calcularComplementos — os números das tabelas do Marcos, sem deriva', () => {
  it('Patch Management fecha com a tabela: 59,90 → 29,95 com os 50%', () => {
    const [patch] = calcularComplementos(['PATCH_MANAGEMENT'], 5)
    expect(patch.vigencias.map((v) => v.precoLicenca)).toEqual([59.9, 119.8, 179.7])
    expect(patch.vigencias.map((v) => v.precoLicencaFinal)).toEqual([29.95, 59.9, 89.85])
    expect(patch.descontoPercent).toBe(50)
  })

  it('Criptografia de Disco fecha com a tabela: 30 → 15', () => {
    const [disco] = calcularComplementos(['CRIPTOGRAFIA_DISCO'], 5)
    expect(disco.vigencias.map((v) => v.precoLicencaFinal)).toEqual([15, 30, 45])
  })

  // ⚠️ Decisão do Marcos, 02/09: o valor do PHASR e dos sensores JÁ É o final.
  // Aplicar 50% aqui cortaria o preço pela metade numa proposta real.
  it('PHASR e sensores NÃO levam desconto: 126 é 126', () => {
    for (const id of ['PHASR', 'XDR_NETWORK', 'XDR_CLOUD', 'XDR_IDENTITY', 'XDR_PRODUCTIVITY'] as const) {
      const [c] = calcularComplementos([id], 5)
      expect(c.temDesconto, id).toBe(false)
      expect(c.vigencias.map((v) => v.precoLicencaFinal), id).toEqual([126, 252, 378])
    }
  })

  it('multiplica pela quantidade de licenças', () => {
    const [patch] = calcularComplementos(['PATCH_MANAGEMENT'], 30)
    expect(patch.vigencias[0].valorTotalFinal).toBeCloseTo(29.95 * 30, 6)
  })

  // ⚠️ As tabelas enviadas mostram "QUANTIDADE DE LICENÇAS: 1" como exemplo, mas
  // a regra dita pelo Marcos é 5 a 999 — a mesma da tabela principal. Uma licença
  // avulsa não tem preço nesta tabela, e inventar um seria pior do que recusar.
  it('recusa quantidade fora de 5..999, em vez de inventar preço', () => {
    expect(() => calcularComplementos(['PHASR'], 1)).toThrow()
    expect(() => calcularComplementos(['PHASR'], 4)).toThrow()
    expect(() => calcularComplementos(['PHASR'], 1000)).toThrow()
  })

  it('todo complemento do catálogo tem descrição com fonte declarada', () => {
    for (const c of COMPLEMENTOS) {
      expect(c.descricao.length, c.id).toBeGreaterThan(80)
      expect(c.fonte, c.id).toMatch(/Bitdefender/)
    }
  })
})

describe('consolidar — a última página, e a cobertura que não bate', () => {
  const inv = calcularInvestimento({ quantidade: 30, planos: ['PREMIUM'], ajustePercent: 0 })

  it('soma principal + complementos coluna a coluna', () => {
    const comps = calcularComplementos(['PATCH_MANAGEMENT', 'CRIPTOGRAFIA_DISCO'], 30)
    const c = consolidar(inv, 0, comps)

    const esperado12 = (29.95 + 15) * 30
    expect(c.linhas[0].totalComplementos).toBeCloseTo(esperado12, 6)
    expect(c.linhas[0].total).toBeCloseTo(c.linhas[0].totalPrincipal + esperado12, 6)
    expect(c.itens).toEqual([
      'Premium',
      'Bitdefender GravityZone Patch Management',
      'Bitdefender GravityZone Criptografia de Disco',
    ])
  })

  // ⚠️ Esta é a razão de o campo existir. Na terceira coluna o GravityZone cobre
  // 48 meses (36+12) e o complemento cobre 36. Somar sem avisar é prometer
  // cobertura que não existe — a mesma família do rótulo que dividia por 48.
  it('acusa a divergência de cobertura na coluna 36+12', () => {
    const c = consolidar(inv, 0, calcularComplementos(['PHASR'], 30))
    expect(c.linhas[2].mesesPrincipal).toBe(48)
    expect(c.linhas[2].mesesComplementos).toBe(36)
    expect(c.coberturasDivergem).toBe(true)
  })

  it('sem complemento não há divergência para explicar', () => {
    expect(consolidar(inv, 0, []).coberturasDivergem).toBe(false)
  })
})
