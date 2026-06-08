import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  resolveActor,
  accessibleCompanyIds,
  assertCompanyAccess,
  companyScopeWhere,
  resolveActiveCompany,
} from '@/lib/auth'
import { handleApiError, createdResponse, successResponse, ApiError } from '@/lib/api-helpers'
import { createDemandaSchema, updateDemandaSchema } from '@/lib/validations/demanda'
import { createAuditLog, diffChanges } from '@/lib/audit'
import { parseLocalDate } from '@/lib/date'
import { detectCycle } from '@/lib/dependency-graph'
import { logTimeDelta } from '@/lib/time-entries-server'

const TRACKED_FIELDS = ['title', 'description', 'origin', 'status', 'priority', 'classification', 'client', 'assignee', 'deadline', 'dateDone', 'dateStarted', 'reminderDate', 'estimatedMinutes', 'spentMinutes']

export async function GET(request: NextRequest) {
  try {
    const user = await resolveActor(request)
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
      // Gerencia: vê tudo do seu CONJUNTO de empresas (multi-empresa)
      Object.assign(where, companyScopeWhere(user))
      // Pode estreitar por uma empresa específica do conjunto (filtro da UI)
      if (companyFilter && companyFilter !== 'all') {
        const ids = accessibleCompanyIds(user) ?? []
        if (ids.includes(companyFilter)) where.companyId = companyFilter
      }
      if (teamFilter && teamFilter !== 'all') {
        where.teamId = teamFilter
      }
    } else {
      // User: demandas dos seus teams OU FK assignedToId === user.id OU legacy assignee match
      // (empresa ∈ conjunto acessível, FK null no caso legado)
      const teamIds = user.teamIds || []
      const assigneeKey = user.name ?? user.email ?? null
      const ids = accessibleCompanyIds(user) ?? []
      const scope = companyScopeWhere(user)
      const orClauses: Record<string, unknown>[] = []

      if (teamIds.length > 0) {
        if (teamFilter && teamFilter !== 'all' && teamIds.includes(teamFilter)) {
          orClauses.push({ teamId: teamFilter })
        } else {
          orClauses.push({ teamId: { in: teamIds } })
        }
      }

      // Phase 2: FK match (fonte de verdade pós-backfill) com tenant guard (conjunto)
      if (user.id && ids.length > 0) {
        orClauses.push({ assignedToId: user.id, ...scope })
      }

      // Phase 1 fallback: demandas legadas (FK null) com string assignee batendo (conjunto)
      if (assigneeKey && ids.length > 0) {
        orClauses.push({ assignee: assigneeKey, ...scope, assignedToId: null })
      }

      if (orClauses.length === 0) {
        return successResponse([])
      }

      where.OR = orClauses
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

    const result = demandas.map(d => ({
      ...d,
      dependsOn: JSON.parse(d.dependsOn || '[]') as string[],
    }))

    return successResponse(result)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await resolveActor(request)
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const body = await request.json()
    const data = createDemandaSchema.parse(body)

    // Empresa ativa: default = primária; só aceita outra empresa se ∈ conjunto (senão 403)
    const activeCompanyId = resolveActiveCompany(user, body.companyId)

    // activeTeamId vem do body (equipe ativa selecionada na UI)
    const activeTeamId = body.teamId || (user.teamIds && user.teamIds.length === 1 ? user.teamIds[0] : null)

    // Dependências (opcional): valida IDs no escopo da empresa ativa
    let dependsOnValue = '[]'
    if (data.dependsOn && data.dependsOn.length > 0) {
      const scopeWhere = activeCompanyId ? { companyId: activeCompanyId } : {}
      const all = await db.demanda.findMany({ where: scopeWhere, select: { id: true } })
      const validIds = new Set(all.map((d) => d.id))
      for (const depId of data.dependsOn) {
        if (!validIds.has(depId)) throw new ApiError('Dependência inválida', 400)
      }
      dependsOnValue = JSON.stringify(data.dependsOn)
    }

    // Phase 2: resolve assignedToId → valida company (conjunto) → auto-popula assignee string
    let resolvedAssignedToId: string | null = null
    let resolvedAssignee: string | null = data.assignee ?? null
    if (data.assignedToId) {
      const assignee = await db.user.findUnique({ where: { id: data.assignedToId } })
      if (!assignee) {
        throw new ApiError('Responsavel nao encontrado', 400)
      }
      // admin pode atribuir cross-company; demais só dentro do conjunto acessível
      assertCompanyAccess(assignee.companyId, user)
      resolvedAssignedToId = assignee.id
      resolvedAssignee = assignee.name ?? assignee.email
    }

    const demanda = await db.demanda.create({
      data: {
        title: data.title,
        description: data.description,
        origin: data.origin,
        status: data.status,
        priority: data.priority,
        classification: data.classification || null,
        client: data.client || null,
        assignee: resolvedAssignee,
        assignedToId: resolvedAssignedToId,
        dateIn: parseLocalDate(data.dateIn) ?? new Date(),
        dateStarted: data.status === 'em_andamento' ? new Date() : null,
        deadline: parseLocalDate(data.deadline),
        dateDone: parseLocalDate(data.dateDone),
        estimatedMinutes: data.estimatedMinutes ?? null,
        spentMinutes: data.spentMinutes ?? 0,
        dependsOn: dependsOnValue,
        userId: user.id,
        companyId: activeCompanyId,
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
    const user = await resolveActor(request)
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const body = await request.json()
    const { id, updatedAt, ...data } = updateDemandaSchema.parse(body)

    const current = await db.demanda.findUnique({
      where: { id },
    })

    if (!current) throw new ApiError('Recurso nao encontrado', 404)

    // Authorization: 3 níveis (escopo por CONJUNTO de empresas)
    if (user.role === 'admin') {
      // Admin: pode tudo
    } else if (user.role === 'gerencia') {
      // Gerencia: só demandas de empresa do seu conjunto
      assertCompanyAccess(current.companyId, user)
    } else {
      // User: ownTeam OU FK match OU legacy string match (FK null + empresa ∈ conjunto)
      const teamIds = user.teamIds || []
      const assigneeKey = user.name ?? user.email ?? null
      const ids = accessibleCompanyIds(user) ?? []
      const inScope = !!current.companyId && ids.includes(current.companyId)
      const inOwnTeam = !!current.teamId && teamIds.includes(current.teamId)
      const isAssigneeFk =
        !!current.assignedToId && current.assignedToId === user.id && inScope
      const isAssigneeLegacy =
        current.assignedToId === null &&
        !!assigneeKey &&
        current.assignee === assigneeKey &&
        inScope
      if (!inOwnTeam && !isAssigneeFk && !isAssigneeLegacy) {
        throw new ApiError('Sem permissao', 403)
      }
    }

    // Phase 2: resolver assignedToId no PUT também (se enviado)
    let assigneeUpdate: { assignedToId: string | null; assignee: string | null } | null = null
    if (data.assignedToId !== undefined) {
      if (data.assignedToId === null) {
        assigneeUpdate = { assignedToId: null, assignee: null }
      } else {
        const assignee = await db.user.findUnique({ where: { id: data.assignedToId } })
        if (!assignee) {
          throw new ApiError('Responsavel nao encontrado', 400)
        }
        // admin pode atribuir cross-company; demais só dentro do conjunto acessível
        assertCompanyAccess(assignee.companyId, user)
        assigneeUpdate = {
          assignedToId: assignee.id,
          assignee: assignee.name ?? assignee.email,
        }
      }
    }

    // Dependências (opcional): self-dep, ID inválido e ciclo — escopo da empresa
    let dependsOnUpdate: { dependsOn: string } | null = null
    if (data.dependsOn !== undefined) {
      const deps = data.dependsOn
      if (deps.includes(id)) {
        throw new ApiError('Uma demanda não pode depender de si mesma', 400)
      }
      const scopeWhere = current.companyId ? { companyId: current.companyId } : {}
      const all = await db.demanda.findMany({ where: scopeWhere, select: { id: true, dependsOn: true } })
      const validIds = new Set(all.map((d) => d.id))
      for (const depId of deps) {
        if (!validIds.has(depId)) throw new ApiError('Dependência inválida', 400)
      }
      const allDepsMap = new Map<string, string[]>()
      for (const d of all) allDepsMap.set(d.id, JSON.parse(d.dependsOn || '[]') as string[])
      if (detectCycle(id, deps, allDepsMap)) {
        throw new ApiError('Isso criaria um ciclo de dependências', 400)
      }
      dependsOnUpdate = { dependsOn: JSON.stringify(deps) }
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

    // Ao concluir (transição p/ concluida), o servidor define dateDone se ainda nula E o
    // cliente não enviou uma data explícita — espelha o dateStarted e alimenta analytics
    // p/ callers externos (MCP/curl). Cliente que envia dateDone (ex.: UI, backfill) é respeitado.
    if (
      data.status === 'concluida' &&
      current.status !== 'concluida' &&
      current.dateDone === null &&
      data.dateDone === undefined
    ) {
      lifecycleUpdate.dateDone = new Date()
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
        ...(data.client !== undefined && { client: data.client || null }),
        ...(assigneeUpdate ?? (data.assignee !== undefined ? { assignee: data.assignee || null } : {})),
        ...(data.dateIn !== undefined && parseLocalDate(data.dateIn) && { dateIn: parseLocalDate(data.dateIn)! }),
        ...(data.deadline !== undefined && { deadline: parseLocalDate(data.deadline) }),
        ...(data.dateDone !== undefined && !('dateDone' in lifecycleUpdate) && { dateDone: parseLocalDate(data.dateDone) }),
        ...(data.reminderDate !== undefined && {
          reminderDate: parseLocalDate(data.reminderDate),
          reminderSent: false, // Reset ao mudar data do lembrete
        }),
        ...(data.estimatedMinutes !== undefined && { estimatedMinutes: data.estimatedMinutes }),
        ...(data.spentMinutes !== undefined && { spentMinutes: data.spentMinutes }),
        ...(dependsOnUpdate ?? {}),
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

    // Diário de horas (delta-on-save): grava 1 lançamento quando spentMinutes do CARD muda.
    // Livre edição preservada — não recomputa nem trava. Atribuído ao Responsável (fallback editor).
    if (data.spentMinutes !== undefined && data.spentMinutes !== current.spentMinutes) {
      await logTimeDelta({
        demanda: {
          id: demanda.id,
          assignedToId: demanda.assignedToId,
          assignee: demanda.assignee,
          client: demanda.client,
        },
        delta: data.spentMinutes - current.spentMinutes,
        source: 'card',
        actor: { id: user.id, name: user.name, email: user.email },
      })
    }

    return successResponse(demanda, 'Demanda atualizada')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await resolveActor(request)
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) throw new ApiError('ID e obrigatorio', 400)

    const demanda = await db.demanda.findUnique({
      where: { id },
    })

    if (!demanda) throw new ApiError('Recurso nao encontrado', 404)

    // Authorization: 3 níveis (escopo por CONJUNTO de empresas)
    if (user.role === 'admin') {
      // Admin: pode tudo
    } else if (user.role === 'gerencia') {
      assertCompanyAccess(demanda.companyId, user)
    } else {
      const teamIds = user.teamIds || []
      const assigneeKey = user.name ?? user.email ?? null
      const ids = accessibleCompanyIds(user) ?? []
      const inScope = !!demanda.companyId && ids.includes(demanda.companyId)
      const inOwnTeam = !!demanda.teamId && teamIds.includes(demanda.teamId)
      const isAssigneeFk =
        !!demanda.assignedToId && demanda.assignedToId === user.id && inScope
      const isAssigneeLegacy =
        demanda.assignedToId === null &&
        !!assigneeKey &&
        demanda.assignee === assigneeKey &&
        inScope
      if (!inOwnTeam && !isAssigneeFk && !isAssigneeLegacy) {
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
