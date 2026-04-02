import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, createdResponse, successResponse, ApiError } from '@/lib/api-helpers'
import { createDemandaSchema, updateDemandaSchema } from '@/lib/validations/demanda'
import { createAuditLog, diffChanges } from '@/lib/audit'

const TRACKED_FIELDS = ['title', 'description', 'origin', 'status', 'priority', 'classification', 'assignee', 'deadline', 'dateDone', 'dateStarted', 'reminderDate']

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    const params = new URL(request.url).searchParams
    const companyFilter = params.get('companyId')
    const teamFilter = params.get('teamId')

    const where: Record<string, unknown> = {}

    if (user.role === 'admin') {
      // Admin: vê tudo, com filtros opcionais
      if (companyFilter && companyFilter !== 'all') {
        where.companyId = companyFilter
      }
      if (teamFilter && teamFilter !== 'all') {
        where.teamId = teamFilter
      }
    } else if (user.role === 'gerencia') {
      // Gerencia: vê tudo da sua empresa
      where.companyId = user.companyId
      if (teamFilter && teamFilter !== 'all') {
        where.teamId = teamFilter
      }
    } else {
      // User: vê apenas demandas das suas equipes
      const teamIds = user.teamIds || []
      if (teamIds.length > 0) {
        if (teamFilter && teamFilter !== 'all' && teamIds.includes(teamFilter)) {
          where.teamId = teamFilter
        } else {
          where.teamId = { in: teamIds }
        }
      } else {
        // User sem equipe: não vê nada
        return successResponse([])
      }
    }

    const demandas = await db.demanda.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        subtasks: { orderBy: { position: 'asc' } },
        links: { orderBy: { position: 'asc' } },
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

    // activeTeamId vem do body (equipe ativa selecionada na UI)
    const activeTeamId = body.teamId || (user.teamIds && user.teamIds.length === 1 ? user.teamIds[0] : null)

    const demanda = await db.demanda.create({
      data: {
        title: data.title,
        description: data.description,
        origin: data.origin,
        status: data.status,
        priority: data.priority,
        classification: data.classification || null,
        assignee: data.assignee || null,
        dateIn: data.dateIn ? new Date(data.dateIn) : new Date(),
        dateStarted: data.status === 'em_andamento' ? new Date() : null,
        deadline: data.deadline ? new Date(data.deadline) : null,
        dateDone: data.dateDone ? new Date(data.dateDone) : null,
        userId: user.id,
        companyId: user.companyId || null,
        teamId: activeTeamId || null,
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

    const current = await db.demanda.findUnique({
      where: { id },
    })

    if (!current) throw new ApiError('Recurso nao encontrado', 404)

    // Authorization: 3 níveis
    if (user.role === 'admin') {
      // Admin: pode tudo
    } else if (user.role === 'gerencia') {
      // Gerencia: só demandas da sua empresa
      if (current.companyId !== user.companyId) {
        throw new ApiError('Sem permissao', 403)
      }
    } else {
      // User: só demandas das suas equipes
      const teamIds = user.teamIds || []
      if (!current.teamId || !teamIds.includes(current.teamId)) {
        throw new ApiError('Sem permissao', 403)
      }
    }

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

    // Handle previousStatus for bloqueada lane
    const previousStatusUpdate: Record<string, unknown> = {}
    if (data.status !== undefined && data.status !== current.status) {
      if (data.status === 'bloqueada') {
        // Moving to bloqueada: save where it came from
        previousStatusUpdate.previousStatus = current.status
      } else if (current.status === 'bloqueada') {
        // Unblocking: clear previousStatus
        previousStatusUpdate.previousStatus = null
      }
    }

    // Lifecycle dates: dateStarted + reopen logic
    const lifecycleUpdate: Record<string, unknown> = {}

    if (data.status === 'em_andamento' && current.dateStarted === null) {
      lifecycleUpdate.dateStarted = new Date()
    }

    if (current.status === 'concluida' && data.status && data.status !== 'concluida') {
      lifecycleUpdate.dateDone = null
      const dateStr = new Date().toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric'
      })
      lifecycleUpdate.description = (current.description || '') + `\n\n* Reaberta em ${dateStr}`
    }

    const demanda = await db.demanda.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && !lifecycleUpdate.description && { description: data.description }),
        ...(data.origin !== undefined && { origin: data.origin }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.priority !== undefined && { priority: data.priority }),
        ...(data.classification !== undefined && { classification: data.classification || null }),
        ...(data.assignee !== undefined && { assignee: data.assignee || null }),
        ...(data.dateIn !== undefined && { dateIn: new Date(data.dateIn) }),
        ...(data.deadline !== undefined && { deadline: data.deadline ? new Date(data.deadline) : null }),
        ...(data.dateDone !== undefined && !('dateDone' in lifecycleUpdate) && { dateDone: data.dateDone ? new Date(data.dateDone) : null }),
        ...(data.reminderDate !== undefined && {
          reminderDate: data.reminderDate ? new Date(data.reminderDate) : null,
          reminderSent: false, // Reset ao mudar data do lembrete
        }),
        ...previousStatusUpdate,
        ...lifecycleUpdate,
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

    const demanda = await db.demanda.findUnique({
      where: { id },
    })

    if (!demanda) throw new ApiError('Recurso nao encontrado', 404)

    // Authorization: 3 níveis
    if (user.role === 'admin') {
      // Admin: pode tudo
    } else if (user.role === 'gerencia') {
      if (demanda.companyId !== user.companyId) {
        throw new ApiError('Sem permissao', 403)
      }
    } else {
      const teamIds = user.teamIds || []
      if (!demanda.teamId || !teamIds.includes(demanda.teamId)) {
        throw new ApiError('Sem permissao', 403)
      }
    }

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
