import { db } from '@/lib/db'
import { scopedPlaybookWhere } from '@/lib/playbook-scope'
import { freshnessOf } from '@/lib/playbook-freshness'
import type { ScopeUser } from '@/lib/auth'

/**
 * Retrieve da Ana — o ponto que quase matou a feature (spec §4).
 *
 * A v1 dizia "busca scoped → top-6" usando o `contains` da string crua. Isso teria recall
 * ZERO: "como faço o onboarding de um cliente novo?" vira LIKE '%como faço o onboarding de
 * um cliente novo?%' e casa com nada. Pior: o `orderBy` do endpoint de listagem é por
 * `reviewDueAt`, então "top-6" devolveria os 6 POPs mais VENCIDOS, não os mais relevantes.
 * E o bug passaria despercebido — a Ana cairia sempre no ramo "não achei", que é justamente
 * o comportamento que a spec celebra.
 *
 * Desenho: LLM extrai, JS calcula. Extração de termos + ranking aqui, em JS puro.
 *
 * ⚠️ DESVIO DELIBERADO da §4 passo 2 (que pedia OR por termo no SQL com `take: 40`):
 * o prefiltro no banco seria acento-sensível (`contains` do Postgres não tem `unaccent`),
 * e a busca real é digitada SEM acento ("cadencia") contra corpo COM acento ("cadência") —
 * ou seja, o prefiltro reintroduziria o recall zero que a §4 existe para evitar.
 * Como o corpus é interno e pequeno (dezenas de fichas; o mesmo cap de 200 que a rota de
 * listagem já usa), buscamos os candidatos do escopo e ranqueamos tudo em JS com
 * normalização sem acento. Trip-wire: se o Portal passar de algumas centenas de documentos,
 * aí sim vale `unaccent` + índice GIN (cortados do MVP de propósito).
 */

/** Mesmo cap da rota de listagem — o Portal não é feed infinito (GUIA §9.4). */
const MAX_CANDIDATOS = 200

/** Quantas fontes entram no prompt. Cap duro da spec-mãe §5. */
export const TOP_K = 6

/** Abaixo disto o melhor resultado é fraco demais → aviso `fonte_fraca`. */
export const SCORE_FRACO = 4

const MAX_TERMOS = 8

/**
 * Stopwords PT-BR. Só palavras que não carregam sentido de busca — verbos e substantivos
 * de processo ficam ("fazer", "cliente", "proposta" são exatamente o que queremos casar).
 */
const STOPWORDS = new Set([
  'a', 'ao', 'aos', 'as', 'com', 'como', 'da', 'das', 'de', 'dela', 'dele', 'deles', 'do',
  'dos', 'e', 'ela', 'elas', 'ele', 'eles', 'em', 'entao', 'entre', 'era', 'essa', 'essas',
  'esse', 'esses', 'esta', 'estao', 'estas', 'este', 'estes', 'eu', 'foi', 'isso', 'isto',
  'ja', 'la', 'lhe', 'mais', 'mas', 'me', 'mesmo', 'meu', 'minha', 'muito', 'na', 'nao',
  'nas', 'nem', 'no', 'nos', 'nossa', 'nosso', 'num', 'numa', 'o', 'os', 'ou', 'para',
  'pela', 'pelas', 'pelo', 'pelos', 'per', 'por', 'porque', 'qual', 'quando', 'que', 'quem',
  'sao', 'se', 'sem', 'ser', 'seu', 'seus', 'so', 'sobre', 'sua', 'suas', 'tem', 'tambem',
  'ter', 'teu', 'tua', 'um', 'uma', 'voce', 'voces', 'qtd', 'pra', 'pro',
])

/** Minúsculas, sem acento, sem pontuação. Aplicado dos DOIS lados da comparação. */
export function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD') // separa o acento da letra, para o range de diacríticos abaixo remover
    .replace(/[̀-ͯ]/g, '')
}

/**
 * Extrai os termos de busca de uma pergunta em português natural.
 * Minúsculas → sem acento → sem stopwords → descarta < 3 chars → dedup → cap 8.
 */
export function extrairTermos(pergunta: string): string[] {
  const brutos = normalizar(pergunta)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

  const vistos = new Set<string>()
  const termos: string[] = []

  for (const t of brutos) {
    if (t.length < 3) continue
    if (STOPWORDS.has(t)) continue
    if (vistos.has(t)) continue
    vistos.add(t)
    termos.push(t)
    if (termos.length >= MAX_TERMOS) break
  }

  return termos
}

export interface CandidatoPlaybook {
  id: string
  kind: 'POP' | 'BIBLIOTECA'
  title: string
  body: string
  companyId: string | null
  /** Nome da empresa dona. `null` = conteúdo GLOBAL da Defenz. */
  company?: { name: string } | null
  verifiedAt: Date | null
  reviewDueAt: Date | null
}

/**
 * Rótulo da empresa exposto na citação (contrato D8).
 *
 * Existe porque `scopedPlaybookWhere` NÃO filtra admin — e o Marcos é admin em 4 empresas.
 * Sem isso a Ana pode dizer "o processo é X" quando X é de outro cliente. Não é vazamento
 * (admin é autorizado), é armadilha de correção.
 */
export function empresaDaFonte(f: Pick<CandidatoPlaybook, 'companyId' | 'company'>): string {
  return f.companyId === null ? 'Defenz (global)' : (f.company?.name ?? 'outra empresa')
}

export interface FonteRankeada extends CandidatoPlaybook {
  score: number
  /** Quantos termos da pergunta aparecem no TÍTULO. Sinal de confiança — ver `ask.ts`. */
  termosNoTitulo: number
}

function contarOcorrencias(texto: string, termo: string): number {
  if (!termo) return 0
  let n = 0
  let i = texto.indexOf(termo)
  while (i !== -1) {
    n++
    i = texto.indexOf(termo, i + termo.length)
  }
  return n
}

/**
 * Ranqueia em JS (spec §4 passo 3):
 * +3 por termo presente no TÍTULO · +1 por ocorrência no CORPO (cap 5 por termo) ·
 * +1 se for POP (procedimento vence ficha de material).
 * Empate → verificado mais recentemente.
 *
 * Só sobrevive quem tem score > 0.
 */
export function ranquear(
  candidatos: CandidatoPlaybook[],
  termos: string[],
  topK = TOP_K
): FonteRankeada[] {
  if (termos.length === 0) return []

  const pontuados = candidatos.map((c) => {
    const titulo = normalizar(c.title)
    const corpo = normalizar(c.body)
    let score = 0
    let termosNoTitulo = 0

    for (const termo of termos) {
      if (titulo.includes(termo)) {
        score += 3
        termosNoTitulo++
      }
      score += Math.min(contarOcorrencias(corpo, termo), 5)
    }

    if (score > 0 && c.kind === 'POP') score += 1

    return { ...c, score, termosNoTitulo }
  })

  return pontuados
    .filter((c) => c.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      const va = a.verifiedAt ? a.verifiedAt.getTime() : 0
      const vb = b.verifiedAt ? b.verifiedAt.getTime() : 0
      return vb - va
    })
    .slice(0, topK)
}

/**
 * Busca as fontes internas relevantes para a pergunta, sempre dentro do escopo do usuário.
 *
 * `scopedPlaybookWhere` combina por AND internamente — o caller nunca espalha o escopo.
 */
export async function retrieve(
  user: ScopeUser,
  pergunta: string,
  topK = TOP_K
): Promise<FonteRankeada[]> {
  const termos = extrairTermos(pergunta)
  if (termos.length === 0) return []

  const candidatos = await db.playbook.findMany({
    where: scopedPlaybookWhere(user, { isArchived: false }),
    select: {
      id: true,
      kind: true,
      title: true,
      body: true,
      companyId: true,
      company: { select: { name: true } },
      verifiedAt: true,
      reviewDueAt: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: MAX_CANDIDATOS,
  })

  return ranquear(candidatos as CandidatoPlaybook[], termos, topK)
}

/** Rótulo de frescor exposto na citação (contrato D8). */
export function frescorDaFonte(f: Pick<CandidatoPlaybook, 'verifiedAt' | 'reviewDueAt'>) {
  return freshnessOf({ verifiedAt: f.verifiedAt, reviewDueAt: f.reviewDueAt })
}
