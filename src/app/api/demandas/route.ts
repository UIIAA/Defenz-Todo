import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, createdResponse, successResponse, ApiError } from '@/lib/api-helpers'
import { createDemandaSchema, updateDemandaSchema } from '@/lib/validations/demanda'
import { createAuditLog, diffChanges } from '@/lib/audit'

const TRACKED_FIELDS = ['title', 'description', 'origin', 'status', 'priority', 'assignee', 'deadline', 'dateDone']

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    // Board compartilhado — retorna todas as demandas da equipe
    const demandas = await db.demanda.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
      },
    })

    return successResponse(demandas)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const body = await request.json()
    const data = createDemandaSchema.parse(body)

    const demanda = await db.demanda.create({
      data: {
        title: data.title,
        description: data.description,
        origin: data.origin,
        status: data.status,
        priority: data.priority,
        assignee: data.assignee || null,
        dateIn: data.dateIn ? new Date(data.dateIn) : new Date(),
        deadline: data.deadline ? new Date(data.deadline) : null,
        dateDone: data.dateDone ? new Date(data.dateDone) : null,
        userId: user.id,
      },
    })

    await createAuditLog({
      action: 'CREATE',
      entityType: 'Demanda',
      entityId: demanda.id,
      userId: user.id,
      userEmail: user.email || '',
      changes: { title: { from: null, to: demanda.title } },
    })

    return createdResponse(demanda, 'Demanda criada com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const body = await request.json()
    const { id, updatedAt, ...data } = updateDemandaSchema.parse(body)

    // Board colaborativo — qualquer usuario pode editar qualquer demanda
    const current = await db.demanda.findUnique({
      where: { id },
    })

    if (!current) throw new ApiError('Recurso nao encontrado', 404)

    // Optimistic locking via updatedAt
    if (updatedAt) {
      const clientDate = new Date(updatedAt).getTime()
      const dbDate = current.updatedAt.getTime()

      if (clientDate !== dbDate) {
        return NextResponse.json(
          { success: false, error: 'Conflito de versao', data: current },
          { status: 409 }
        )
      }
    }

    const demanda = await db.demanda.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.origin !== undefined && { origin: data.origin }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.assignee !== undefined && { assignee: data.assignee || null }),
        ...(data.dateIn !== undefined && { dateIn: new Date(data.dateIn) }),
        ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
        ...(data.dateDone !== undefined && { dateDone: data.dateDone ? new Date(data.dateDone) : null }),
        version: { increment: 1 },
      },
    })

    const changes = diffChanges(
      current as unknown as Record<string, unknown>,
      data as unknown as Record<string, unknown>,
      TRACKED_FIELDS
    )

    if (changes) {
      await createAuditLog({
        action: 'UPDATE',
        entityType: 'Demanda',
        entityId: demanda.id,
        userId: user.id,
        userEmail: user.email || '',
        changes,
      })
    }

    return successResponse(demanda, 'Demanda atualizada')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) throw new ApiError('ID e obrigatorio', 400)

    // Board colaborativo — qualquer usuario pode excluir
    const demanda = await db.demanda.findUnique({
      where: { id },
    })

    if (!demanda) throw new ApiError('Recurso nao encontrado', 404)

    await db.demanda.delete({
      where: { id },
    })

    await createAuditLog({
      action: 'DELETE',
      entityType: 'Demanda',
      entityId: id,
      userId: user.id,
      userEmail: user.email || '',
      changes: { title: { from: demanda.title, to: null } },
    })

    return successResponse(null, 'Demanda excluida')
  } catch (error) {
    return handleApiError(error)
  }
}
