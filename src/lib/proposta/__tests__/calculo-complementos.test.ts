import { describe, it, expect } from 'vitest'
import { calcularComplementos, consolidar, servicosSobConsulta } from '../calculo-complementos'
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
  // ⚠️ 18/09: PHASR e os quatro sensores passaram a ser vendidos SÓ por 12 meses
  // (Marcos). Antes desta data o catálogo tinha as três colunas — proposta já
  // emitida reimprime pelo snapshot dela, com as colunas que tinha na emissão.
  it('PHASR e sensores: 126 é 126, uma coluna só, e nunca com desconto', () => {
    for (const id of ['PHASR', 'XDR_NETWORK', 'XDR_CLOUD', 'XDR_IDENTITY', 'XDR_PRODUCTIVITY'] as const) {
      const [c] = calcularComplementos([id], 5)
      expect(c.temDesconto, id).toBe(false)
      expect(c.vigencias.map((v) => v.precoLicencaFinal), id).toEqual([126])
      expect(c.vigencias.map((v) => v.meses), id).toEqual([12])
      // Renova a cada ano: entra no resumo como linha à parte, não na soma.
      expect(c.foraDoTotal, id).toBe(true)
    }
  })

  it('multiplica pela quantidade de licenças', () => {
    const [patch] = calcularComplementos(['PATCH_MANAGEMENT'], 30)
    expect(patch.vigencias[0].valorTotalFinal).toBeCloseTo(29.95 * 30, 6)
  })

  // ⚠️ As tabelas enviadas mostram "QUANTIDADE DE LICENÇAS: 1" como exemplo, mas
  // a regra dita pelo Marcos é 5 a 999 — a mesma da tabela principal. Uma licença
  // avulsa não tem preço nesta tabela, e inventar um seria pior do que recusar.
  it('recusa quantidade abaixo de 5, em vez de inventar preço', () => {
    expect(() => calcularComplementos(['PHASR'], 1)).toThrow()
    expect(() => calcularComplementos(['PHASR'], 4)).toThrow()
    expect(() => calcularComplementos(['PHASR'], 100_001)).toThrow()
  })

  // 21/09/2026: complemento tem preço único, não escalona por faixa — então
  // volume acima de 999 só multiplica. Antes isto jogava e travava a proposta.
  it('aceita volume acima de 999 e só multiplica', () => {
    const [patch] = calcularComplementos(['PATCH_MANAGEMENT'], 1400)
    expect(patch.vigencias[0].valorTotalFinal).toBeCloseTo(29.95 * 1400, 6)
  })

  // I-C4: a descrição vem de material oficial, com a fonte impressa ao lado.
  // O fabricante deixou de ser sempre a Bitdefender em 17/09 (DLP da GTB, MDR da
  // própria Defenz) — o que a regra exige é procedência declarada, não a marca.
  it('todo item do catálogo tem descrição com fonte declarada', () => {
    const fabricanteEsperado: Record<string, RegExp> = {
      GRAVITYZONE: /Bitdefender/,
      XDR: /Bitdefender/,
      DLP: /GTB/,
      SERVICO: /Defenz/,
    }
    for (const c of COMPLEMENTOS) {
      expect(c.descricao.length, c.id).toBeGreaterThan(80)
      expect(c.fonte, c.id).toMatch(fabricanteEsperado[c.familia])
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
    // Patch: 36 meses contra os 48 do GravityZone na terceira coluna.
    const c = consolidar(inv, 0, calcularComplementos(['PATCH_MANAGEMENT'], 30))
    expect(c.linhas[2].mesesPrincipal).toBe(48)
    expect(c.linhas[2].mesesComplementos).toBe(36)
    expect(c.coberturasDivergem).toBe(true)
  })

  it('sensor de 12 meses sai do total e vira linha à parte (18/09)', () => {
    const c = consolidar(inv, 0, calcularComplementos(['XDR_PRODUCTIVITY'], 30))
    expect(c.linhas.every((l) => l.totalComplementos === 0)).toBe(true)
    expect(c.foraDoTotal).toEqual([
      { nome: 'Bitdefender XDR Sensor · Productivity', meses: 12, valorTotalFinal: 126 * 30 },
    ])
  })

  it('sem complemento não há divergência para explicar', () => {
    expect(consolidar(inv, 0, []).coberturasDivergem).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// feature-catalogo-opcoes — DLP, MDR e desconto por item
// ─────────────────────────────────────────────────────────────────────────────

describe('DLP, MDR e desconto por item', () => {
  const inv = calcularInvestimento({ quantidade: 400, planos: ['PREMIUM'], ajustePercent: 0 })

  it('DLP: US$ 48 viram R$ 247,30 e o total fecha com o unitário (C1)', () => {
    const [dlp] = calcularComplementos(['DLP_GTB'], 400)
    expect(dlp.moeda).toBe('USD')
    expect(dlp.precoOrigemUSD).toBe(48)
    expect(dlp.vigencias).toHaveLength(1)
    expect(dlp.vigencias[0].precoLicencaFinal).toBe(247.3)
    expect(dlp.vigencias[0].valorTotalFinal).toBe(247.3 * 400)
  })

  // ⚠️ Decisão D5 (17/09), vinda da crítica: o DLP renova a cada 12 meses. Somá-lo
  // UMA vez dentro da coluna de 48 meses subestimaria o custo em duas renovações
  // e chamaria o resultado de "Investimento total" — a mesma família do rótulo
  // "36 meses" que dividia por 48. Ele sai com preço, fora do total.
  it('DLP fica FORA do total somado, com o valor e o prazo declarados (D5)', () => {
    const c = consolidar(inv, 0, calcularComplementos(['DLP_GTB'], 400))
    for (const l of c.linhas) {
      expect(l.totalComplementos).toBe(0)
      expect(l.total).toBe(l.totalPrincipal)
    }
    expect(c.foraDoTotal).toEqual([
      { nome: 'GTB Endpoint Protector (DLP)', meses: 12, valorTotalFinal: 247.3 * 400 },
    ])
  })

  it('o que fica no total continua somando normal, com o DLP marcado junto', () => {
    const comps = calcularComplementos(['PATCH_MANAGEMENT', 'DLP_GTB'], 400)
    const c = consolidar(inv, 0, comps)
    // Só o Patch entra: 29,95 × 400 na coluna de 12 meses.
    expect(c.linhas[0].totalComplementos).toBeCloseTo(29.95 * 400, 6)
    expect(c.linhas[2].coberturas).toEqual([36])
    expect(c.foraDoTotal).toHaveLength(1)
  })

  it('MDR não entra em cálculo nenhum, e vira bloco de escopo (I-N2)', () => {
    expect(calcularComplementos(['MDR_GERENCIADO'], 400)).toEqual([])
    const [mdr] = servicosSobConsulta(['MDR_GERENCIADO'])
    expect(mdr.nome).toContain('MDR')
    expect(mdr.naoIncluso.length).toBeGreaterThan(0)
    // Marcado junto com o Patch, só o Patch é precificado.
    const comps = calcularComplementos(['MDR_GERENCIADO', 'PATCH_MANAGEMENT'], 400)
    expect(comps.map((c) => c.id)).toEqual(['PATCH_MANAGEMENT'])
  })

  it('o texto do MDR não promete o que não funciona hoje (I-N6)', () => {
    const [mdr] = servicosSobConsulta(['MDR_GERENCIADO'])
    const texto = mdr.descricao.toLowerCase()
    expect(texto).not.toContain('tempo real')
    expect(texto).not.toContain('isolamento automático')
    expect(texto).not.toContain('24x7')
    expect(texto).not.toContain('24 horas')
    expect(texto).toContain('das 9h às 18h')
  })

  it('desconto por item sobrepõe o catálogo, item a item (D4)', () => {
    const [patch, phasr] = calcularComplementos(
      ['PATCH_MANAGEMENT', 'PHASR'],
      30,
      { PATCH_MANAGEMENT: 0, PHASR: 10 }
    )
    // Patch zerado: volta ao valor de tabela, sem os 50% do catálogo.
    expect(patch.descontoPercent).toBe(0)
    expect(patch.temDesconto).toBe(false)
    expect(patch.vigencias[0].precoLicencaFinal).toBe(59.9)
    // PHASR, que é líquido, recebe o desconto que o vendedor digitou.
    expect(phasr.descontoPercent).toBe(10)
    expect(phasr.descontoManual).toBe(true)
    expect(phasr.vigencias[0].precoLicencaFinal).toBeCloseTo(113.4, 2)
  })

  it('item sem desconto na tela continua com o do catálogo', () => {
    const [patch] = calcularComplementos(['PATCH_MANAGEMENT'], 30, { PHASR: 10 })
    expect(patch.descontoPercent).toBe(50)
    expect(patch.descontoManual).toBe(false)
  })

  it('desconto fora de 0..90 é recusado, em vez de virar preço estranho', () => {
    expect(() => calcularComplementos(['PATCH_MANAGEMENT'], 30, { PATCH_MANAGEMENT: 95 })).toThrow()
    expect(() => calcularComplementos(['PATCH_MANAGEMENT'], 30, { PATCH_MANAGEMENT: -5 })).toThrow()
  })
})
