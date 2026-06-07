import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { generateApiToken } from '@/lib/api-token'
import { handleApiError, successResponse, createdResponse, ApiError } from '@/lib/api-helpers'
import { createAuditLog } from '@/lib/audit'

// Gestão de API tokens por usuário. Session-only (admin no navegador) — NÃO usa
// resolveActor/Bearer. Apenas admin pode gerar/listar/revogar, pois um token
// concede acesso à API "como" o usuário-dono (mintar é privilégio de admin).

async function requireAdmin() {
  const actor = await getCurrentUser()
  if (!actor?.id) throw new ApiError('Nao autorizado', 401)
  if (!isAdmin(actor)) throw new ApiError('Acesso restrito a administradores', 403)
  return actor
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin()
    const { id } = await params
    const tokens = await db.apiToken.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      // tokenHash NUNCA é retornado ao cliente.
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    })
    return successResponse(tokens)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin()
    const { id } = await params

    const target = await db.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    })
    if (!target) throw new ApiError('Usuario nao encontrado', 404)

    const body = await request.json().catch(() => ({}))
    const name = String(body?.name ?? '').trim()
    if (!name) throw new ApiError('Nome do token e obrigatorio', 400)

    const expiresDays = body?.expiresDays != null ? Number(body.expiresDays) : null
    const expiresAt =
      expiresDays && expiresDays > 0
        ? new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000)
        : null

    const { raw, hash, prefix } = generateApiToken()

    const token = await db.apiToken.create({
      data: {
        name,
        tokenHash: hash,
        tokenPrefix: prefix,
        userId: id,
        expiresAt,
        createdBy: actor.id,
      },
      select: {
        id: true,
        name: true,
        tokenPrefix: true,
        lastUsedAt: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
      },
    })

    await createAuditLog({
      action: 'CREATE',
      entityType: 'ApiToken',
      entityId: token.id,
      userId: actor.id,
      userEmail: actor.email || '',
      changes: {
        name: { from: null, to: name },
        forUser: { from: null, to: target.email },
      },
    })

    // `token` (plaintext) só é retornado AQUI, uma única vez.
    return createdResponse({ ...token, token: raw }, 'Token criado')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireAdmin()
    const { id } = await params
    const tokenId = new URL(request.url).searchParams.get('tokenId')
    if (!tokenId) throw new ApiError('tokenId e obrigatorio', 400)

    const token = await db.apiToken.findUnique({ where: { id: tokenId } })
    if (!token || token.userId !== id) throw new ApiError('Token nao encontrado', 404)
    if (token.revokedAt) throw new ApiError('Token ja revogado', 400)

    await db.apiToken.update({ where: { id: tokenId }, data: { revokedAt: new Date() } })

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'ApiToken',
      entityId: tokenId,
      userId: actor.id,
      userEmail: actor.email || '',
      changes: { revokedAt: { from: null, to: 'revoked' } },
    })

    return successResponse(null, 'Token revogado')
  } catch (error) {
    return handleApiError(error)
  }
}
