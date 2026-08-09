import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from '@google/generative-ai'
import type { ScopeUser } from '@/lib/auth'
import {
  retrieve,
  frescorDaFonte,
  empresaDaFonte,
  SCORE_FRACO,
  type FonteRankeada,
} from './retrieve'
import { ANA_SYSTEM_PROMPT, montarContexto } from './ana-persona'

/**
 * Pipeline da Ana — modo interno. Spec `feature-portal-ana.md` §5–§7.
 *
 * ⚠️ NÃO reusa `src/lib/ai/` — aquilo é dead code (nenhum arquivo em `src/` importa),
 * específico de `ActivityInput → ActivityAnalysis` e travado em `gemini-1.5-*` (aposentados).
 * Ver spec-mãe C1.
 *
 * ⚠️ PROVIDER: **Gemini**, por decisão do Marcos (09/08) — a emenda D7 da spec pedia Claude.
 * O argumento da D7 continua de pé e NÃO foi refutado: o requisito nº1 da Ana é *admitir
 * quando não sabe*, que é instruction-following. A decisão foi tomada com a chave em mãos e
 * com o combinado explícito de MEDIR ("vamos ver se ele dá conta, se não tentamos outros").
 * O teste que decide isso é a pergunta fora da base — se a Ana inventar processo ali, o
 * modelo não serve, independente de custo. Trocar de modelo é só a env var `ANA_MODEL`;
 * trocar de provider é editar este arquivo.
 */

export type Aviso =
  | 'fonte_fraca'
  | 'fonte_vencida'
  | 'multi_empresa'
  | 'bloqueio_seguranca'
  | 'resposta_cortada'
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

const MODELO = process.env.ANA_MODEL || 'gemini-3.6-flash'

/** Cap de saída. O 3.6-flash pensa por padrão, e o thinking NÃO conta aqui. */
const MAX_TOKENS = 2048

export function anaConfigurada(): boolean {
  return !!process.env.GEMINI_API_KEY
}

/**
 * A Defenz é uma MSSP: os POPs falam de EDR, política de bloqueio, exclusão de arquivo,
 * console de antivírus. Trabalho BENIGNO de segurança é o falso-positivo clássico de
 * classificador — no Gemini ele cai em `DANGEROUS_CONTENT`. Afrouxamos para `BLOCK_ONLY_HIGH`
 * (o mínimo que a API concede sem allowlist) e, quando ainda assim bloquear, a UI DIZ que
 * bloqueou em vez de mostrar resposta vazia (GUIA §9.3).
 */
const SAFETY = [
  HarmCategory.HARM_CATEGORY_HARASSMENT,
  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
].map((category) => ({ category, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH }))

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
 * Pergunta → retrieve scoped → Gemini → citações validadas.
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
        'A IA Defenz ainda não está ligada: falta a `GEMINI_API_KEY` no ambiente. Os POPs e a Biblioteca continuam funcionando normalmente pela busca.',
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

  const contexto = montarContexto(
    fontes.map((f) => ({
      id: f.id,
      title: f.title,
      body: f.body,
      companyLabel: empresaDaFonte(f),
      freshness: frescorDaFonte(f),
    }))
  )

  const prompt = [
    contexto,
    // O retrieve sabe quando a evidência é fraca; contar isso ao modelo é o que
    // transforma "admita o que não sabe" de instrução genérica em decisão informada.
    avisos.includes('fonte_fraca')
      ? '\n[Nota do sistema: a busca interna teve BAIXA confiança nestas fontes — nenhuma casou a pergunta pelo título. É provável que a resposta simplesmente não exista na base. Confira antes de responder; se não responderem, diga que não sabe.]'
      : '',
    `\n\nPergunta do funcionário: ${pergunta}`,
  ].join('')

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: MODELO,
      systemInstruction: ANA_SYSTEM_PROMPT,
      safetySettings: SAFETY,
      generationConfig: { maxOutputTokens: MAX_TOKENS },
    })

    const { response } = await model.generateContent(prompt)

    // Checar o bloqueio ANTES de ler o texto: `response.text()` LANÇA quando o candidato
    // não tem parte de texto, e um throw aqui viraria erro genérico na tela.
    const blockReason = response.promptFeedback?.blockReason
    const candidato = response.candidates?.[0]
    const finish = candidato?.finishReason

    // Comparação por string, não pelo enum: o `@google/generative-ai@0.21` é antigo e o
    // enum `FinishReason` dele não conhece valores que a API já devolve hoje
    // (BLOCKLIST, PROHIBITED_CONTENT). Casar pelo enum perderia justamente os bloqueios novos.
    const BLOQUEIOS = ['SAFETY', 'BLOCKLIST', 'PROHIBITED_CONTENT', 'SPII', 'RECITATION']
    if (blockReason || BLOQUEIOS.includes(String(finish))) {
      return {
        ...base,
        avisos: [...avisos, 'bloqueio_seguranca'],
        playbookIds,
        citations: fontes.map(citacaoDe),
        answer:
          'O modelo bloqueou esta pergunta pelo filtro de segurança. Isso acontece com tema técnico de cibersegurança mesmo quando o uso é legítimo — é a Defenz falando do próprio produto. Reformule focando no processo interno, ou abra o POP direto nas fontes abaixo.',
      }
    }

    const texto = (candidato?.content?.parts ?? [])
      .map((p) => ('text' in p ? p.text : ''))
      .join('')
      .trim()

    if (!texto) {
      return {
        ...base,
        avisos,
        playbookIds,
        citations: fontes.map(citacaoDe),
        answer: `O modelo respondeu vazio (motivo: ${finish ?? 'desconhecido'}). Tente de novo ou abra os POPs abaixo direto.`,
      }
    }

    const citadas = validarCitacoes(fontes, texto)

    return {
      ...base,
      answer: texto,
      /**
       * Citações validadas contra o conjunto recuperado. Quando o modelo não citou ninguém:
       * - evidência boa → mostramos as fontes usadas, para o funcionário conferir;
       * - evidência FRACA → mostramos NADA. Listar 5 POPs embaixo de um "isso não está em
       *   nenhum POP nosso" (medido no teste do Gemini) contradiz a própria resposta e
       *   sugere relevância que não existe.
       */
      citations: citadas.length
        ? citadas
        : avisos.includes('fonte_fraca')
          ? []
          : fontes.map(citacaoDe),
      // MAX_TOKENS corta a resposta no meio — a tela precisa dizer isso, não fingir que acabou.
      avisos: finish === 'MAX_TOKENS' ? [...avisos, 'resposta_cortada'] : avisos,
      playbookIds,
    }
  } catch (e) {
    // Sem erro silencioso (GUIA §9.3): a tela diz o que houve e o que fazer.
    // Mas o corpo cru do provedor (com request_id) fica no log do servidor, não na tela.
    const detalhe = e instanceof Error ? e.message : 'erro desconhecido'
    console.error('[ana] falha ao chamar o provedor:', detalhe)

    // O SDK do Gemini expõe `status` no erro de fetch (GoogleGenerativeAIFetchError).
    const status = (e as { status?: number })?.status
    const causa =
      status === 400 || status === 401 || status === 403
        ? 'a chave do Gemini foi recusada ou não tem acesso a este modelo'
        : status === 404
          ? `o modelo "${MODELO}" não existe para esta chave`
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
