import { getServerSession } from 'next-auth'
import type { NextRequest } from 'next/server'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'
import { ApiError } from '@/lib/api-helpers'
import { hashToken, extractBearerToken, API_TOKEN_FORMAT } from '@/lib/api-token'

// Re-export p/ compat: callers/tests importam estes de '@/lib/auth'.
export { hashToken, extractBearerToken } from '@/lib/api-token'

export type SessionUser = {
  id: string
  role: string
  companyId?: string
  companyIds?: string[]
  companyName?: string
  companyLogoUrl?: string
  companyAccentColor?: string
  teamIds?: string[]
  department?: string
  name?: string | null
  email?: string | null
  image?: string | null
}

export type ScopeUser = Pick<SessionUser, 'role' | 'companyId' | 'companyIds'>

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function getCurrentUser() {
  const session = await getSession()
  return session?.user
}

export async function requireAuth() {
  const user = await getCurrentUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return user
}

export function isAdmin(user: Pick<SessionUser, 'role'>): boolean {
  return user.role === 'admin'
}

/**
 * Conjunto de empresas que o usuário pode acessar.
 * - admin → `null` (sentinela: sem restrição, vê tudo).
 * - demais → dedup de `[companyId primária, ...companyIds adicionais]`, sem falsy.
 *
 * O primário SEMPRE entra no conjunto: usuário single-company (sem `companyIds`)
 * continua restrito à própria empresa (backward-compat total).
 */
export function accessibleCompanyIds(user: ScopeUser): string[] | null {
  if (isAdmin(user)) return null
  const ids = [user.companyId, ...(user.companyIds ?? [])].filter(
    (id): id is string => !!id
  )
  return Array.from(new Set(ids))
}

/**
 * Garante que `entityCompanyId` pertence ao conjunto acessível do usuário.
 * Admin passa sempre. Lança ApiError 403 caso contrário.
 */
export function assertCompanyAccess(
  entityCompanyId: string | null | undefined,
  user: ScopeUser
): void {
  const ids = accessibleCompanyIds(user)
  if (ids === null) return // admin
  if (!entityCompanyId || !ids.includes(entityCompanyId)) {
    throw new ApiError('Acesso negado: recurso de outra empresa', 403, {
      code: 'FORBIDDEN_COMPANY',
    })
  }
}

/**
 * Filtro Prisma `where` por escopo de empresa.
 * - admin → `{}` (sem filtro).
 * - conjunto vazio → `{ companyId: '__none__' }` (bloqueia tudo).
 * - conjunto unitário → `{ companyId: 'x' }` (scalar, backward-compat).
 * - conjunto múltiplo → `{ companyId: { in: [...] } }`.
 */
export function companyScopeWhere(
  user: ScopeUser
): { companyId?: string | { in: string[] } } {
  const ids = accessibleCompanyIds(user)
  if (ids === null) return {} // admin
  if (ids.length === 0) return { companyId: '__none__' }
  if (ids.length === 1) return { companyId: ids[0] }
  return { companyId: { in: ids } }
}

/**
 * Resolve em qual empresa uma criação (POST demanda/import/team/invite) será gravada.
 * - admin: usa `requested` se fornecido, senão a primária, senão null (cross-company livre).
 * - demais: `requested` precisa estar no conjunto acessível (senão 403); se omitido,
 *   usa a empresa primária.
 */
export function resolveActiveCompany(
  user: ScopeUser,
  requestedCompanyId?: string | null
): string | null {
  if (isAdmin(user)) {
    return requestedCompanyId ?? user.companyId ?? null
  }
  const ids = accessibleCompanyIds(user) ?? []
  if (requestedCompanyId) {
    if (!ids.includes(requestedCompanyId)) {
      throw new ApiError('Empresa fora do seu escopo', 403, {
        code: 'FORBIDDEN_COMPANY',
      })
    }
    return requestedCompanyId
  }
  return user.companyId ?? null
}

// ============================================================
// API SERVICE TOKEN (Bearer) — resolveActor (Solução A)
// ============================================================

/**
 * Resolve o "ator" de uma request, suportando dois caminhos de auth:
 *  - Bearer token de serviço (máquina-a-máquina): lookup por hash → SessionUser
 *    do usuário dono do token (herda role + empresas + teams).
 *  - Sessão NextAuth (navegador): usado como fallback quando NÃO há header
 *    Authorization. Se o header existe mas é inválido → 401 (sem fallback silencioso).
 *
 * Sempre retorna um SessionUser; lança ApiError 401 quando não há auth válida.
 */
export async function resolveActor(request: NextRequest): Promise<SessionUser> {
  const raw = extractBearerToken(request)

  // Sem header Authorization → caminho de sessão (UI).
  if (raw === null) {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)
    return user
  }

  // Header presente → DEVE ser um Bearer válido (nunca cai para sessão).
  if (!API_TOKEN_FORMAT.test(raw)) {
    throw new ApiError('Nao autorizado', 401)
  }

  const apiToken = await db.apiToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: {
      user: {
        include: {
          company: { select: { id: true, name: true, logoUrl: true, accentColor: true } },
          teams: { select: { team: { select: { id: true } } } },
          userCompanies: { select: { companyId: true } },
        },
      },
    },
  })

  const expired = !!apiToken?.expiresAt && apiToken.expiresAt <= new Date()
  if (!apiToken || apiToken.revokedAt || expired) {
    throw new ApiError('Nao autorizado', 401)
  }

  // Auditoria de uso — fire-and-forget (não bloqueia nem falha a request).
  db.apiToken
    .update({ where: { id: apiToken.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {})

  const u = apiToken.user
  return {
    id: u.id,
    role: u.role,
    companyId: u.company?.id,
    companyIds: u.userCompanies.map((uc) => uc.companyId),
    companyName: u.company?.name,
    companyLogoUrl: u.company?.logoUrl || undefined,
    companyAccentColor: u.company?.accentColor || undefined,
    teamIds: u.teams.map((ut) => ut.team.id),
    department: u.department || undefined,
    name: u.name,
    email: u.email,
  }
}
