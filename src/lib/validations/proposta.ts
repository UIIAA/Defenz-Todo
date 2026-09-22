import { z } from 'zod'
import { PLANOS, QUANTIDADE_MAX_PROPOSTA, QUANTIDADE_MIN } from '@/lib/proposta/tabela-precos'
import { COMPLEMENTO_IDS } from '@/lib/proposta/complementos'

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
      // Acima de 999 a proposta é EMITIDA com o preço da faixa topo (500-999).
      // Este teto é só contra erro de dedo — feature-quantidade-acima-da-tabela.
      .max(
        QUANTIDADE_MAX_PROPOSTA,
        `Quantidade implausível. Confira o número de licenças.`
      ),

    /**
     * Pode vir VAZIA desde 22/09: proposta só de add-ons, para cliente que já
     * tem a base. O que nunca pode é proposta vazia — ver o superRefine no fim,
     * que é o único ponto capaz de olhar planos e complementos juntos.
     */
    planos: z.array(z.enum(PLANOS)).max(PLANOS.length).default([]),

    basePreco: z.enum(BASES_PRECO).default('tabela'),
    /** Sempre positivo no formulário; o sinal vem de `basePreco`. */
    percentual: z.number().min(0).max(AJUSTE_MAX_PERCENT).nullable().optional(),

    /** Complementos marcados. Vazio = proposta idêntica à de antes (I-C5). */
    complementos: z.array(z.enum(COMPLEMENTO_IDS)).max(COMPLEMENTO_IDS.length).default([]),

    /**
     * Desconto por item, em PERCENTUAL (0 a 90), sobrepondo o do catálogo.
     *
     * ⚠️ Percentual, não fração: o catálogo guarda `0.5` e a tela manda `50`. A
     * conversão acontece numa fronteira só (`calcularComplementos`), senão um
     * "50" cru viraria `1 - 50` = preço negativo (achado 11 da crítica).
     *
     * Opcional: payload antigo, sem o campo, continua válido (I-C5).
     */
    descontosComplemento: z
      .record(z.enum(COMPLEMENTO_IDS), z.number().min(0).max(90))
      .optional(),

    /**
     * Quantidade por add-on, sobrepondo a do principal.
     *
     * ⚠️ A Bitdefender vende assim: cada add-on é SKU próprio com chave própria.
     * No sensor de Produtividade a divergência é o caso normal — ele licencia
     * usuários de Microsoft 365 / Google Workspace, não máquinas.
     *
     * Opcional: payload antigo, sem o campo, continua idêntico.
     */
    quantidadesComplemento: z
      .record(
        z.enum(COMPLEMENTO_IDS),
        z
          .number()
          .int('A quantidade de cada complemento precisa ser um número inteiro')
          .min(QUANTIDADE_MIN)
          .max(QUANTIDADE_MAX_PROPOSTA)
      )
      .optional(),
    /**
     * Qual plano entra no resumo somado. Índice dentro de `planos`.
     *
     * "Quanto custa a solução que eu escolhi" tem UMA resposta; com três planos
     * marcados haveria três. Quem escolhe é o vendedor.
     */
    planoConsolidado: z.number().int().min(0).max(PLANOS.length - 1).default(0),

    /** Só admin escolhe; os demais gravam na própria empresa. */
    companyId: z.string().nullable().optional(),
  })
  // Desconto de item que não foi marcado seria descartado em silêncio, e o
  // vendedor acharia que aplicou (achado 15 da crítica).
  .refine(
    (d) =>
      Object.keys(d.descontosComplemento ?? {}).every((id) =>
        d.complementos.includes(id as (typeof COMPLEMENTO_IDS)[number])
      ),
    {
      message: 'Há desconto informado para um complemento que não foi marcado',
      path: ['descontosComplemento'],
    }
  )
  // Item repetido viraria dois blocos iguais, somados duas vezes (achado 16).
  .refine((d) => new Set(d.complementos).size === d.complementos.length, {
    message: 'Complemento repetido na lista',
    path: ['complementos'],
  })
  // ⚠️ `planos` vazio é proposta só de add-ons: não há resumo consolidado para
  // escolher plano nenhum, então a regra não se aplica (antes, com a lista
  // vazia, `0 < 0` reprovava e a proposta só de add-ons era impossível).
  .refine(
    (d) =>
      d.complementos.length === 0 ||
      d.planos.length === 0 ||
      d.planoConsolidado < d.planos.length,
    {
      message: 'O plano escolhido para o resumo não está entre os planos marcados',
      path: ['planoConsolidado'],
    }
  )
  // Proposta vazia: sem plano E sem complemento não há o que propor. Este é o
  // único ponto que enxerga os dois campos juntos — por isso a regra mora aqui,
  // e não num `.min(1)` em cada lista.
  .refine((d) => d.planos.length > 0 || d.complementos.length > 0, {
    message: 'Marque ao menos um plano ou um complemento',
    path: ['planos'],
  })
  // Mesma regra do desconto (achado 15): quantidade para item não marcado seria
  // descartada em silêncio, e o vendedor acharia que tinha aplicado.
  .refine(
    (d) =>
      Object.keys(d.quantidadesComplemento ?? {}).every((id) =>
        d.complementos.includes(id as (typeof COMPLEMENTO_IDS)[number])
      ),
    {
      message: 'Há quantidade informada para um complemento que não foi marcado',
      path: ['quantidadesComplemento'],
    }
  )
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
