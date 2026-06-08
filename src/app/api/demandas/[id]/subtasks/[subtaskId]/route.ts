import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, assertCompanyAccess } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { updateSubtaskSchema } from '@/lib/validations/subtask'
import { createAuditLog } from '@/lib/audit'
import { logTimeDelta } from '@/lib/time-entries-server'

// Campos do card pai necessários para atribuir o lançamento do diário de horas.
// NB: o findFirst da subtarefa NÃO usa `select` próprio de propósito — assim todos os
// escalares da subtarefa (inclusive `spentMinutes`, usado p/ calcular o delta) são carregados.
const PARENT_TIME_SELECT = { companyId: true, assignedToId: true, assignee: true, client: true } as const

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const user = await resolveActor(request)
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const { id: demandaId, subtaskId } = await params

    const existing = await db.subtask.findFirst({
      where: { id: subtaskId, demandaId },
      include: { demanda: { select: PARENT_TIME_SELECT } },
    })
    if (!existing) throw new ApiError('Subtask nao encontrada', 404)

    assertCompanyAccess(existing.demanda.companyId, user)

    const body = await request.json()
    const data = updateSubtaskSchema.parse(body)

    const subtask = await db.subtask.update({
      where: { id: subtaskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.completed !== undefined && { completed: data.completed }),
        ...(data.position !== undefined && { position: data.position }),
        ...(data.estimatedMinutes !== undefined && { estimatedMinutes: data.estimatedMinutes }),
        ...(data.spentMinutes !== undefined && { spentMinutes: data.spentMinutes }),
      },
    })

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Subtask',
      entityId: subtask.id,
      userId: user.id,
      userEmail: user.email || '',
      changes: {
        ...(data.completed !== undefined && { completed: { from: existing.completed, to: data.completed } }),
        ...(data.title !== undefined && { title: { from: existing.title, to: data.title } }),
      },
    })

    // Diário de horas: delta do spentMinutes da subtarefa (atribuído ao Responsável do card pai)
    if (data.spentMinutes !== undefined && data.spentMinutes !== existing.spentMinutes) {
      await logTimeDelta({
        demanda: {
          id: demandaId,
          assignedToId: existing.demanda.assignedToId,
          assignee: existing.demanda.assignee,
          client: existing.demanda.client,
        },
        delta: data.spentMinutes - existing.spentMinutes,
        source: 'subtask',
        subtaskId,
        actor: { id: user.id, name: user.name, email: user.email },
      })
    }

    return successResponse(subtask, 'Subtask atualizada')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subtaskId: string }> }
) {
  try {
    const user = await resolveActor(request)
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const { id: demandaId, subtaskId } = await params

    const existing = await db.subtask.findFirst({
      where: { id: subtaskId, demandaId },
      include: { demanda: { select: PARENT_TIME_SELECT } },
    })
    if (!existing) throw new ApiError('Subtask nao encontrada', 404)

    assertCompanyAccess(existing.demanda.companyId, user)

    await db.subtask.delete({ where: { id: subtaskId } })

    // Diário de horas: subtarefa excluída com horas → delta negativo (o total do card fecha)
    if ((existing.spentMinutes ?? 0) !== 0) {
      await logTimeDelta({
        demanda: {
          id: demandaId,
          assignedToId: existing.demanda.assignedToId,
          assignee: existing.demanda.assignee,
          client: existing.demanda.client,
        },
        delta: -(existing.spentMinutes ?? 0),
        source: 'subtask',
        subtaskId,
        actor: { id: user.id, name: user.name, email: user.email },
      })
    }

    await createAuditLog({
      action: 'DELETE',
      entityType: 'Subtask',
      entityId: subtaskId,
      userId: user.id,
      userEmail: user.email || '',
      changes: { title: { from: existing.title, to: null } },
    })

    return successResponse(null, 'Subtask excluida')
  } catch (error) {
    return handleApiError(error)
  }
}
