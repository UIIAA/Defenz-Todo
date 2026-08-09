import Anthropic from '@anthropic-ai/sdk'
import type { ScopeUser } from '@/lib/auth'
import {
  retrieve,
  frescorDaFonte,
  empresaDaFonte,
  SCORE_FRACO,
  type FonteRankeada,
} from './retrieve'
import { ANA_SYSTEM_PROMPT, montarContexto, cortarContexto } from './ana-persona'

/**
 * Pipeline da Ana — modo interno. Spec `feature-portal-ana.md` §5–§7.
 *
 * ⚠️ NÃO reusa `src/lib/ai/` — aquilo é dead code (nenhum arquivo em `src/` importa),
 * específico de `ActivityInput → ActivityAnalysis` e travado em `gemini-1.5-*` (aposentados).
 * Ver spec-mãe C1.
 *
 * Emenda D7: a Ana usa Claude, não Gemini. O requisito central é *admitir quando não sabe*
 * e *citar a fonte* — instruction-following, onde errar é caro. O Gemini segue no relatório
 * executivo, intocado.
 */

export type Aviso =
  | 'fonte_fraca'
  | 'fonte_vencida'
  | 'multi_empresa'
  | 'fallback_usado'
  | 'sem_chave'

export interface Citacao {
  id: string
  title: string
  companyLabel: string
  freshness: string
}

export interface RespostaAna {
  answer: string
  citations: Citacao[]
  sources: { url: string; title: string }[]
  webEnabled: boolean
  avisos: Aviso[]
}

/** Cap duro da spec-mãe §5. Validado também no Zod da rota. */
export const PERGUNTA_MAX_CHARS = 500

const MODELO = process.env.ANA_MODEL || 'claude-opus-5'
const EFFORT = (process.env.ANA_EFFORT || 'high') as 'low' | 'medium' | 'high' | 'xhigh' | 'max'

/**
 * `max_tokens` limita PENSAMENTO + RESPOSTA juntos no claude-opus-5 (thinking é ligado por
 * padrão). Apertar isto trunca a resposta no meio de uma frase.
 */
const MAX_TOKENS = 8000

export function anaConfigurada(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

/** Modo web só existe quando o webhook do n8n estiver configurado (F5). */
export function webHabilitado(): boolean {
  return !!process.env.N8N_PORTAL_WEB_WEBHOOK_URL
}

function citacaoDe(f: FonteRankeada): Citacao {
  return {
    id: f.id,
    title: f.title,
    companyLabel: empresaDaFonte(f),
    freshness: frescorDaFonte(f),
  }
}

/**
 * Calcula os avisos a partir do conjunto RECUPERADO (não do texto do modelo).
 * `avisos[]` é enum fechado — na v1 da spec o campo existia sem definição.
 */
export function calcularAvisos(fontes: FonteRankeada[]): Aviso[] {
  const avisos: Aviso[] = []
  if (fontes.length === 0) return avisos

  const melhor = Math.max(...fontes.map((f) => f.score))

  /**
   * ⚠️ Medido contra o corpus real (09/08), não suposto: o score absoluto NÃO separa
   * pergunta-dentro-da-base de pergunta-fora-da-base. "qual o plano de saúde que a empresa
   * oferece?" — que não tem resposta em POP nenhum — tirou score 15, porque "plano",
   * "empresa" e "oferece" são palavras genéricas que aparecem em qualquer texto de processo.
   * Cobertura de termos também não separa (uma pergunta legítima teve 1/3 e uma ilegítima 3/4).
   *
   * O que separou, em 8 de 8 perguntas: TERMO NO TÍTULO. Nenhuma pergunta fora da base
   * casou título; todas as de dentro casaram. Por isso o sinal de confiança é esse, e o
   * limiar de score da spec (§4 passo 5) fica só como gatilho adicional.
   *
   * Isto NÃO é um portão: o retrieve continua entregando as fontes e quem decide "não sei"
   * é a Ana — é exatamente para isso que a D7 escolheu Claude em vez de Gemini.
   */
  const semTitulo = fontes.every((f) => f.termosNoTitulo === 0)
  if (semTitulo || melhor < SCORE_FRACO) avisos.push('fonte_fraca')

  if (fontes.some((f) => frescorDaFonte(f) === 'precisa_revisao')) avisos.push('fonte_vencida')

  // Set cruzando empresas → a Ana pode misturar processo de clientes diferentes.
  const empresas = new Set(fontes.map((f) => f.companyId ?? '__global__'))
  const naoGlobais = new Set(fontes.map((f) => f.companyId).filter((id) => id !== null))
  if (naoGlobais.size > 1 || (naoGlobais.size >= 1 && empresas.size > 1)) {
    avisos.push('multi_empresa')
  }

  return avisos
}

/**
 * Descarta qualquer citação que o modelo tenha produzido fora do conjunto recuperado.
 * Impede FORJAR fonte.
 *
 * ⚠️ Não impede um POP com texto injetado fazer a Ana emitir procedimento errado citando
 * CORRETAMENTE o POP que carrega a injeção (R4). Mitigação: os trechos entram delimitados
 * e marcados como dados em `montarContexto`, e a `answer` é renderizada como texto puro.
 */
export function validarCitacoes(fontes: FonteRankeada[], resposta: string): Citacao[] {
  return fontes.filter((f) => resposta.includes(f.title)).map(citacaoDe)
}

/**
 * Pergunta → retrieve scoped → Claude → citações validadas.
 *
 * Nunca lança por erro do provedor: devolve `answer` explicando. Erro silencioso na UI é
 * proibido pela §9.3 do GUIA, e um 500 sem corpo é exatamente isso.
 */
export async function perguntarAna(
  user: ScopeUser,
  pergunta: string
): Promise<RespostaAna & { playbookIds: string[] }> {
  const base: Omit<RespostaAna, 'answer'> & { playbookIds: string[] } = {
    citations: [],
    sources: [],
    webEnabled: webHabilitado(),
    avisos: [],
    playbookIds: [],
  }

  if (!anaConfigurada()) {
    return {
      ...base,
      avisos: ['sem_chave'],
      answer:
        'A IA Defenz ainda não está ligada: falta a chave da Anthropic (`ANTHROPIC_API_KEY`) no ambiente. Os POPs e a Biblioteca continuam funcionando normalmente pela busca.',
    }
  }

  const fontes = await retrieve(user, pergunta)

  // Sem fonte, sem resposta (regra dura §7.4). O ramo mais importante da feature.
  if (fontes.length === 0) {
    return {
      ...base,
      answer:
        'Não encontrei nada sobre isso nos POPs e materiais da Defenz. Não vou responder de memória — se esse processo existe, ele ainda não está escrito. Vale perguntar para quem executa e transformar a resposta num POP.',
    }
  }

  const avisos = calcularAvisos(fontes)
  const playbookIds = fontes.map((f) => f.id)

  const contexto = cortarContexto(
    montarContexto(
      fontes.map((f) => ({
        id: f.id,
        title: f.title,
        body: f.body,
        companyLabel: empresaDaFonte(f),
        freshness: frescorDaFonte(f),
      }))
    )
  )

  const client = new Anthropic()

  try {
    // Streaming interno + `maxDuration` na rota: sem isso, um modelo que pensa por padrão
    // com effort alto estoura o timeout HTTP e devolve 504 sem corpo (R6).
    const stream = client.beta.messages.stream({
      model: MODELO,
      max_tokens: MAX_TOKENS,
      output_config: { effort: EFFORT },
      system: ANA_SYSTEM_PROMPT,
      // A Defenz é uma empresa de cibersegurança e o claude-opus-5 tem salvaguardas de
      // cyber elevadas: trabalho BENIGNO de segurança é o falso-positivo documentado (R2).
      // `fallbacks: "default"` reencaminha recusa de categoria cyber server-side.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages: [
        {
          role: 'user',
          content: [
            contexto,
            // O retrieve sabe quando a evidência é fraca; contar isso ao modelo é o que
            // transforma "admita o que não sabe" de instrução genérica em decisão informada.
            avisos.includes('fonte_fraca')
              ? '\n[Nota do sistema: a busca interna teve BAIXA confiança nestas fontes — nenhuma casou a pergunta pelo título. É provável que a resposta simplesmente não exista na base. Confira antes de responder; se não responderem, diga que não sabe.]'
              : '',
            `\n\nPergunta do funcionário: ${pergunta}`,
          ].join(''),
        },
      ],
    })

    const msg = await stream.finalMessage()

    // Checar `stop_reason` ANTES de ler `content` — numa recusa o content vem vazio.
    if (msg.stop_reason === 'refusal') {
      return {
        ...base,
        avisos: [...avisos, 'fallback_usado'],
        playbookIds,
        citations: fontes.map(citacaoDe),
        answer:
          'O modelo recusou responder a esta pergunta (classificador de segurança). Isso costuma acontecer com temas técnicos de cibersegurança mesmo quando o uso é legítimo. Tente reformular focando no processo interno, ou abra o POP diretamente nas fontes abaixo.',
      }
    }

    const texto = msg.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()

    if (!texto) {
      return {
        ...base,
        avisos,
        playbookIds,
        citations: fontes.map(citacaoDe),
        answer: 'O modelo respondeu vazio. Tente de novo ou abra os POPs abaixo direto.',
      }
    }

    const usouFallback = (msg.usage?.iterations ?? []).some(
      (it: { type?: string }) => it.type === 'fallback_message'
    )

    return {
      ...base,
      answer: texto,
      // Citações validadas contra o conjunto recuperado; se o modelo não citou ninguém
      // explicitamente, devolvemos as fontes usadas para o funcionário conferir.
      citations: validarCitacoes(fontes, texto).length
        ? validarCitacoes(fontes, texto)
        : fontes.map(citacaoDe),
      avisos: usouFallback ? [...avisos, 'fallback_usado'] : avisos,
      playbookIds,
    }
  } catch (e) {
    // Sem erro silencioso (GUIA §9.3): a tela diz o que houve e o que fazer.
    // Mas o corpo cru do provedor (com request_id) fica no log do servidor, não na tela.
    const detalhe = e instanceof Error ? e.message : 'erro desconhecido'
    console.error('[ana] falha ao chamar o provedor:', detalhe)

    const status = (e as { status?: number })?.status
    const causa =
      status === 401
        ? 'a chave da Anthropic foi recusada'
        : status === 429
          ? 'o limite de uso da chave foi atingido'
          : status && status >= 500
            ? 'o provedor está fora do ar'
            : 'houve uma falha na chamada'

    return {
      ...base,
      avisos,
      playbookIds,
      citations: fontes.map(citacaoDe),
      answer: `Não consegui falar com o modelo agora — ${causa}. Os POPs relevantes estão listados abaixo e dá para abrir direto. (Detalhe técnico no log do servidor.)`,
    }
  }
}
