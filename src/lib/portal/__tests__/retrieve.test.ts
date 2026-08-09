import { describe, it, expect } from 'vitest'
import { extrairTermos, ranquear, normalizar, type CandidatoPlaybook } from '../retrieve'

/**
 * Critério de aceite NÃO-NEGOCIÁVEL da spec (§4): o teste usa PERGUNTA EM PORTUGUÊS
 * NATURAL, não palavra-chave. A v1 do desenho passaria neste arquivo com a feature
 * quebrada — a Ana cairia sempre no ramo "não achei nos nossos POPs", que é justamente
 * o comportamento que a spec celebra. Por isso as perguntas abaixo são frases inteiras.
 */

function pop(over: Partial<CandidatoPlaybook> & { id: string }): CandidatoPlaybook {
  return {
    kind: 'POP',
    title: '',
    body: '',
    companyId: null,
    verifiedAt: null,
    reviewDueAt: null,
    ...over,
  }
}

const BASE: CandidatoPlaybook[] = [
  pop({
    id: 'setup',
    title: 'Setup do cliente (implantação)',
    body:
      'Após o fechamento, a operação faz o setup do cliente novo. O onboarding começa com ' +
      'a coleta do CNPJ e do contato técnico. O setup do console é feito pelo Leonardo.',
  }),
  pop({
    id: 'cadencia',
    title: 'Cadência de follow-up e régua de toques',
    body: 'A régua tem 10 toques. Cada tentativa de contato é registrada no Zoho.',
  }),
  pop({
    id: 'zoho',
    title: 'Preenchimento do Zoho CRM',
    body: 'Todo lead precisa de CNPJ e telefone preenchidos no Zoho antes de avançar.',
  }),
  pop({
    id: 'ficha',
    kind: 'BIBLIOTECA',
    title: 'Battlecard · Bitdefender vs Sophos',
    body: 'Comparativo de recursos entre Bitdefender e Sophos para o time comercial.',
  }),
]

describe('normalizar', () => {
  it('tira acento e caixa dos dois lados da comparação', () => {
    expect(normalizar('Cadência de Follow-up')).toBe('cadencia de follow-up')
    expect(normalizar('IMPLANTAÇÃO')).toBe('implantacao')
  })
})

describe('extrairTermos', () => {
  it('extrai termos úteis de uma pergunta em português natural', () => {
    const termos = extrairTermos('Como faço o onboarding de um cliente novo?')
    // stopwords ("como", "de", "um") e tokens < 3 chars saem; o resto fica
    expect(termos).toEqual(['faco', 'onboarding', 'cliente', 'novo'])
  })

  it('normaliza acento — pergunta sem acento casa com corpo com acento', () => {
    expect(extrairTermos('qual a cadencia de follow-up?')).toContain('cadencia')
    expect(extrairTermos('qual a cadência de follow-up?')).toContain('cadencia')
  })

  it('deduplica e limita a 8 termos', () => {
    const termos = extrairTermos(
      'proposta proposta cliente contrato assinatura desconto prazo escopo entrega faturamento'
    )
    expect(termos.length).toBe(8)
    expect(new Set(termos).size).toBe(8)
  })

  it('pergunta só de stopwords não gera termo', () => {
    expect(extrairTermos('e o que é isso?')).toEqual([])
  })
})

describe('ranquear', () => {
  it('happy path: pergunta natural acha o POP certo em primeiro', () => {
    const termos = extrairTermos('Como faço o onboarding de um cliente novo?')
    const r = ranquear(BASE, termos)

    expect(r.length).toBeGreaterThan(0)
    expect(r[0].id).toBe('setup')
  })

  it('acha pelo CORPO, não só pelo título', () => {
    // "Leonardo" não está em nenhum título — só no corpo do POP de setup.
    const r = ranquear(BASE, extrairTermos('quem faz o console do Leonardo?'))
    expect(r.map((x) => x.id)).toContain('setup')
  })

  it('sad path: pergunta cuja resposta não está na base retorna ZERO', () => {
    const termos = extrairTermos('Qual é a política de férias coletivas da empresa?')
    expect(ranquear(BASE, termos)).toEqual([])
  })

  it('pergunta sem termos úteis retorna zero (nunca a base inteira)', () => {
    expect(ranquear(BASE, extrairTermos('e aí?'))).toEqual([])
  })

  it('título pesa mais que corpo (+3 vs +1)', () => {
    const termos = extrairTermos('preciso entender a cadência')
    const r = ranquear(BASE, termos)
    expect(r[0].id).toBe('cadencia')
    expect(r[0].score).toBeGreaterThanOrEqual(3)
  })

  it('POP ganha +1 sobre ficha de Biblioteca com a mesma evidência', () => {
    const candidatos: CandidatoPlaybook[] = [
      pop({ id: 'p', kind: 'POP', title: 'Bitdefender', body: '' }),
      pop({ id: 'b', kind: 'BIBLIOTECA', title: 'Bitdefender', body: '' }),
    ]
    const r = ranquear(candidatos, extrairTermos('o que temos sobre Bitdefender?'))
    expect(r[0].id).toBe('p')
    expect(r[0].score).toBe(r[1].score + 1)
  })

  it('empate desempata pelo verificado mais recente', () => {
    const candidatos: CandidatoPlaybook[] = [
      pop({ id: 'velho', title: 'Proposta', verifiedAt: new Date('2026-01-01') }),
      pop({ id: 'novo', title: 'Proposta', verifiedAt: new Date('2026-08-01') }),
    ]
    const r = ranquear(candidatos, extrairTermos('como monto uma proposta?'))
    expect(r[0].id).toBe('novo')
  })

  it('corta no topK', () => {
    const muitos = Array.from({ length: 20 }, (_, i) =>
      pop({ id: `p${i}`, title: `Proposta ${i}` })
    )
    expect(ranquear(muitos, extrairTermos('como monto uma proposta?'), 6)).toHaveLength(6)
  })

  it('ocorrência no corpo tem cap de 5 por termo (evita POP gigante dominar)', () => {
    const spam = pop({ id: 'spam', kind: 'BIBLIOTECA', title: '', body: 'zoho '.repeat(50) })
    const r = ranquear([spam], extrairTermos('onde preencho o zoho?'))
    expect(r[0].score).toBe(5)
  })
})
