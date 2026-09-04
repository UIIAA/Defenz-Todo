import { describe, it, expect } from 'vitest'
import {
  entidadesQueVazaram,
  nomesPropriosSuspeitos,
  numerosProibidos,
  variantesNumericas,
  digitosNaoConferidos,
  fonteIdxForaDaFaixa,
  avaliarCaso,
  type CasoBruto,
} from '../pesquisa/guardas'

function caso(over: Partial<CasoBruto> = {}): CasoBruto {
  return {
    oQueAconteceu: 'Uma rede de clínicas do interior paulista ficou 3 dias sem sistema.',
    entidadesRemovidas: ['Clínica São Rafael'],
    necessidade: 'Detectar o movimento lateral antes da criptografia.',
    funcionalidade: 'EDR',
    veiculo: 'Folha de S.Paulo',
    ano: 2025,
    fonteIdx: [0],
    ...over,
  }
}

// ── §6.4 camada 1: autodeclaração cruzada ────────────────────────────────────
describe('entidadesQueVazaram — o modelo listou o nome e esqueceu de tirá-lo', () => {
  it('não acusa quando o texto está de fato anônimo', () => {
    expect(entidadesQueVazaram(caso())).toEqual([])
  })

  it('acusa a entidade que continua no texto', () => {
    const c = caso({
      oQueAconteceu: 'A Clínica São Rafael ficou 3 dias sem sistema.',
      entidadesRemovidas: ['Clínica São Rafael'],
    })
    expect(entidadesQueVazaram(c)).toEqual(['Clínica São Rafael'])
  })

  it('não se deixa enganar por caixa e acento', () => {
    const c = caso({
      oQueAconteceu: 'A CLINICA SAO RAFAEL parou.',
      entidadesRemovidas: ['Clínica São Rafael'],
    })
    expect(entidadesQueVazaram(c)).toEqual(['Clínica São Rafael'])
  })
})

// ── §6.4 camada 2: detector de nome próprio ──────────────────────────────────
describe('nomesPropriosSuspeitos — barra, não descarta', () => {
  it('deixa passar o vocabulário permitido', () => {
    expect(
      nomesPropriosSuspeitos(
        'No Brasil, em março de 2025, a LGPD e a ISO 27001 pesaram. A Bitdefender detectou.'
      )
    ).toEqual([])
  })

  it('não implica com a palavra que abre a frase', () => {
    expect(nomesPropriosSuspeitos('Hospitais foram atingidos. Sistemas caíram.')).toEqual([])
  })

  it('levanta bandeira no nome de empresa que sobrou no meio da frase', () => {
    expect(nomesPropriosSuspeitos('A rede Ambar Diagnósticos ficou fora do ar.')).toEqual([
      'Ambar',
      'Diagnósticos',
    ])
  })
})

// ── §6.5 A13: a guarda estreita e nomeada ────────────────────────────────────
describe('numerosProibidos — estreita de propósito (crítica M1)', () => {
  it('deixa passar o vocabulário dos setores regulados', () => {
    for (const t of ['LGPD', 'ISO 27001', 'Lei 13.709', 'PCI-DSS 4.0', 'suporte 24/7', 'em 2025']) {
      expect(numerosProibidos(t), t).toEqual([])
    }
  })

  it('bloqueia o AGREGADO: percentual, proporção e multiplicador', () => {
    expect(numerosProibidos('37% do setor')).toHaveLength(1)
    expect(numerosProibidos('1 em cada 4 empresas')).toHaveLength(1)
    expect(numerosProibidos('3 vezes mais ataques')).toHaveLength(1)
    expect(numerosProibidos('5x mais caro')).toHaveLength(1)
  })

  // ⚠️ Moeda NÃO está aqui de propósito (02/09). A13b afrouxou dentro do caso —
  // "prejuízo estimado em R$ 40 milhões" é o exemplo da própria spec. Quem julga
  // valor em dinheiro é `digitosNaoConferidos`: passa se estiver na matéria.
  it('deixa a moeda passar por aqui — quem julga é a conferência do dígito', () => {
    expect(numerosProibidos('prejuízo de R$ 40 milhões')).toEqual([])
    expect(numerosProibidos('resgate de US$ 50 milhões')).toEqual([])
  })

  it('o símbolo de moeda não vira nome próprio', () => {
    expect(nomesPropriosSuspeitos('O grupo exigiu resgate de US$ 50 milhões.')).toEqual([])
  })

  it('mas a moeda inventada continua barrada, pela outra guarda', () => {
    const c = caso({ oQueAconteceu: 'O prejuízo foi de R$ 90 milhões.' })
    expect(digitosNaoConferidos(c, 'O prejuízo foi de R$ 40 milhões.')).toContain('90')
  })
})

// ── §6.5.1 A13b: o número volta, mas tem de estar na matéria ─────────────────
describe('variantesNumericas — formatos diferentes, mesmo número', () => {
  it('colapsa R$ 40 milhões, 40 milhões de reais e R$40.000.000', () => {
    const a = variantesNumericas('R$ 40 milhões')
    const b = variantesNumericas('40 milhões de reais')
    const c = variantesNumericas('R$40.000.000')
    expect([...a].some((v) => c.has(v))).toBe(true)
    expect([...a].some((v) => b.has(v))).toBe(true)
  })

  it('entende decimal com vírgula', () => {
    expect(variantesNumericas('2,5 milhões').has('2500000')).toBe(true)
  })
})

describe('digitosNaoConferidos — o número tem de existir no texto da chamada A', () => {
  const textoA =
    'O ataque parou a operação por 3 dias e o prejuízo foi estimado em R$ 40.000.000 em 2025.'

  it('aprova o caso cujos números vieram da matéria', () => {
    const c = caso({ oQueAconteceu: 'A rede parou 3 dias, com prejuízo de R$ 40 milhões.' })
    expect(digitosNaoConferidos(c, textoA)).toEqual([])
  })

  it('barra o número que o modelo inventou na reescrita', () => {
    const c = caso({ oQueAconteceu: 'A rede parou 3 dias e 12 mil pacientes foram afetados.' })
    expect(digitosNaoConferidos(c, textoA)).toContain('12')
  })
})

describe('fonteIdxForaDaFaixa — caso sem fonte não entra (crítica M2)', () => {
  it('aceita índice dentro da lista', () => {
    expect(fonteIdxForaDaFaixa(caso({ fonteIdx: [0, 1] }), 2)).toEqual([])
  })

  it('recusa índice que aponta para o vazio', () => {
    expect(fonteIdxForaDaFaixa(caso({ fonteIdx: [0, 7] }), 2)).toEqual([7])
  })
})

// ── §6.6: bandeira barra, não apaga ──────────────────────────────────────────
describe('avaliarCaso — o veredito que a tela de revisão consome', () => {
  const textoA = 'Uma rede de clínicas ficou 3 dias sem sistema em 2025.'

  it('caso limpo entra liberado', () => {
    const v = avaliarCaso(caso(), textoA, 1)
    expect(v.bloqueado).toBe(false)
    expect(v.bandeiras).toEqual([])
  })

  it('caso sujo vem BARRADO, com o motivo legível — e nunca descartado em silêncio', () => {
    const v = avaliarCaso(
      caso({
        oQueAconteceu: 'A Clínica São Rafael perdeu 37% da receita.',
        fonteIdx: [9],
      }),
      textoA,
      1
    )
    expect(v.bloqueado).toBe(true)
    expect(v.bandeiras.map((b) => b.tipo).sort()).toEqual([
      'entidade_vazou',
      'fonte_invalida',
      'nome_proprio',
      'numero_nao_conferido',
      'numero_proibido',
    ])
    // O caso continua existindo: quem decide é o vendedor, na tela.
    expect(v.caso.oQueAconteceu).toContain('Clínica São Rafael')
  })
})
