import { describe, it, expect } from 'vitest'
import { cortarNoLimite, normalizarPesquisa } from '../pesquisa/schema'

const CASO_OK = {
  oQueAconteceu: 'Uma rede de clínicas ficou 3 dias sem sistema.',
  entidadesRemovidas: [],
  necessidade: 'Cortar o movimento lateral.',
  funcionalidade: 'EDR',
  veiculo: 'Folha de S.Paulo',
  ano: 2025,
  fonteIdx: [0],
}

const base = (casos: unknown[]) => ({
  panoramaSetor: 'panorama',
  casos,
  planoSugerido: 'PREMIUM',
  planoPorque: 'porque sim',
})

describe('cortarNoLimite', () => {
  it('não mexe no que já cabe', () => {
    expect(cortarNoLimite('curto', 400)).toBe('curto')
  })

  it('prefere cortar no fim de uma frase', () => {
    const t = 'Primeira frase completa. Segunda frase que estoura o limite todo.'
    expect(cortarNoLimite(t, 40)).toBe('Primeira frase completa.')
  })

  it('cai para o fim da palavra, com reticência, quando não há frase', () => {
    const t = 'palavra '.repeat(30)
    const r = cortarNoLimite(t, 40)
    expect(r.length).toBeLessThanOrEqual(41)
    expect(r.endsWith('…')).toBe(true)
  })
})

describe('normalizarPesquisa — um caso ruim não derruba os bons', () => {
  // ⚠️ O bug de 02/09, com o vendedor na tela: o modelo escreveu um caso longo e
  // o parse estrito jogou fora a pesquisa INTEIRA — quatro casos e uma chamada
  // paga — devolvendo "casos.1.oQueAconteceu: String must contain at most 400".
  it('corta o caso comprido em vez de descartar a pesquisa', () => {
    const longo = { ...CASO_OK, oQueAconteceu: 'A. '.repeat(300) }
    const r = normalizarPesquisa(base([CASO_OK, longo, CASO_OK]))

    expect(r.pesquisa.casos).toHaveLength(3)
    expect(r.pesquisa.casos[1].oQueAconteceu.length).toBeLessThanOrEqual(400)
    expect(r.truncados).toEqual([1])
    expect(r.descartados).toEqual([])
  })

  it('descarta SÓ o caso que nem cortado serve, e diz o motivo', () => {
    const quebrado = { ...CASO_OK, funcionalidade: 'ANTIVIRUS_MAGICO' }
    const r = normalizarPesquisa(base([CASO_OK, quebrado]))

    expect(r.pesquisa.casos).toHaveLength(1)
    expect(r.descartados).toHaveLength(1)
    expect(r.descartados[0].indice).toBe(1)
  })

  it('corta também o panorama e o porquê do plano', () => {
    const r = normalizarPesquisa({ ...base([]), panoramaSetor: 'x'.repeat(900) })
    expect(r.pesquisa.panoramaSetor.length).toBeLessThanOrEqual(600)
  })

  it('explode só quando o envelope inteiro está fora do contrato', () => {
    expect(() => normalizarPesquisa({ casos: [], planoSugerido: 'INEXISTENTE' })).toThrow(
      /fora do contrato/
    )
  })

  it('nenhum caso continua sendo resultado normal', () => {
    expect(normalizarPesquisa(base([])).pesquisa.casos).toEqual([])
  })
})
