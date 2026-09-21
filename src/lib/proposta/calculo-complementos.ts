// ─────────────────────────────────────────────────────────────────────────────
// CÁLCULO DOS COMPLEMENTOS — mesma regra da casa: LLM interpreta, JS calcula.
//
// ⚠️ O consolidado da última página soma produto principal + complementos, e é
// aí que mora a armadilha: na coluna 3 o GravityZone cobre 48 meses e o
// complemento cobre 36. Somar dois valores com coberturas diferentes numa linha
// só, sem dizer isso, é a mesma família do rótulo "36 meses" que dividia por 48.
// Por isso `Consolidado` carrega `coberturasDivergem` e o template é OBRIGADO a
// falar quando é true.
// ─────────────────────────────────────────────────────────────────────────────

import { ApiError } from '@/lib/api-helpers'
import {
  COMPLEMENTO_MESES,
  complemento,
  mesesDoComplemento,
  type Complemento,
  type ComplementoId,
} from './complementos'
import { CAMBIO } from './cambio'
import { QUANTIDADE_MAX_PROPOSTA, QUANTIDADE_MIN } from './tabela-precos'
import type { Investimento } from './calculo'

/** Desconto por item, em percentual (0 a 90). Ausente = o padrão do catálogo. */
export type DescontosPorItem = Partial<Record<ComplementoId, number>>

export interface LinhaComplemento {
  meses: number
  rotulo: string
  /** Preço de tabela por licença, pelo período inteiro. */
  precoLicenca: number
  /** Depois do desconto competitivo do produto. */
  precoLicencaFinal: number
  /** `precoLicencaFinal ÷ meses`. */
  valorUnitarioMesFinal: number
  valorTotal: number
  valorTotalFinal: number
}

export interface BlocoComplemento {
  id: ComplementoId
  nome: string
  descricao: string
  fonte: string
  familia: Complemento['familia']
  /** 0 quando o valor já é líquido (PHASR, sensores, DLP). */
  descontoPercent: number
  temDesconto: boolean
  /** `true` quando o desconto veio da tela, não do catálogo. Vai para o log. */
  descontoManual: boolean
  /** Moeda de origem. 'USD' obriga o documento a imprimir a cotação (I-N3). */
  moeda: 'BRL' | 'USD'
  /** Preço em dólar por licença, quando a origem é USD. */
  precoOrigemUSD?: number
  /**
   * A cotação usada NESTA emissão, congelada junto do preço.
   *
   * ⚠️ Achado 2 da crítica: se o documento lesse a constante de hoje, o
   * re-download de uma proposta antiga imprimiria o valor em reais congelado ao
   * lado de uma cotação nova — e o cliente prova que a conta não fecha.
   */
  cambio?: { usdBrl: number; fonte: string; data: string }
  /** Valor já líquido: o documento não imprime linha de desconto (D6). */
  precoLiquido: boolean
  /** Fora da linha "Investimento total" do resumo (D5). */
  foraDoTotal: boolean
  /**
   * Uma entrada por coluna DO ITEM — três nos módulos do GravityZone, uma só no
   * DLP (12 meses, renovação anual). Não confundir com as três colunas da
   * proposta: `vigenciaDaColuna()` faz a ponte.
   */
  vigencias: LinhaComplemento[]
}

/** Item sem preço (MDR): escopo, sem tabela e fora de qualquer soma (I-N2). */
export interface BlocoServico {
  id: ComplementoId
  nome: string
  descricao: string
  fonte: string
  naoIncluso: readonly string[]
}

/**
 * A vigência do item que vale para a coluna `i` da proposta.
 *
 * Item de uma coluna só (DLP) vale para as três: o cliente contrata um ano de
 * DLP, renovável, mesmo escolhendo 24 ou 36+12 meses de GravityZone. Por isso
 * o índice satura no que existe, em vez de devolver `undefined` e virar zero
 * calado na soma.
 */
export function vigenciaDaColuna(
  bloco: BlocoComplemento,
  coluna: number
): LinhaComplemento | undefined {
  if (bloco.vigencias.length === 0) return undefined
  return bloco.vigencias[Math.min(coluna, bloco.vigencias.length - 1)]
}

/** Separa o que tem preço do que é sob consulta. */
export function servicosSobConsulta(ids: readonly ComplementoId[]): BlocoServico[] {
  return ids
    .map(complemento)
    .filter((c) => c.sobConsulta)
    .map((c) => ({
      id: c.id,
      nome: c.nome,
      descricao: c.descricao,
      fonte: c.fonte,
      naoIncluso: c.naoIncluso ?? [],
    }))
}

export interface LinhaConsolidada {
  rotulo: string
  /** Cobertura do produto principal nesta coluna (48 na 36+12). */
  mesesPrincipal: number
  /**
   * Cobertura dos complementos nesta coluna. Mantido por compatibilidade com o
   * snapshot das propostas emitidas antes de 17/09 — é a MAIOR das coberturas.
   * Quem imprime deve usar `coberturas`, que diz todas.
   */
  mesesComplementos: number
  /**
   * Os prazos distintos dos itens nesta coluna, crescente. Com Patch (36) e DLP
   * (12) juntos na coluna 3, são dois — e o documento tem de dizer os dois, senão
   * promete ao cliente cobertura que o preço não sustenta (I-N7).
   */
  coberturas: number[]
  totalPrincipal: number
  totalComplementos: number
  total: number
}

/** Item que aparece com preço, mas fora do total somado (D5). */
export interface ItemForaDoTotal {
  nome: string
  meses: number
  valorTotalFinal: number
}

export interface Consolidado {
  /** Nome do plano principal que entrou na soma. */
  planoLabel: string
  /**
   * Itens com preço que NÃO entram no total, com o motivo impresso ao lado.
   * Hoje é o DLP, que renova a cada 12 meses (D5).
   */
  foraDoTotal: ItemForaDoTotal[]
  linhas: LinhaConsolidada[]
  itens: string[]
  /**
   * `true` quando principal e complemento não cobrem o mesmo tempo em alguma
   * coluna. O documento é obrigado a explicar — ver o comentário do topo.
   */
  coberturasDivergem: boolean
}

export function calcularComplementos(
  ids: readonly ComplementoId[],
  quantidade: number,
  descontos: DescontosPorItem = {}
): BlocoComplemento[] {
  // Complemento tem preço ÚNICO (não escalona por faixa), então volume acima de
  // 999 não precisa de faixa nenhuma: multiplica igual. O teto aqui é o mesmo
  // teto de sanidade da proposta — ver feature-quantidade-acima-da-tabela §3.
  if (
    !Number.isInteger(quantidade) ||
    quantidade < QUANTIDADE_MIN ||
    quantidade > QUANTIDADE_MAX_PROPOSTA
  ) {
    throw new ApiError(
      // ⚠️ A frase antiga dizia "fora da tabela dos complementos (5 a N)". Ao
      // trocar a constante, ela passou a AFIRMAR que a tabela dos complementos
      // cobre 100.000 licenças. Ela cobre 999 (complementos.ts). O que este
      // guard defende é sanidade, e a mensagem tem de dizer isso.
      `Quantidade inválida: informe de ${QUANTIDADE_MIN} a ${QUANTIDADE_MAX_PROPOSTA} licenças.`,
      400
    )
  }

  // Item sob consulta não tem preço: sai daqui e vira `BlocoServico` (I-N2).
  return ids
    .map(complemento)
    .filter((c): c is Complemento & { precoTabela: readonly number[] } =>
      !c.sobConsulta && c.precoTabela !== null
    )
    .map((c) => {
    const manual = descontos[c.id]
    if (manual !== undefined && (!Number.isFinite(manual) || manual < 0 || manual > 90)) {
      throw new ApiError(
        `Desconto inválido para ${c.nome}: informe de 0 a 90%.`,
        400
      )
    }
    const desconto = manual !== undefined ? manual / 100 : c.descontoPadrao
    const meses = mesesDoComplemento(c)
    return {
      id: c.id,
      nome: c.nome,
      descricao: c.descricao,
      fonte: c.fonte,
      familia: c.familia,
      precoLiquido: c.precoLiquido === true,
      foraDoTotal: c.foraDoTotal === true,
      ...(c.moeda === 'USD' ? { cambio: { ...CAMBIO } } : {}),
      descontoPercent: desconto * 100,
      temDesconto: desconto > 0,
      descontoManual: manual !== undefined,
      moeda: c.moeda ?? 'BRL',
      ...(c.precoOrigemUSD !== undefined ? { precoOrigemUSD: c.precoOrigemUSD } : {}),
      vigencias: meses.map((m, i) => {
        const precoLicenca = c.precoTabela[i]
        const precoLicencaFinal = precoLicenca * (1 - desconto)
        return {
          meses: m,
          rotulo: `${m} meses`,
          precoLicenca,
          precoLicencaFinal,
          valorUnitarioMesFinal: precoLicencaFinal / m,
          valorTotal: precoLicenca * quantidade,
          valorTotalFinal: precoLicencaFinal * quantidade,
        }
      }),
    }
  })
}

/**
 * A última página: tudo somado, coluna a coluna.
 *
 * Recebe UM plano principal — o consolidado responde "quanto custa a solução que
 * eu escolhi", e uma proposta com três planos tem três respostas possíveis. Quem
 * escolhe é o vendedor, na tela.
 */
export function consolidar(
  investimento: Investimento,
  planoIndice: number,
  complementos: BlocoComplemento[]
): Consolidado {
  const bloco = investimento.planos[planoIndice]
  if (!bloco) throw new ApiError('Plano inválido para o consolidado', 400)

  const linhas: LinhaConsolidada[] = bloco.vigencias.map((v, i) => {
    const doItem = complementos
      .filter((c) => !c.foraDoTotal)
      .map((c) => vigenciaDaColuna(c, i))
    const totalComplementos = doItem.reduce((soma, l) => soma + (l?.valorTotalFinal ?? 0), 0)
    const coberturas = [...new Set(doItem.map((l) => l?.meses).filter((m): m is number => !!m))]
      .sort((a, b) => a - b)
    return {
      rotulo: v.rotulo,
      mesesPrincipal: v.meses,
      mesesComplementos: coberturas.length ? coberturas[coberturas.length - 1] : COMPLEMENTO_MESES[i],
      coberturas,
      totalPrincipal: v.valorTotalFinal,
      totalComplementos,
      total: v.valorTotalFinal + totalComplementos,
    }
  })

  const foraDoTotal: ItemForaDoTotal[] = complementos
    .filter((c) => c.foraDoTotal)
    .map((c) => {
      const v = vigenciaDaColuna(c, 0)!
      return { nome: c.nome, meses: v.meses, valorTotalFinal: v.valorTotalFinal }
    })

  return {
    planoLabel: bloco.label,
    foraDoTotal,
    linhas,
    itens: [bloco.label, ...complementos.map((c) => c.nome)],
    coberturasDivergem:
      complementos.length > 0 &&
      linhas.some((l) => l.coberturas.some((m) => m !== l.mesesPrincipal)),
  }
}
