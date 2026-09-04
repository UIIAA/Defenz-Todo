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
  type Complemento,
  type ComplementoId,
} from './complementos'
import { QUANTIDADE_MAX, QUANTIDADE_MIN } from './tabela-precos'
import type { Investimento } from './calculo'

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
  /** 0 quando o valor já é líquido (PHASR e sensores). */
  descontoPercent: number
  temDesconto: boolean
  vigencias: LinhaComplemento[]
}

export interface LinhaConsolidada {
  rotulo: string
  /** Cobertura do produto principal nesta coluna (48 na 36+12). */
  mesesPrincipal: number
  /** Cobertura dos complementos nesta coluna (36 na mesma). */
  mesesComplementos: number
  totalPrincipal: number
  totalComplementos: number
  total: number
}

export interface Consolidado {
  /** Nome do plano principal que entrou na soma. */
  planoLabel: string
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
  quantidade: number
): BlocoComplemento[] {
  if (!Number.isInteger(quantidade) || quantidade < QUANTIDADE_MIN || quantidade > QUANTIDADE_MAX) {
    throw new ApiError(
      `Quantidade fora da tabela dos complementos (${QUANTIDADE_MIN} a ${QUANTIDADE_MAX} licenças).`,
      400
    )
  }

  return ids.map((id) => {
    const c = complemento(id)
    return {
      id: c.id,
      nome: c.nome,
      descricao: c.descricao,
      fonte: c.fonte,
      familia: c.familia,
      descontoPercent: c.descontoPadrao * 100,
      temDesconto: c.descontoPadrao > 0,
      vigencias: COMPLEMENTO_MESES.map((meses, i) => {
        const precoLicenca = c.precoTabela[i]
        const precoLicencaFinal = precoLicenca * (1 - c.descontoPadrao)
        return {
          meses,
          rotulo: `${meses} meses`,
          precoLicenca,
          precoLicencaFinal,
          valorUnitarioMesFinal: precoLicencaFinal / meses,
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
    const totalComplementos = complementos.reduce(
      (soma, c) => soma + (c.vigencias[i]?.valorTotalFinal ?? 0),
      0
    )
    return {
      rotulo: v.rotulo,
      mesesPrincipal: v.meses,
      mesesComplementos: COMPLEMENTO_MESES[i],
      totalPrincipal: v.valorTotalFinal,
      totalComplementos,
      total: v.valorTotalFinal + totalComplementos,
    }
  })

  return {
    planoLabel: bloco.label,
    linhas,
    itens: [bloco.label, ...complementos.map((c) => c.nome)],
    coberturasDivergem:
      complementos.length > 0 &&
      linhas.some((l) => l.mesesPrincipal !== l.mesesComplementos),
  }
}
