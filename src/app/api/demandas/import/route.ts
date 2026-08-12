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

    // `createManyAndReturn` em vez de `createMany`: sem os ids não dá para
    // auditar, e o ADR-003 exige AuditLog em toda mutação de Demanda. Antes
    // disto, demanda importada abria sem resposta para "quem criou isto?".
    const criadas = await db.demanda.createManyAndReturn({
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
      select: { id: true, title: true },
    })

    // Um log por demanda (entityId real), em um único insert. `action: 'IMPORT'`
    // preserva a origem: o histórico distingue criada à mão de veio da planilha.
    // Falha aqui NÃO derruba o import — mesmo contrato do `createAuditLog`.
    try {
      await db.auditLog.createMany({
        data: criadas.map((d) => ({
          action: 'IMPORT',
          entityType: 'Demanda',
          entityId: d.id,
          userId: user.id!,
          userEmail: user.email || '',
          changes: JSON.stringify({ title: { from: null, to: d.title } }),
        })),
      })
    } catch (err) {
      console.error('Audit log do import falhou:', err)
    }

    return successResponse(
      { count: criadas.length },
      `${criadas.length} demandas importadas com sucesso`
    )
  } catch (error) {
    return handleApiError(error)
  }
}
