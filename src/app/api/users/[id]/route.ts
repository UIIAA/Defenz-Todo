import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createAuditLog, diffChanges } from '@/lib/audit'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
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
    const { name, role, position, department, password, companyId, teamIds } = body as {
      name?: string; role?: string; position?: string; department?: string;
      password?: string; companyId?: string; teamIds?: string[]
    }

    const target = await db.user.findUnique({
      where: { id },
      include: { teams: { select: { teamId: true } } },
    })
    if (!target) {
      throw new ApiError('Usuario nao encontrado', 404)
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

    // Password validation
    if (password !== undefined && password.length < 6) {
      throw new ApiError('Senha deve ter pelo menos 6 caracteres', 400)
    }

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

    // Update team memberships if provided
    if (teamIds !== undefined) {
      const currentTeamIds = target.teams.map((t) => t.teamId)
      const toAdd = teamIds.filter((tid) => !currentTeamIds.includes(tid))
      const toRemove = currentTeamIds.filter((tid) => !teamIds.includes(tid))

      if (toRemove.length > 0) {
        await db.userTeam.deleteMany({
          where: { userId: id, teamId: { in: toRemove } },
        })
      }
      if (toAdd.length > 0) {
        await db.userTeam.createMany({
          data: toAdd.map((teamId) => ({ userId: id, teamId })),
        })
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
