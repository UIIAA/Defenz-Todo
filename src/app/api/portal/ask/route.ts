import { NextRequest } from 'next/server'
import { z } from 'zod'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { checkRateLimit } from '@/lib/rate-limit'
import { perguntarAna, webHabilitado, anaConfigurada, PERGUNTA_MAX_CHARS } from '@/lib/portal/ask'

/**
 * `POST /api/portal/ask` — a Ana responde sobre a base interna. Emenda D8.
 *
 * ⚠️ SÓ SESSÃO. NÃO aceita Bearer. As outras rotas do Portal usam `resolveActor`, que
 * aceita token de serviço permanente (`marcos-mcp`, `atrio-sync`). Um token long-lived
 * somado a um LLM que lê a base inteira é exfiltração sem rastro.
 */

/** O modelo pensa por padrão; sem isto o lambda mata a request e devolve 504 sem corpo (R6). */
export const maxDuration = 120

const askSchema = z.object({
  question: z.string().trim().min(3, 'Pergunta muito curta').max(PERGUNTA_MAX_CHARS),
  mode: z.enum(['interno', 'web']).default('interno'),
})

/**
 * Capacidades do ambiente. As env vars são server-side — o cliente não adivinha, e a UI
 * precisa saber ANTES da primeira pergunta se pode oferecer o modo web.
 */
export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Não autenticado', 401)

    return successResponse({
      aiEnabled: anaConfigurada(),
      webEnabled: webHabilitado(),
      maxChars: PERGUNTA_MAX_CHARS,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Não autenticado', 401)

    // Chave POR USUÁRIO: `checkRateLimit` compõe `${key}:${ip}` — sem o id do usuário o
    // balde seria compartilhado por todo mundo atrás do mesmo NAT.
    // ⚠️ Isto NÃO é mitigação de custo (store em memória do lambda, sem teto global).
    // O teto de custo real é o limite de gasto do workspace da Anthropic.
    const limited = checkRateLimit(request, `portal-ask:${user.id}`, {
      limit: 20,
      windowMs: 5 * 60 * 1000,
    })
    if (limited) return limited

    const { question, mode } = askSchema.parse(await request.json())

    if (mode === 'web' && !webHabilitado()) {
      throw new ApiError(
        'A pesquisa na web ainda não está configurada neste ambiente.',
        400
      )
    }

    const { playbookIds, ...resposta } = await perguntarAna(user, question)

    // Regra §7.7: NÃO logar o texto da pergunta (guardar o que o funcionário perguntou é
    // vigilância). Mas logar o ACESSO — o buraco não é a pergunta, é não saber quais POPs
    // saíram para quem.
    console.info(
      '[ana] acesso',
      JSON.stringify({
        userId: user.id,
        at: new Date().toISOString(),
        mode,
        playbookIds,
        avisos: resposta.avisos,
      })
    )

    return successResponse(resposta)
  } catch (error) {
    return handleApiError(error)
  }
}
