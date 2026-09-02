// Contrato de saída da chamada B — feature-portal-apresentacao.md §6.3.
import { z } from 'zod'
import { FUNCIONALIDADES } from '../comparativo'
import { NIVEIS } from '../comparativo'

export const CasoSchema = z.object({
  oQueAconteceu: z.string().max(400),
  /** Os nomes que o modelo DIZ ter tirado. Conferidos em `guardas.ts`. */
  entidadesRemovidas: z.array(z.string()).default([]),
  necessidade: z.string().max(300),
  /** Enum fechado: a IA ESCOLHE, não descreve. O texto do PDF sai do Anexo A. */
  funcionalidade: z.enum(FUNCIONALIDADES),
  veiculo: z.string().max(80),
  ano: z.number().int().min(2015).max(2026),
  fonteIdx: z.array(z.number().int()).min(1),
})

export const PesquisaSchema = z.object({
  panoramaSetor: z.string().max(600),
  casos: z.array(CasoSchema).max(4),
  planoSugerido: z.enum(NIVEIS),
  planoPorque: z.string().max(300),
  fontes: z.array(z.object({ titulo: z.string(), dominio: z.string() })),
})

export type Pesquisa = z.infer<typeof PesquisaSchema>

/** O mesmo contrato na forma que o Gemini aceita em `responseSchema`. */
export const RESPONSE_SCHEMA_B = {
  type: 'object',
  required: ['panoramaSetor', 'casos', 'planoSugerido', 'planoPorque'],
  properties: {
    panoramaSetor: { type: 'string' },
    casos: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'oQueAconteceu',
          'entidadesRemovidas',
          'necessidade',
          'funcionalidade',
          'veiculo',
          'ano',
          'fonteIdx',
        ],
        properties: {
          oQueAconteceu: { type: 'string' },
          entidadesRemovidas: { type: 'array', items: { type: 'string' } },
          necessidade: { type: 'string' },
          funcionalidade: { type: 'string', enum: [...FUNCIONALIDADES] },
          veiculo: { type: 'string' },
          ano: { type: 'integer' },
          fonteIdx: { type: 'array', items: { type: 'integer' } },
        },
      },
    },
    planoSugerido: { type: 'string', enum: [...NIVEIS] },
    planoPorque: { type: 'string' },
  },
} as const
