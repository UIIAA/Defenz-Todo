import crypto from 'crypto'
import type { NextRequest } from 'next/server'

/**
 * Helpers puros do API Service Token (Bearer). Sem dependência de next-auth/db,
 * para poder ser importado tanto pelas rotas/`auth.ts` quanto por scripts CLI.
 */

/** Formato do token: `defz_` + 56 hex chars (28 bytes aleatórios = 224 bits). */
export const API_TOKEN_FORMAT = /^defz_[0-9a-f]{56}$/

/** SHA-256 (hex) do token plaintext. Armazenado em ApiToken.tokenHash. */
export function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

/** Gera um novo token: plaintext + hash + prefixo visível (`defz_` + 8 chars). */
export function generateApiToken(): { raw: string; hash: string; prefix: string } {
  const raw = 'defz_' + crypto.randomBytes(28).toString('hex')
  return { raw, hash: hashToken(raw), prefix: raw.slice(0, 13) }
}

/** Extrai o token de um header `Authorization: Bearer <token>`, ou null. */
export function extractBearerToken(request: NextRequest): string | null {
  const header = request.headers.get('authorization')
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}
