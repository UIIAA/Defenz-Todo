import { z } from 'zod'
import { NIVEIS } from '@/lib/apresentacao/comparativo'
import { COMPLEMENTO_IDS } from '@/lib/proposta/complementos'
import { FUNCIONALIDADES } from '@/lib/apresentacao/comparativo'

/** Um caso como volta da tela de revisão (spec §6.6). */
export const casoRevisadoSchema = z.object({
  oQueAconteceu: z.string().trim().min(1).max(400),
  entidadesRemovidas: z.array(z.string().max(120)).max(20).default([]),
  necessidade: z.string().trim().min(1).max(300),
  funcionalidade: z.enum(FUNCIONALIDADES),
  veiculo: z.string().trim().min(1).max(80),
  ano: z.number().int().min(2015).max(2026),
  fonteIdx: z.array(z.number().int()).min(1).max(10),
  /** O vendedor viu a bandeira e assumiu o conteúdo. */
  liberado: z.boolean().default(false),
})

/**
 * Emissão da apresentação institucional (feature-portal-apresentacao.md §5).
 *
 * ⚠️ F2 — SEM IA. O `setor` é texto que o vendedor confirma; a pesquisa de nicho
 * e os casos entram na F3. Por isso aqui não há `casos`: o que o servidor não
 * sabe validar, ele não aceita.
 */
export const createApresentacaoSchema = z
  .object({
  clienteNome: z.string().trim().min(1, 'Nome do cliente é obrigatório').max(160),
  empresaNome: z.string().trim().min(1, 'Nome da empresa é obrigatório').max(160),
  /** Nicho. Vazio é legítimo: o documento sai institucional, sem número de setor. */
  setor: z.string().trim().max(80).nullable().optional(),
  nivelDestaque: z.enum(NIVEIS).default('PREMIUM'),
  /**
   * A pesquisa que originou os casos. O servidor busca o TEXTO dela no banco
   * para reconferir os dígitos — nunca confia no texto que vem do navegador.
   */
  pesquisaId: z.string().cuid().nullable().optional(),
  /** Casos já revisados pelo vendedor. Vazio = documento institucional (§6.7). */
  casos: z.array(casoRevisadoSchema).max(4).default([]),
  /** O aceite explícito. Nunca pré-marcado na tela. */
  aceite: z.boolean().default(false),

  /** Complementos a CITAR. Sem preço — ver I-C1 da feature-complementos. */
  complementos: z.array(z.enum(COMPLEMENTO_IDS)).max(COMPLEMENTO_IDS.length).default([]),
  companyId: z.string().cuid().nullable().optional(),
  })
  .refine((d) => d.casos.length === 0 || !!d.pesquisaId, {
    message: 'Casos só entram acompanhados da pesquisa que os originou',
    path: ['pesquisaId'],
  })

export type CreateApresentacaoInput = z.infer<typeof createApresentacaoSchema>
