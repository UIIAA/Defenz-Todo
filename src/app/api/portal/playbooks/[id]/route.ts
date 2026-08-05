import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, isAdmin, assertCompanyAccess, type ScopeUser } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { scopedPlaybookWhere } from '@/lib/playbook-scope'
import { updatePlaybookSchema, assertKindInvariant } from '@/lib/validations/playbook'
import { createAuditLog, diffChanges } from '@/lib/audit'

type Ctx = { params: Promise<{ id: string }> }

type Actor = ScopeUser & { id: string; email?: string | null }

/**
 * Carrega o playbook JÁ escopado: fora do escopo do ator, o item simplesmente
 * não existe (404, não 403 — não revela a existência de conteúdo de outra empresa).
 */
async function loadScoped(request: NextRequest, id: string) {
  const user = (await resolveActor(request)) as Actor
  const playbook = await db.playbook.findFirst({
    where: scopedPlaybookWhere(user, { id }),
  })
  if (!playbook) throw new ApiError('Playbook não encontrado', 404)
  return { user, playbook }
}

/** Admin edita tudo; gerência só a própria empresa; `user` só lê. */
function assertCanWrite(actor: Actor, playbook: { companyId: string | null }): void {
  if (isAdmin(actor)) return
  if (playbook.companyId === null) {
    throw new ApiError('Só admin edita conteúdo global', 403)
  }
  if (actor.role !== 'gerencia') {
    throw new ApiError('Sem permissão para editar', 403)
  }
  assertCompanyAccess(playbook.companyId, actor)
}

export async function GET(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const { playbook } = await loadScoped(request, id)
    return successResponse(playbook)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const { user, playbook } = await loadScoped(request, id)
    assertCanWrite(user, playbook)

    const payload = updatePlaybookSchema.parse(await request.json())
    // Invariante de kind sobre o ESTADO MERGEADO, não sobre o payload.
    assertKindInvariant(playbook, payload)

    const data: Record<string, unknown> = { ...payload }
    // O badge VERIFICADO não pode mentir: editou sem ser o dono → des-verifica.
    if (playbook.ownerId && playbook.ownerId !== user.id) {
      data.verifiedAt = null
    }

    const updated = await db.playbook.update({ where: { id }, data })

    // diffChanges recebe SÓ as chaves presentes no payload: em PUT parcial, campo
    // ausente significa "não mexa" e não pode ser logado como `→ null` (GUIA §9.6).
    const changes = diffChanges(
      playbook as unknown as Record<string, unknown>,
      updated as unknown as Record<string, unknown>,
      Object.keys(payload)
    )

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Playbook',
      entityId: id,
      userId: user.id,
      userEmail: user.email ?? '',
      changes,
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}

/** Arquiva (soft delete). Nunca apaga a linha — runbook não se destrói por clique. */
export async function DELETE(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const { user, playbook } = await loadScoped(request, id)
    assertCanWrite(user, playbook)

    const updated = await db.playbook.update({
      where: { id },
      data: { isArchived: true },
    })

    await createAuditLog({
      action: 'DELETE',
      entityType: 'Playbook',
      entityId: id,
      userId: user.id,
      userEmail: user.email ?? '',
      changes: { isArchived: { from: false, to: true } },
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
