import { z } from 'zod'
import { NIVEIS } from '@/lib/apresentacao/comparativo'
import { COMPLEMENTO_IDS } from '@/lib/proposta/complementos'

/**
 * Emissão da apresentação institucional (feature-portal-apresentacao.md §5).
 *
 * ⚠️ F2 — SEM IA. O `setor` é texto que o vendedor confirma; a pesquisa de nicho
 * e os casos entram na F3. Por isso aqui não há `casos`: o que o servidor não
 * sabe validar, ele não aceita.
 */
export const createApresentacaoSchema = z.object({
  clienteNome: z.string().trim().min(1, 'Nome do cliente é obrigatório').max(160),
  empresaNome: z.string().trim().min(1, 'Nome da empresa é obrigatório').max(160),
  /** Nicho. Vazio é legítimo: o documento sai institucional, sem número de setor. */
  setor: z.string().trim().max(80).nullable().optional(),
  nivelDestaque: z.enum(NIVEIS).default('PREMIUM'),
  /** Complementos a CITAR. Sem preço — ver I-C1 da feature-complementos. */
  complementos: z.array(z.enum(COMPLEMENTO_IDS)).max(COMPLEMENTO_IDS.length).default([]),
  companyId: z.string().cuid().nullable().optional(),
})

export type CreateApresentacaoInput = z.infer<typeof createApresentacaoSchema>
