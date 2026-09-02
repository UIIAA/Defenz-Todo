import { z } from 'zod'

/** Passo zero (§4): barato, só BrasilAPI, e nenhuma busca roda aqui. */
export const setorSchema = z.object({
  cnpj: z.string().trim().max(20).optional(),
  site: z.string().trim().max(200).optional(),
  descricao: z.string().trim().max(500).optional(),
})

/**
 * Pesquisa (§6). O `setor` é obrigatório **e confirmado**: é o passo zero que
 * decide o nicho, e ele nunca chega adivinhado aqui.
 */
export const pesquisaSchema = z.object({
  empresaNome: z.string().trim().min(1).max(160),
  setor: z.string().trim().min(1, 'Confirme o setor antes de pesquisar').max(80),
  site: z.string().trim().max(200).optional(),
  desde: z.string().datetime().optional(),
  companyId: z.string().cuid().nullable().optional(),
})
