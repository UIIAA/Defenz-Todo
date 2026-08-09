// ─────────────────────────────────────────────────────────────────────────────
// CÁLCULO DO INVESTIMENTO — feature-portal-proposta.md §6.2
//
// Princípio da casa: LLM interpreta, JS calcula. O bloco de investimento é
// função pura de quatro entradas (quantidade, planos, ajuste, tabela) e NUNCA
// é copiado do modelo nem escrito por LLM. É o que mata, por construção, o erro
// do ÷48 que está em toda proposta que a Defenz já enviou (spec §2.1).
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
  QUANTIDADE_MIN,
  TABELA,
  VIGENCIAS,
  type Faixa,
  type PlanoId,
  type Vigencia,
} from './tabela-precos'

export interface LinhaVigencia {
  anos: Vigencia
  meses: number
  /** Preço por licença pelo período inteiro, direto da tabela pública. */
  precoLicenca: number
  /** Preço por licença já com o ajuste comercial aplicado. */
  precoLicencaFinal: number
  /** precoLicenca ÷ (12 × anos). Aqui morre o ÷48. */
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
 * Resolve a faixa da tabela pela quantidade de licenças.
 *
 * Fora de 5..999 RECUSA explicitamente — a tabela pública cobre "cliente final
 * até 999 licenças" e extrapolar seria inventar preço (spec R6).
 */
export function faixaPorQuantidade(quantidade: number): Faixa {
  if (!Number.isFinite(quantidade) || !Number.isInteger(quantidade)) {
    throw new ApiError('Quantidade de licenças deve ser um número inteiro', 400)
  }
  const encontrada = FAIXA_LIMITES.find(
    (f) => quantidade >= f.de && quantidade <= f.ate
  )
  if (!encontrada) {
    throw new ApiError(
      `Quantidade fora da tabela: a tabela pública cobre entre ${QUANTIDADE_MIN} e ${QUANTIDADE_MAX} licenças. ` +
        `Para ${quantidade} licenças, consulte a SecuriSoft antes de propor preço.`,
      400
    )
  }
  return encontrada.faixa
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
    vigencias: VIGENCIAS.map((anos): LinhaVigencia => {
      const precoLicenca = TABELA.precos[plano][faixa][anos - 1]
      const meses = 12 * anos
      return {
        anos,
        meses,
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
