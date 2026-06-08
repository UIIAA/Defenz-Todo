import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, assertCompanyAccess } from '@/lib/auth'
import { handleApiError, createdResponse, ApiError } from '@/lib/api-helpers'
import { createSubtaskSchema } from '@/lib/validations/subtask'
import { createAuditLog } from '@/lib/audit'
import { logTimeDelta } from '@/lib/time-entries-server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await resolveActor(request)
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const { id: demandaId } = await params

    const demanda = await db.demanda.findUnique({ where: { id: demandaId } })
    if (!demanda) throw new ApiError('Demanda nao encontrada', 404)

    assertCompanyAccess(demanda.companyId, user)

    const body = await request.json()
    const data = createSubtaskSchema.parse(body)

    // Get max position
    const maxPos = await db.subtask.findFirst({
      where: { demandaId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })

    const subtask = await db.subtask.create({
      data: {
        title: data.title,
        position: data.position ?? (maxPos ? maxPos.position + 1 : 0),
        estimatedMinutes: data.estimatedMinutes ?? null,
        spentMinutes: data.spentMinutes ?? 0,
        demandaId,
      },
    })

    await createAuditLog({
      action: 'CREATE',
      entityType: 'Subtask',
      entityId: subtask.id,
      userId: user.id,
      userEmail: user.email || '',
      changes: { title: { from: null, to: subtask.title }, demandaId: { from: null, to: demandaId } },
    })

    // Diário de horas: subtarefa criada com horas → delta positivo (atribuído ao Responsável do card pai)
    if ((subtask.spentMinutes ?? 0) !== 0) {
      await logTimeDelta({
        demanda: {
          id: demandaId,
          assignedToId: demanda.assignedToId,
          assignee: demanda.assignee,
          client: demanda.client,
        },
        delta: subtask.spentMinutes ?? 0,
        source: 'subtask',
        subtaskId: subtask.id,
        actor: { id: user.id, name: user.name, email: user.email },
      })
    }

    return createdResponse(subtask, 'Subtask criada')
  } catch (error) {
    return handleApiError(error)
  }
}
