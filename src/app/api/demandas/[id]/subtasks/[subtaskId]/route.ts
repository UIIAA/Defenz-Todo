import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, assertCompanyAccess } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { updateSubtaskSchema } from '@/lib/validations/subtask'
import { createAuditLog } from '@/lib/audit'

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
      include: { demanda: { select: { companyId: true } } },
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
      include: { demanda: { select: { companyId: true } } },
    })
    if (!existing) throw new ApiError('Subtask nao encontrada', 404)

    assertCompanyAccess(existing.demanda.companyId, user)

    await db.subtask.delete({ where: { id: subtaskId } })

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
