// ─────────────────────────────────────────────────────────────────────────────
// AS DUAS CHAMADAS — feature-portal-apresentacao.md §6.2 e §6.2.1
//
// ⚠️ Duas chamadas não é preferência de desenho: é a ÚNICA forma de a chamada A
// ter `groundingMetadata`. Medido em 22/08 contra a API real:
//
//   googleSearch + prosa                        → 200, grounding completo
//   googleSearch + responseSchema (JSON)        → 200, JSON perfeito e plausível,
//                                                  e groundingMetadata AUSENTE
//   googleSearch + JSON sem schema              → 200 sem candidato nenhum
//
// A linha do meio é a que mata: casos bem formados, com nome de veículo, validando
// no Zod, e ZERO atribuição — citação que ninguém pode conferir, sem erro e sem
// aviso. Por isso a A descobre e cita, e a B (sem internet) só reescreve.
//
// ⚠️ SDK: `@google/genai`. O legado (`@google/generative-ai`) não expõe
// `googleSearch` no tipo `Tool`, e os typings da RESPOSTA dele têm quatro nomes
// com erro de digitação (`groundingChuncks`, `groundingSupport`, …) que devolvem
// `undefined` sem exceção — o documento sairia sem citação e o TypeScript
// aprovaria. A Ana (`src/lib/portal/ask.ts`) fica no legado por ora: ela não usa
// grounding.
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenAI, type GenerateContentResponse } from '@google/genai'
import { normalizarPesquisa, RESPONSE_SCHEMA_B, type PesquisaNormalizada } from './schema'
import { COMPARATIVO } from '../comparativo'
import { avaliarCaso, type VeredictoCaso } from './guardas'

export const MODELO_PESQUISA = process.env.APRESENTACAO_MODEL || 'gemini-3.6-flash'

export interface FonteBruta {
  titulo: string
  dominio: string
}

export interface ResultadoChamadaA {
  /** O texto bruto. É contra ele que o A13b confere cada dígito (§6.5.1). */
  texto: string
  fontes: FonteBruta[]
  latenciaMs: number
  modelo: string
}

export class PesquisaSemGroundingError extends Error {
  constructor() {
    super(
      'A busca respondeu sem groundingMetadata: o texto não tem fonte conferível. ' +
        'Sem isso não há citação, e sem citação o caso não pode ir ao cliente.'
    )
    this.name = 'PesquisaSemGroundingError'
  }
}

/**
 * As fontes reais da chamada A.
 *
 * ⚠️ Os nomes dos campos são os que a API devolve DE VERDADE — `groundingChunks`
 * e `groundingSupports`. Ler `groundingChuncks` (o typo do SDK legado) devolve
 * `undefined` e cai no caminho de "nenhuma fonte", em silêncio.
 */
export function fontesDoGrounding(resposta: GenerateContentResponse): FonteBruta[] {
  const gm = resposta.candidates?.[0]?.groundingMetadata
  const chunks = gm?.groundingChunks ?? []
  const fontes: FonteBruta[] = []
  for (const c of chunks) {
    const web = c.web
    if (!web) continue
    const titulo = (web.title ?? '').trim()
    const dominio = (web.domain ?? dominioReal(web.uri, titulo) ?? '').trim()
    if (!titulo && !dominio) continue
    fontes.push({ titulo: titulo || dominio, dominio })
  }
  return fontes
}

/**
 * O domínio que vai IMPRESSO no documento do cliente.
 *
 * ⚠️ Achado com a pesquisa real de 02/09: o `uri` que o grounding devolve é um
 * REDIRECT do Google (`vertexaisearch.cloud.google.com/grounding-api-redirect/…`),
 * e o domínio de verdade vem no `title`. Sem tratar isso, a página de casos
 * citaria "vertexaisearch.cloud.google.com" como fonte de todas as matérias —
 * um endereço interno do Google impresso como se fosse o veículo.
 */
const REDIRECT_GROUNDING = 'vertexaisearch.cloud.google.com'

function dominioReal(uri: string | undefined, titulo: string): string | undefined {
  const host = hostDaUri(uri)
  if (host && !host.endsWith(REDIRECT_GROUNDING)) return host
  // No redirect, o `title` É o domínio ("canaltech.com.br").
  const doTitulo = titulo.trim().toLowerCase()
  if (/^[a-z0-9.-]+\.[a-z]{2,}$/.test(doTitulo)) return doTitulo.replace(/^www\./, '')
  return host
}

function hostDaUri(uri?: string): string | undefined {
  if (!uri) return undefined
  try {
    return new URL(uri).hostname.replace(/^www\./, '')
  } catch {
    return undefined
  }
}

/** Assinatura mínima que as chamadas usam — trocável nos testes, sem rede. */
export type GerarConteudo = (
  req: Parameters<GoogleGenAI['models']['generateContent']>[0]
) => Promise<GenerateContentResponse>

function clientePadrao(): GerarConteudo {
  const chave = process.env.GEMINI_API_KEY
  if (!chave) throw new Error('GEMINI_API_KEY ausente: a pesquisa da apresentação não roda.')
  const ai = new GoogleGenAI({ apiKey: chave })
  return (req) => ai.models.generateContent(req)
}

export interface EntradaPesquisa {
  empresaNome: string
  /** Setor JÁ CONFIRMADO pelo vendedor no passo zero (§4). Nunca adivinhado aqui. */
  setor: string
  site?: string
  /** Janela de recência, ISO-8601. Prende a busca em vez de pedir isso em prosa. */
  desde?: string
}

export function promptA(e: EntradaPesquisa): string {
  return [
    `Você pesquisa incidentes de segurança da informação REAIS e NOTICIADOS no setor: ${e.setor}.`,
    `Contexto do cliente: ${e.empresaNome}${e.site ? ` (${e.site})` : ''}.`,
    '',
    'Procure INCIDENTES QUE ACONTECERAM, no Brasil de preferência, com reportagem que os',
    'documente: o que houve, quando, que efeito teve na operação. Não escreva tendências,',
    'previsões, nem conselhos de segurança.',
    '',
    'Escreva em prosa corrida, citando veículo e ano de cada caso. Inclua os números que a',
    'matéria trouxer (dias parados, valores, quantidades) EXATAMENTE como publicados.',
    '',
    '⚠️ Se não houver incidente documentado neste setor, diga isso com todas as letras e',
    'não preencha com exemplos genéricos de outros setores.',
  ].join('\n')
}

export function promptB(textoA: string): string {
  const funcionalidades = COMPARATIVO.map((f) => `- ${f.id}: ${f.nome}`).join('\n')
  return [
    'Abaixo está um texto de pesquisa. Reorganize-o no JSON pedido.',
    '',
    '⚠️ REGRAS ABSOLUTAS:',
    '1. Você NÃO tem internet e NÃO pode acrescentar nenhum fato, número, empresa, veículo',
    '   ou ano que não esteja no texto. Só reorganize o que está lá.',
    '2. ANONIMIZE: nenhum nome de empresa, pessoa, hospital, escola ou órgão vítima pode',
    '   sobrar em `oQueAconteceu`. Liste em `entidadesRemovidas` cada nome que você tirou.',
    '3. `funcionalidade` é uma escolha nesta lista fechada, e só isso:',
    funcionalidades,
    '4. `fonteIdx` aponta para a lista `fontes` que será fornecida ao final do processo,',
    '   na ordem em que as fontes aparecem no texto.',
    '5. Se o texto disser que não há incidente documentado, devolva `casos: []`. NÃO invente',
    '   casos para não voltar vazio.',
    '6. LIMITES DE TAMANHO, respeite-os: `oQueAconteceu` até 400 caracteres,',
    '   `necessidade` até 300, `panoramaSetor` até 600. São limites de diagramação —',
    '   o texto maior é CORTADO, então prefira escrever curto a ser cortado.',
    '',
    '--- TEXTO DA PESQUISA ---',
    textoA,
  ].join('\n')
}

/** Chamada A: com busca, saída em prosa. É quem descobre e quem cita. */
export async function chamadaA(
  entrada: EntradaPesquisa,
  gerar: GerarConteudo = clientePadrao()
): Promise<ResultadoChamadaA> {
  const t0 = Date.now()
  const resposta = await gerar({
    model: MODELO_PESQUISA,
    contents: promptA(entrada),
    config: {
      tools: [
        {
          googleSearch: entrada.desde
            ? { timeRangeFilter: { startTime: entrada.desde, endTime: new Date().toISOString() } }
            : {},
        },
      ],
    },
  })

  const texto = (resposta.text ?? '').trim()
  const fontes = fontesDoGrounding(resposta)
  // Sem grounding não há o que conferir: é o modo de falha silencioso do §6.2.1,
  // e ele morre aqui em vez de virar citação no PDF.
  if (!texto || fontes.length === 0) throw new PesquisaSemGroundingError()

  return { texto, fontes, latenciaMs: Date.now() - t0, modelo: MODELO_PESQUISA }
}

/** Chamada B: SEM ferramenta, saída em JSON. Só reescreve o que a A trouxe. */
export async function chamadaB(
  textoA: string,
  gerar: GerarConteudo = clientePadrao()
): Promise<PesquisaNormalizada> {
  const resposta = await gerar({
    model: MODELO_PESQUISA,
    contents: promptB(textoA),
    config: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA_B as unknown as Record<string, unknown>,
    },
  })

  const cru = (resposta.text ?? '').trim()
  let objeto: unknown
  try {
    objeto = JSON.parse(cru)
  } catch {
    throw new Error(`A chamada B não devolveu JSON válido (${cru.slice(0, 120)}…).`)
  }
  // ⚠️ Normaliza ANTES de validar: um caso comprido demais não pode derrubar a
  // pesquisa inteira (cicatriz de 02/09 — ver `normalizarPesquisa`).
  return normalizarPesquisa(objeto)
}

// ── A orquestração ───────────────────────────────────────────────────────────

export interface ResultadoPesquisa {
  panoramaSetor: string
  /** Cada caso com suas bandeiras. Bloqueado chega desmarcado na revisão (§6.6). */
  casos: VeredictoCaso[]
  planoSugerido: PesquisaNormalizada['pesquisa']['planoSugerido']
  planoPorque: string
  /** Casos que nem depois do corte passaram no contrato. A tela avisa. */
  descartados: { indice: number; motivo: string }[]
  fontes: FonteBruta[]
  /** Guardado por pesquisa: custo medido, não estimado (§6.8). */
  telemetria: { latenciaMs: number; modelo: string; qtdFontes: number }
  /** O texto bruto da A, para a revisão poder mostrar de onde saiu cada número. */
  textoPesquisa: string
}

/**
 * A → B → guardas. É este o contrato que a rota e a tela de revisão consomem.
 *
 * ⚠️ Nenhum caso é descartado aqui. Caso com bandeira volta `bloqueado`, e quem
 * libera é o vendedor na tela (§6.4 camada 3).
 */
export async function pesquisar(
  entrada: EntradaPesquisa,
  gerar: GerarConteudo = clientePadrao()
): Promise<ResultadoPesquisa> {
  const t0 = Date.now()
  const a = await chamadaA(entrada, gerar)
  const { pesquisa: b, truncados, descartados } = await chamadaB(a.texto, gerar)

  return {
    panoramaSetor: b.panoramaSetor,
    casos: b.casos.map((c, i) => {
      const v = avaliarCaso(c, a.texto, a.fontes.length)
      // Texto cortado chega BARRADO: cortar é decisão de diagramação, e quem
      // confere se o corte não mudou o sentido é gente.
      if (truncados.includes(i)) {
        v.bandeiras.push({
          tipo: 'texto_truncado',
          detalhe: 'o texto veio maior do que cabe na página e foi cortado — confira o corte',
        })
        v.bloqueado = true
      }
      return v
    }),
    descartados,
    planoSugerido: b.planoSugerido,
    planoPorque: b.planoPorque,
    fontes: a.fontes,
    telemetria: { latenciaMs: Date.now() - t0, modelo: MODELO_PESQUISA, qtdFontes: a.fontes.length },
    textoPesquisa: a.texto,
  }
}
