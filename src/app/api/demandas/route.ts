import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, createdResponse, successResponse, ApiError } from '@/lib/api-helpers'
import { createDemandaSchema, updateDemandaSchema } from '@/lib/validations/demanda'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Não autorizado', 401)

    const demandas = await db.demanda.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse(demandas)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Não autorizado', 401)

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

    return createdResponse(demanda, 'Demanda criada com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Não autorizado', 401)

    const body = await request.json()
    const { id, updatedAt, ...data } = updateDemandaSchema.parse(body)

    // Optimistic locking: check updatedAt if provided
    if (updatedAt) {
      const current = await db.demanda.findUnique({
        where: { id, userId: user.id },
      })

      if (!current) throw new ApiError('Recurso não encontrado', 404)

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
      where: { id, userId: user.id },
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
      },
    })

    return successResponse(demanda, 'Demanda atualizada')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Não autorizado', 401)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) throw new ApiError('ID é obrigatório', 400)

    await db.demanda.delete({
      where: { id, userId: user.id },
    })

    return successResponse(null, 'Demanda excluída')
  } catch (error) {
    return handleApiError(error)
  }
}
