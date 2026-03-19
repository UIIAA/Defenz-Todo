import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { createAuditLog, diffChanges } from '@/lib/audit'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'

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
    const { name, role, position } = body as { name?: string; role?: string; position?: string }

    const target = await db.user.findUnique({ where: { id } })
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

    const updateData: Record<string, string> = {}
    if (name !== undefined) updateData.name = name
    if (role !== undefined) updateData.role = role
    if (position !== undefined) updateData.position = position

    const updated = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, position: true, createdAt: true },
    })

    const changes = diffChanges(
      { name: target.name, role: target.role, position: target.position },
      { name: updated.name, role: updated.role, position: updated.position },
      ['name', 'role', 'position']
    )

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'User',
      entityId: id,
      userId,
      userEmail: (user as { email: string }).email,
      changes,
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
