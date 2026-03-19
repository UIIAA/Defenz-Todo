import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, createdResponse, ApiError } from '@/lib/api-helpers'
import { createSubtaskSchema } from '@/lib/validations/subtask'
import { createAuditLog } from '@/lib/audit'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const { id: demandaId } = await params

    const demanda = await db.demanda.findUnique({ where: { id: demandaId } })
    if (!demanda) throw new ApiError('Demanda nao encontrada', 404)

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

    return createdResponse(subtask, 'Subtask criada')
  } catch (error) {
    return handleApiError(error)
  }
}
