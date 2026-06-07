/**
 * Carrega e valida a configuração do servidor a partir do ambiente.
 * Mantido puro (recebe `env`) para ser testável e reaproveitável.
 */

/** Formato do token (espelha src/lib/api-token.ts do app). */
const TOKEN_FORMAT = /^defz_[0-9a-f]{56}$/

export interface ServerConfig {
  baseUrl: string
  token: string
  timeoutMs: number
}

const DEFAULT_TIMEOUT_MS = 30000

export function loadConfig(env: Record<string, string | undefined>): ServerConfig {
  const baseUrl = env.DEFENZ_API_URL?.trim()
  const token = env.DEFENZ_API_TOKEN?.trim()

  if (!baseUrl) {
    throw new Error(
      'Configuração ausente: DEFENZ_API_URL não definida. ' +
        'Ex.: DEFENZ_API_URL=https://defenz-todo.vercel.app'
    )
  }
  if (!token) {
    throw new Error(
      'Configuração ausente: DEFENZ_API_TOKEN não definida. ' +
        'Gere um token na UI (Configurações → Usuários → 🔑) ou via scripts/create-api-token.ts.'
    )
  }
  if (!TOKEN_FORMAT.test(token)) {
    throw new Error(
      'DEFENZ_API_TOKEN inválido: o token deve ter o formato "defz_" seguido de 56 caracteres hexadecimais.'
    )
  }

  const rawTimeout = env.DEFENZ_API_TIMEOUT_MS
  const parsed = rawTimeout ? Number(rawTimeout) : NaN
  const timeoutMs = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_TIMEOUT_MS

  return { baseUrl, token, timeoutMs }
}
