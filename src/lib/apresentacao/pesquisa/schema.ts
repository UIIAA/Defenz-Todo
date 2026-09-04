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

// ─────────────────────────────────────────────────────────────────────────────
// NORMALIZAÇÃO ANTES DA VALIDAÇÃO
//
// ⚠️ Cicatriz de 02/09, com o vendedor na tela: o modelo escreveu um caso com
// mais de 400 caracteres e o `PesquisaSchema.parse` derrubou a pesquisa INTEIRA.
// Quatro casos bons, uma chamada paga e uma busca de vários segundos, jogados
// fora por um limite de tamanho — e o vendedor recebeu
// "casos.1.oQueAconteceu: String must contain at most 400 character(s)".
//
// O limite é nosso, não do modelo: existe porque a página do PDF tem altura fixa
// e `overflow:hidden` corta em silêncio. Um texto comprido é um problema de
// diagramação, não motivo para descartar a pesquisa. Então cortamos no limite —
// **e o caso chega BARRADO na revisão**, porque texto cortado precisa de olho
// humano antes de ir ao cliente.
// ─────────────────────────────────────────────────────────────────────────────

/** Corta no limite, preferindo o fim de frase e depois o fim de palavra. */
export function cortarNoLimite(texto: string, limite: number): string {
  const limpo = texto.trim()
  if (limpo.length <= limite) return limpo

  const pedaco = limpo.slice(0, limite)
  const fimFrase = Math.max(pedaco.lastIndexOf('. '), pedaco.lastIndexOf('; '))
  if (fimFrase > limite * 0.5) return pedaco.slice(0, fimFrase + 1).trim()

  // ⚠️ A reticência CONTA para o limite: sem o -1 o corte devolve limite+1 e a
  // validação seguinte reprova o texto que acabamos de consertar. Custou um
  // teste vermelho com um panorama de 900 caracteres.
  const curto = limpo.slice(0, limite - 1)
  const fimPalavra = curto.lastIndexOf(' ')
  return (fimPalavra > limite * 0.5 ? curto.slice(0, fimPalavra) : curto).trim() + '…'
}

export interface PesquisaNormalizada {
  pesquisa: Pesquisa
  /** Índices dos casos que tiveram texto cortado — chegam barrados na revisão. */
  truncados: number[]
  /** Casos que nem depois do corte passaram no contrato, com o motivo. */
  descartados: { indice: number; motivo: string }[]
}

/**
 * Valida a saída da chamada B **sem deixar um caso ruim derrubar os bons**.
 *
 * Um caso inválido é um caso perdido — nunca a pesquisa inteira.
 */
export function normalizarPesquisa(objeto: unknown): PesquisaNormalizada {
  const bruto = (objeto ?? {}) as Record<string, unknown>
  const casosBrutos = Array.isArray(bruto.casos) ? bruto.casos : []

  const truncados: number[] = []
  const descartados: { indice: number; motivo: string }[] = []
  const casos: Pesquisa['casos'] = []

  casosBrutos.forEach((c, i) => {
    const original = (c ?? {}) as Record<string, unknown>
    const oQue = String(original.oQueAconteceu ?? '')
    const nec = String(original.necessidade ?? '')
    const cortado = cortarNoLimite(oQue, 400)
    const necCortada = cortarNoLimite(nec, 300)

    const r = CasoSchema.safeParse({
      ...original,
      oQueAconteceu: cortado,
      necessidade: necCortada,
    })
    if (!r.success) {
      descartados.push({ indice: i, motivo: r.error.issues[0]?.message ?? 'formato inválido' })
      return
    }
    if (cortado !== oQue.trim() || necCortada !== nec.trim()) truncados.push(casos.length)
    casos.push(r.data)
  })

  const resto = PesquisaSchema.omit({ casos: true }).safeParse({
    fontes: [],
    ...bruto,
    panoramaSetor: cortarNoLimite(String(bruto.panoramaSetor ?? ''), 600),
    planoPorque: cortarNoLimite(String(bruto.planoPorque ?? ''), 300),
  })
  if (!resto.success) {
    throw new Error(
      `A pesquisa voltou fora do contrato: ${resto.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`
    )
  }

  return { pesquisa: { ...resto.data, casos: casos.slice(0, 4) }, truncados, descartados }
}
