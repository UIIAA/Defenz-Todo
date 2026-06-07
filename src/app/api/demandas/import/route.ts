import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, resolveActiveCompany } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { importSchema } from '@/lib/validations/demanda'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const body = await request.json()
    const { items } = importSchema.parse(body)

    // Empresa ativa: default = primária; só aceita outra empresa se ∈ conjunto (senão 403)
    const activeCompanyId = resolveActiveCompany(user, body.companyId)

    // activeTeamId from body or user's single team
    const activeTeamId = body.teamId || (user.teamIds && user.teamIds.length === 1 ? user.teamIds[0] : null)

    const created = await db.demanda.createMany({
      data: items.map((item) => ({
        title: item.title,
        description: item.description || null,
        origin: item.origin,
        status: 'solicitada',
        priority: item.priority,
        assignee: item.assignee || null,
        dateIn: new Date(),
        deadline: item.deadline ? new Date(item.deadline) : null,
        dateDone: null,
        userId: user.id,
        companyId: activeCompanyId,
        teamId: activeTeamId || null,
      })),
    })

    return successResponse(
      { count: created.count },
      `${created.count} demandas importadas com sucesso`
    )
  } catch (error) {
    return handleApiError(error)
  }
}
