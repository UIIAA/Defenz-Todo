import { describe, it, expect } from 'vitest'
import { calcularAvisos, validarCitacoes } from '../ask'
import type { FonteRankeada } from '../retrieve'

function fonte(over: Partial<FonteRankeada> & { id: string }): FonteRankeada {
  return {
    kind: 'POP',
    title: 'POP qualquer',
    body: '',
    companyId: null,
    company: null,
    verifiedAt: new Date('2026-08-01'),
    reviewDueAt: new Date('2026-12-01'),
    score: 10,
    termosNoTitulo: 1,
    ...over,
  }
}

describe('calcularAvisos', () => {
  it('sem fontes não gera aviso (o ramo "não sei" tem texto próprio)', () => {
    expect(calcularAvisos([])).toEqual([])
  })

  it('fonte boa não gera aviso', () => {
    expect(calcularAvisos([fonte({ id: 'a' })])).toEqual([])
  })

  it('fonte_fraca quando NENHUMA fonte casou o título — mesmo com score alto', () => {
    // O caso medido no corpus real: "plano de saúde" tirou score 15 sem casar título.
    const avisos = calcularAvisos([fonte({ id: 'a', score: 15, termosNoTitulo: 0 })])
    expect(avisos).toContain('fonte_fraca')
  })

  it('fonte_fraca também quando o melhor score é baixo (§4 passo 5)', () => {
    expect(calcularAvisos([fonte({ id: 'a', score: 2 })])).toContain('fonte_fraca')
  })

  it('fonte_vencida quando um POP citado passou da revisão', () => {
    const vencido = fonte({
      id: 'v',
      verifiedAt: new Date('2026-01-01'),
      reviewDueAt: new Date('2026-02-01'),
    })
    expect(calcularAvisos([vencido])).toContain('fonte_vencida')
  })

  it('multi_empresa quando o set cruza empresas — a armadilha do admin', () => {
    const avisos = calcularAvisos([
      fonte({ id: 'a', companyId: 'empresa-1' }),
      fonte({ id: 'b', companyId: 'empresa-2' }),
    ])
    expect(avisos).toContain('multi_empresa')
  })

  it('global + uma empresa também é multi_empresa', () => {
    const avisos = calcularAvisos([
      fonte({ id: 'a', companyId: null }),
      fonte({ id: 'b', companyId: 'empresa-1' }),
    ])
    expect(avisos).toContain('multi_empresa')
  })

  it('só conteúdo global NÃO é multi_empresa', () => {
    const avisos = calcularAvisos([fonte({ id: 'a' }), fonte({ id: 'b' })])
    expect(avisos).not.toContain('multi_empresa')
  })
})

describe('validarCitacoes', () => {
  it('aceita citação de fonte que está no conjunto recuperado', () => {
    const fontes = [fonte({ id: 'x', title: 'Cadência de follow-up' })]
    const c = validarCitacoes(fontes, 'Segundo o [Cadência de follow-up], são 10 toques.')
    expect(c.map((i) => i.id)).toEqual(['x'])
  })

  it('sad path: fonte forjada pelo modelo é descartada', () => {
    const fontes = [fonte({ id: 'x', title: 'Cadência de follow-up' })]
    const c = validarCitacoes(fontes, 'Segundo o [POP de Férias Coletivas], são 30 dias.')
    expect(c).toEqual([])
  })

  it('citação carrega a empresa (contrato D8)', () => {
    const fontes = [
      fonte({ id: 'x', title: 'Setup', companyId: 'c1', company: { name: 'Cow Cycling' } }),
    ]
    expect(validarCitacoes(fontes, 'Ver [Setup].')[0].companyLabel).toBe('Cow Cycling')
  })

  it('conteúdo global é rotulado como Defenz (global)', () => {
    const fontes = [fonte({ id: 'x', title: 'Setup', companyId: null })]
    expect(validarCitacoes(fontes, 'Ver [Setup].')[0].companyLabel).toBe('Defenz (global)')
  })
})
