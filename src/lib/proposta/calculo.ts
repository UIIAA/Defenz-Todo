// ─────────────────────────────────────────────────────────────────────────────
// CÁLCULO DO INVESTIMENTO — feature-portal-proposta.md §6.2
//
// Princípio da casa: LLM interpreta, JS calcula. O bloco de investimento é
// função pura de quatro entradas (quantidade, planos, ajuste, tabela) e NUNCA
// é copiado do modelo nem escrito por LLM.
//
// ⚠️ O "÷48" da spec §2.1 foi REINTERPRETADO (Marcos, 12/08): não era erro de
// conta, era a oferta 36+12 — paga 36 meses, cobre 48 — com o rótulo errado. O
// documento antigo dizia "36 meses" e dividia por 48, e era o RÓTULO que mentia.
// Agora a coluna se chama "36+12 meses" e `mesesCobertura` é explícito, então
// rótulo e conta contam a mesma história.
//
// A proteção que sobra, e que vale mais que o teste do ÷36: o unitário mensal
// SEMPRE fecha com `preço ÷ meses de cobertura`, nas três colunas. Qualquer
// divisor que não seja o tempo de cobertura quebra o teste.
//
// Arredondamento acontece só na FORMATAÇÃO. Arredondar no meio da conta produz
// deriva de centavos entre o unitário exibido e o total cobrado.
// ─────────────────────────────────────────────────────────────────────────────

import { ApiError } from '@/lib/api-helpers'
import {
  FAIXA_LIMITES,
  PLANOS,
  PLANO_LABEL,
  PLANO_NOME_PRODUTO,
  QUANTIDADE_MAX,
  QUANTIDADE_MAX_PROPOSTA,
  FAIXA_TOPO,
  QUANTIDADE_MIN,
  TABELA,
  VIGENCIAS,
  type AnosTabela,
  type Faixa,
  type PlanoId,
} from './tabela-precos'

export interface LinhaVigencia {
  /** Coluna da tabela de preço usada (1, 2 ou 3 anos). NÃO é o tempo de cobertura. */
  anos: AnosTabela
  /** Meses que o cliente fica protegido. Na coluna 36+12 são 48, não 36. */
  meses: number
  /** Meses de bônus embutidos no preço (12 na coluna 36+12, 0 nas outras). */
  bonusMeses: number
  /** "12 meses" | "24 meses" | "36+12 meses" — o que sai impresso. */
  rotulo: string
  /** Preço por licença pelo período inteiro, direto da tabela pública. */
  precoLicenca: number
  /** Preço por licença já com o ajuste comercial aplicado. */
  precoLicencaFinal: number
  /**
   * `precoLicenca ÷ mesesCobertura`.
   *
   * Divide pelo tempo que o cliente fica PROTEGIDO, não pelo que ele paga — é o
   * que faz a coluna 36+12 dividir por 48 e o rótulo dizer a verdade.
   */
  valorUnitarioMes: number
  /** O mesmo, sobre o preço final — é o que o cliente de fato paga por mês. */
  valorUnitarioMesFinal: number
  valorTotal: number
  valorTotalFinal: number
}

export interface BlocoPlano {
  plano: PlanoId
  label: string
  nomeProduto: string
  vigencias: LinhaVigencia[]
}

export interface Investimento {
  quantidade: number
  faixa: Faixa
  ajustePercent: number
  temAjuste: boolean
  /** 'Desconto competitivo' | 'Acréscimo' | null quando é tabela cheia. */
  rotuloAjuste: string | null
  planos: BlocoPlano[]
  /** Procedência, carimbada no registro (`precoSnapshot`) para auditoria. */
  tabelaFonte: string
  tabelaVigencia: string
}

export interface CalculoInput {
  quantidade: number
  planos: readonly PlanoId[]
  /** Percentual: -10 = 10% de desconto, 5 = 5% de acréscimo, 0 = tabela. */
  ajustePercent: number
}

/**
 * `true` quando a quantidade passa do teto da tabela pública.
 *
 * O preço continua sendo um preço que EXISTE (o da faixa topo), mas o documento
 * não pode alegar a faixa: ver `I-Q1` em feature-quantidade-acima-da-tabela.
 * Derivado da quantidade, nunca de um campo gravado — assim proposta antiga
 * reimpressa pelo `/arquivo` continua saindo igual.
 */
export function quantidadeAcimaDaTabela(inv: Pick<Investimento, 'quantidade'>): boolean {
  return inv.quantidade > QUANTIDADE_MAX
}

/**
 * Resolve a faixa da tabela pela quantidade de licenças.
 *
 * Abaixo de 5 RECUSA: a tabela não tem preço de licença avulsa e inventar um
 * seria pior do que recusar (spec R6).
 *
 * Acima de 999 NÃO recusa mais (decisão do Marcos, 21/09/2026): devolve
 * `FAIXA_TOPO`, a última e mais barata faixa da escada. Não se interpola nem se
 * extrapola — usa-se um preço que existe na tabela, e que por ser de um volume
 * MENOR nunca subfatura a Defenz. O teto que sobra (`QUANTIDADE_MAX_PROPOSTA`) é
 * contra erro de dedo, não regra comercial.
 */
export function faixaPorQuantidade(quantidade: number): Faixa {
  if (!Number.isFinite(quantidade) || !Number.isInteger(quantidade)) {
    throw new ApiError('Quantidade de licenças deve ser um número inteiro', 400)
  }
  if (quantidade < QUANTIDADE_MIN) {
    throw new ApiError(
      `Quantidade fora da tabela: a tabela pública começa em ${QUANTIDADE_MIN} licenças ` +
        `(o teto de faixa é ${QUANTIDADE_MAX}). Para ${quantidade} licenças não há preço a propor.`,
      400
    )
  }
  if (quantidade > QUANTIDADE_MAX_PROPOSTA) {
    throw new ApiError(
      `Quantidade implausível (${quantidade}). Confira o número antes de gerar a proposta.`,
      400
    )
  }
  const encontrada = FAIXA_LIMITES.find(
    (f) => quantidade >= f.de && quantidade <= f.ate
  )
  return encontrada ? encontrada.faixa : FAIXA_TOPO
}

/** Rótulo da linha de ajuste. `null` = a linha não aparece no documento. */
export function rotuloAjuste(ajustePercent: number): string | null {
  if (!Number.isFinite(ajustePercent) || ajustePercent === 0) return null
  return ajustePercent < 0 ? 'Desconto competitivo' : 'Acréscimo'
}

export function calcularInvestimento(input: CalculoInput): Investimento {
  const { quantidade, ajustePercent } = input

  if (!Number.isFinite(ajustePercent)) {
    throw new ApiError('Percentual de ajuste inválido', 400)
  }

  const faixa = faixaPorQuantidade(quantidade)

  // Ordem canônica (Business → Premium → Enterprise), não a ordem de chegada:
  // o cliente compara os planos lado a lado e a escada de preço precisa subir.
  const selecionados = PLANOS.filter((p) => input.planos.includes(p))
  if (selecionados.length === 0) {
    throw new ApiError('Selecione ao menos um plano para a proposta', 400)
  }

  const fator = 1 + ajustePercent / 100

  const planos: BlocoPlano[] = selecionados.map((plano) => ({
    plano,
    label: PLANO_LABEL[plano],
    nomeProduto: PLANO_NOME_PRODUTO[plano],
    vigencias: VIGENCIAS.map((v): LinhaVigencia => {
      // `anos` escolhe a coluna da TABELA (o que se paga);
      // `mesesCobertura` divide o preço (o tempo protegido). Na 36+12 diferem.
      const precoLicenca = TABELA.precos[plano][faixa][v.anos - 1]
      const meses = v.mesesCobertura
      return {
        anos: v.anos,
        meses,
        bonusMeses: v.bonusMeses,
        rotulo: v.rotulo,
        precoLicenca,
        precoLicencaFinal: precoLicenca * fator,
        valorUnitarioMes: precoLicenca / meses,
        valorUnitarioMesFinal: (precoLicenca * fator) / meses,
        valorTotal: precoLicenca * quantidade,
        valorTotalFinal: precoLicenca * quantidade * fator,
      }
    }),
  }))

  return {
    quantidade,
    faixa,
    ajustePercent,
    temAjuste: ajustePercent !== 0,
    rotuloAjuste: rotuloAjuste(ajustePercent),
    planos,
    tabelaFonte: TABELA.fonte,
    tabelaVigencia: TABELA.vigenteDesde,
  }
}

const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** Formata em reais pt-BR. É o ÚNICO ponto onde acontece arredondamento. */
export function formatarBRL(valor: number): string {
  // ` ` (nbsp) é o separador que o Intl usa entre "R$" e o número; o
  // documento e os testes falam em espaço simples.
  return BRL.format(valor).replace(/ /g, ' ')
}
