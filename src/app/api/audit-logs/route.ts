import { db } from '@/lib/db'
import { getCurrentUser, isAdmin } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { NextRequest } from 'next/server'

const ADMIN_ROLES = ['admin', 'gerencia']

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)
    if (!ADMIN_ROLES.includes(user.role || '')) {
      throw new ApiError('Acesso restrito a administradores', 403)
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50')))
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const userId = searchParams.get('userId')

    const where: Record<string, unknown> = {}
    if (action) where.action = action
    if (entityType) where.entityType = entityType
    if (userId) where.userId = userId

    // Tenant isolation: gerencia só vê logs de usuários da própria company.
    // AuditLog não tem companyId; scope via relação user.companyId.
    if (!isAdmin(user)) {
      where.user = { is: { companyId: user.companyId ?? '__none__' } }
    }

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      db.auditLog.count({ where }),
    ])

    return successResponse({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
