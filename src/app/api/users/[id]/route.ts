import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth, accessibleCompanyIds, assertCompanyAccess } from '@/lib/auth'
import { createAuditLog, diffChanges } from '@/lib/audit'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { updateUserSchema } from '@/lib/validations/user'
import bcrypt from 'bcryptjs'

type RouteContext = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth()
    const currentRole = (user as { role?: string }).role
    if (!currentRole || !['admin', 'gerencia'].includes(currentRole)) {
      throw new ApiError('Sem permissao', 403)
    }

    const { id } = await context.params
    const body = await request.json()
    const { name, role, position, department, password, companyId, teamIds, companyIds } =
      updateUserSchema.parse(body)

    const target = await db.user.findUnique({
      where: { id },
      include: {
        teams: { select: { teamId: true } },
        userCompanies: { select: { companyId: true } },
      },
    })
    if (!target) {
      throw new ApiError('Usuario nao encontrado', 404)
    }

    // Tenant guard no ALVO: gerência só gerencia usuários do seu conjunto (admin: no-op).
    // Sem isto, uma gerência poderia resetar senha/editar usuário de outra empresa.
    const actor = user as { role: string; companyId?: string; companyIds?: string[] }
    if (currentRole !== 'admin') {
      assertCompanyAccess(target.companyId, actor)
    }

    // Cannot lower own role
    const userId = (user as { id: string }).id
    if (id === userId && role && role !== currentRole) {
      const hierarchy = ['user', 'gerencia', 'admin']
      if (hierarchy.indexOf(role) < hierarchy.indexOf(currentRole)) {
        throw new ApiError('Nao pode rebaixar proprio role', 400)
      }
    }

    // Only admin can promote to admin
    if (role === 'admin' && currentRole !== 'admin') {
      throw new ApiError('Apenas admin pode promover para admin', 403)
    }

    // Tenant guard: não-admin (gerência) só opera dentro do próprio conjunto de empresas
    // (sem escalonamento de privilégio: não atribui empresa fora do seu escopo).
    if (currentRole !== 'admin') {
      const allowed = accessibleCompanyIds(actor) ?? []
      if (companyId && !allowed.includes(companyId)) {
        throw new ApiError('Empresa fora do seu escopo', 403, { code: 'FORBIDDEN_COMPANY' })
      }
      if (companyIds) {
        for (const cid of companyIds) {
          if (!allowed.includes(cid)) {
            throw new ApiError('Empresa fora do seu escopo', 403, { code: 'FORBIDDEN_COMPANY' })
          }
        }
      }
    }

    // ===== VALIDAÇÃO antes de QUALQUER escrita (evita partial-write quando um guard barra) =====

    // Plano de sincronização de equipes: valida escopo + existência (sem escrever ainda).
    let teamSync: { toAdd: string[]; toRemove: string[] } | null = null
    if (teamIds !== undefined) {
      const currentTeamIds = target.teams.map((t) => t.teamId)
      const toAdd = teamIds.filter((tid) => !currentTeamIds.includes(tid))
      const toRemove = currentTeamIds.filter((tid) => !teamIds.includes(tid))
      if (toAdd.length > 0) {
        const addTeams = await db.team.findMany({
          where: { id: { in: toAdd } },
          select: { id: true, companyId: true },
        })
        if (addTeams.length !== toAdd.length) {
          throw new ApiError('Equipe inválida', 400)
        }
        // Gerência só vincula equipes de empresas do seu conjunto (admin: no-op)
        if (currentRole !== 'admin') {
          for (const t of addTeams) assertCompanyAccess(t.companyId, actor)
        }
      }
      teamSync = { toAdd, toRemove }
    }

    // Plano de sincronização de empresas (UserCompany = só ADICIONAIS; a primária é descartada).
    let companySync: { toAdd: string[]; toRemove: string[] } | null = null
    if (companyIds !== undefined) {
      const effectivePrimary = companyId !== undefined ? companyId || null : target.companyId
      const desired = companyIds.filter((cid) => cid && cid !== effectivePrimary)
      const currentCompanyIds = target.userCompanies.map((uc) => uc.companyId)
      const toAdd = desired.filter((cid) => !currentCompanyIds.includes(cid))
      let toRemove = currentCompanyIds.filter((cid) => !desired.includes(cid))
      // Não-admin nunca mexe em membership fora do próprio conjunto (sem remoção cross-tenant)
      if (currentRole !== 'admin') {
        const allowed = accessibleCompanyIds(actor) ?? []
        toRemove = toRemove.filter((cid) => allowed.includes(cid))
      }
      companySync = { toAdd, toRemove }
    }

    // ===== ESCRITAS (todas as validações já passaram) =====
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (position !== undefined) updateData.position = position
    if (department !== undefined) updateData.department = department
    if (companyId !== undefined) updateData.companyId = companyId || null
    if (password) updateData.password = await bcrypt.hash(password, 10)

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, position: true, department: true, companyId: true, createdAt: true },
    })

    if (teamSync) {
      if (teamSync.toRemove.length > 0) {
        await db.userTeam.deleteMany({ where: { userId: id, teamId: { in: teamSync.toRemove } } })
      }
      if (teamSync.toAdd.length > 0) {
        await db.userTeam.createMany({ data: teamSync.toAdd.map((teamId) => ({ userId: id, teamId })) })
      }
    }

    if (companySync) {
      if (companySync.toRemove.length > 0) {
        await db.userCompany.deleteMany({ where: { userId: id, companyId: { in: companySync.toRemove } } })
      }
      if (companySync.toAdd.length > 0) {
        await db.userCompany.createMany({ data: companySync.toAdd.map((cid) => ({ userId: id, companyId: cid })) })
      }
    }

    const changes = diffChanges(
      { name: target.name, role: target.role, position: target.position, department: target.department, companyId: target.companyId },
      { name: updated.name, role: updated.role, position: updated.position, department: updated.department, companyId: updated.companyId },
      ['name', 'role', 'position', 'department', 'companyId']
    )

    // Log password change separately (don't log actual values)
    const auditChanges = password
      ? { ...(changes || {}), password: { from: '***', to: '(redefinida)' } }
      : changes

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      userId,
      userEmail: (user as { email: string }).email,
      changes: auditChanges,
    })

    return successResponse(updated)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nao autenticado' }, { status: 401 })
    }
    return handleApiError(error)
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await requireAuth()
    const currentRole = (user as { role?: string }).role
    if (!currentRole || !['admin', 'gerencia'].includes(currentRole)) {
      throw new ApiError('Sem permissao', 403)
    }

    const { id } = await context.params
    const userId = (user as { id: string }).id

    if (id === userId) {
      throw new ApiError('Nao pode deletar a si mesmo', 400)
    }

    const target = await db.user.findUnique({ where: { id } })
    if (!target) {
      throw new ApiError('Usuario nao encontrado', 404)
    }

    // Tenant guard no ALVO: gerência só deleta usuários do seu conjunto (admin: no-op).
    if (currentRole !== 'admin') {
      assertCompanyAccess(target.companyId, user as { role: string; companyId?: string; companyIds?: string[] })
    }

    // Only admin can delete another admin
    if (target.role === 'admin' && currentRole !== 'admin') {
      throw new ApiError('Apenas admin pode remover outro admin', 403)
    }

    // Unlink demandas (set assignee to null where assignee matches target name)
    await db.demanda.updateMany({
      where: { userId: id },
      data: { userId: userId }, // Transfer ownership to current user
    })

    // Also clear assignee references
    if (target.name) {
      await db.demanda.updateMany({
        where: { assignee: target.name },
        data: { assignee: null },
      })
    }

    await db.user.delete({ where: { id } })

    await createAuditLog({
      action: 'DELETE',
      entityType: 'User',
      entityId: id,
      userId,
      userEmail: (user as { email: string }).email,
      changes: { deleted: { from: target.email, to: null } },
    })

    return successResponse(null)
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Nao autenticado' }, { status: 401 })
    }
    return handleApiError(error)
  }
}
