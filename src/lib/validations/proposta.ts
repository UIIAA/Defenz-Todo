import { z } from 'zod'
import { PLANOS, QUANTIDADE_MAX, QUANTIDADE_MIN } from '@/lib/proposta/tabela-precos'

export const PROPOSTA_TIPOS = ['ENDPOINTS'] as const

/** Como o vendedor declara o preço. `tabela` força ajuste 0. */
export const BASES_PRECO = ['tabela', 'abaixo', 'acima'] as const
export type BasePreco = (typeof BASES_PRECO)[number]

/** Teto do ajuste. 100% de desconto seria doar; 100% de acréscimo, erro de dedo. */
export const AJUSTE_MAX_PERCENT = 90

export const createPropostaSchema = z
  .object({
    tipo: z.enum(PROPOSTA_TIPOS).default('ENDPOINTS'),

    clienteNome: z.string().trim().min(1, 'Nome do cliente é obrigatório').max(160),
    empresaNome: z.string().trim().min(1, 'Nome da empresa é obrigatório').max(160),
    cnpj: z.string().trim().max(24).nullable().optional(),
    /** Capturado agora, usado pela Ana depois — não entra no documento (§12). */
    oQueFaz: z.string().trim().max(4000).nullable().optional(),

    quantidade: z
      .number({ invalid_type_error: 'Informe a quantidade de licenças' })
      .int('A quantidade de licenças precisa ser um número inteiro')
      .min(
        QUANTIDADE_MIN,
        `A tabela pública começa em ${QUANTIDADE_MIN} licenças`
      )
      .max(
        QUANTIDADE_MAX,
        `A tabela pública vai até ${QUANTIDADE_MAX} licenças. Acima disso, consulte a SecuriSoft antes de propor preço.`
      ),

    planos: z
      .array(z.enum(PLANOS))
      .min(1, 'Marque ao menos um plano')
      .max(PLANOS.length),

    basePreco: z.enum(BASES_PRECO).default('tabela'),
    /** Sempre positivo no formulário; o sinal vem de `basePreco`. */
    percentual: z.number().min(0).max(AJUSTE_MAX_PERCENT).nullable().optional(),

    /** Só admin escolhe; os demais gravam na própria empresa. */
    companyId: z.string().nullable().optional(),
  })
  .refine((d) => d.basePreco === 'tabela' || (d.percentual ?? 0) > 0, {
    message: 'Informe o percentual quando o preço não for o de tabela',
    path: ['percentual'],
  })

export type CreatePropostaInput = z.infer<typeof createPropostaSchema>

/**
 * Converte a dupla (base, percentual) no ajuste assinado que o cálculo espera.
 * `tabela` ignora o percentual — inclusive um valor deixado para trás na tela
 * ao trocar o radio de volta, que senão viraria desconto fantasma.
 */
export function ajusteAssinado(input: {
  basePreco: BasePreco
  percentual?: number | null
}): number {
  if (input.basePreco === 'tabela') return 0
  const p = input.percentual ?? 0
  return input.basePreco === 'abaixo' ? -p : p
}
