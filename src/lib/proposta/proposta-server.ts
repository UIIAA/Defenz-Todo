// ─────────────────────────────────────────────────────────────────────────────
// SERVIÇO DA PROPOSTA — monta o documento, reserva o número, grava o registro.
// feature-portal-proposta.md §4, §9
// ─────────────────────────────────────────────────────────────────────────────

import { formatDate } from '@/lib/date'
import { ApiError } from '@/lib/api-helpers'
import { calcularInvestimento, type Investimento } from './calculo'
import { nextPropostaCodigo } from './numeracao'
import {
  renderPropostaHtml,
  type PropostaDocumento,
  type VendedorDoc,
} from './templates/endpoints-a4'

const TZ = 'America/Sao_Paulo'

/** Ano corrente no fuso de São Paulo (invariante §9 do GUIA: fuso é SP, não UTC). */
export function anoEmSaoPaulo(agora: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric' }).format(agora)
  )
}

/** Nome do arquivo entregue. Sem acento nem caractere que atrapalhe no OneDrive. */
export function nomeArquivo(codigo: string, empresaNome: string): string {
  const limpo = empresaNome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return `Proposta Defenz ${codigo}${limpo ? ` - ${limpo}` : ''}.pdf`
}

export interface MontarDocumentoInput {
  codigo: string
  clienteNome: string
  empresaNome: string
  investimento: Investimento
  vendedor: VendedorDoc
  agora?: Date
}

export function montarDocumento(input: MontarDocumentoInput): PropostaDocumento {
  const agora = input.agora ?? new Date()
  return {
    codigo: input.codigo,
    clienteNome: input.clienteNome,
    empresaNome: input.empresaNome,
    dataFormatada: formatDate(agora),
    ano: anoEmSaoPaulo(agora),
    vendedor: input.vendedor,
    investimento: input.investimento,
  }
}

/**
 * Prévia da confirmação: o preço calculado ANTES de o documento existir.
 *
 * É onde o vendedor pega um erro de quantidade sem já ter queimado um número
 * de proposta (spec §4). Não reserva código, não grava nada.
 */
export function previewInvestimento(input: {
  quantidade: number
  planos: readonly string[]
  ajustePercent: number
}): Investimento {
  return calcularInvestimento({
    quantidade: input.quantidade,
    planos: input.planos as never,
    ajustePercent: input.ajustePercent,
  })
}

/**
 * Reconstitui o HTML de uma proposta JÁ EMITIDA, a partir do snapshot.
 *
 * ⚠️ Usa o `precoSnapshot`, NUNCA a tabela de hoje. Sem isso, baixar de novo
 * uma proposta de agosto em dezembro reimprimiria o mesmo número de proposta
 * com outro preço — o cliente teria dois documentos idênticos no código e
 * divergentes no valor.
 */
export function reconstruirDocumento(registro: {
  codigo: string
  clienteNome: string
  empresaNome: string
  precoSnapshot: unknown
  createdAt: Date
  criadoPor?: { name: string | null; email: string } | null
}): PropostaDocumento {
  const investimento = registro.precoSnapshot as Investimento
  if (!investimento || !Array.isArray(investimento.planos)) {
    throw new ApiError(
      'Registro de proposta sem snapshot de preço válido — não é possível reemitir o documento',
      500
    )
  }

  return {
    codigo: registro.codigo,
    clienteNome: registro.clienteNome,
    empresaNome: registro.empresaNome,
    dataFormatada: formatDate(registro.createdAt),
    ano: anoEmSaoPaulo(registro.createdAt),
    vendedor: {
      nome: registro.criadoPor?.name || 'Comercial Defenz',
      email: registro.criadoPor?.email || 'contato@defenz.com.br',
    },
    investimento,
  }
}

export { nextPropostaCodigo, renderPropostaHtml }
