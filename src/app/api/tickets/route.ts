import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, companyScopeWhere, resolveActiveCompany, assertCompanyAccess } from '@/lib/auth'
import { handleApiError, successResponse, createdResponse, ApiError } from '@/lib/api-helpers'
import { createTicketSchema } from '@/lib/validations/ticket'
import { createAuditLog } from '@/lib/audit'

/** Lista tickets do escopo do ator. Filtros: status, escalated, assignedToId, channel, período. */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveActor(request)
    const { searchParams } = new URL(request.url)

    const where: Record<string, unknown> = { ...companyScopeWhere(user) }
    const status = searchParams.get('status')
    if (status) where.status = status
    const channel = searchParams.get('channel')
    if (channel) where.channel = channel
    const assignedToId = searchParams.get('assignedToId')
    if (assignedToId) where.assignedToId = assignedToId
    if (searchParams.get('escalated') === 'true') where.escalatedAt = { not: null }

    const tickets = await db.ticket.findMany({
      where,
      include: {
        assignedTo: { select: { name: true, email: true } },
        demanda: { select: { id: true, title: true, status: true } },
        _count: { select: { messages: { where: { kind: 'reply' } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    return successResponse(tickets)
  } catch (error) {
    return handleApiError(error)
  }
}

/** Cria um ticket no escopo do ator (companyId resolvido via resolveActiveCompany). */
export async function POST(request: NextRequest) {
  try {
    const user = await resolveActor(request)
    const body = await request.json()
    const data = createTicketSchema.parse(body)

    const companyId = resolveActiveCompany(user, data.companyId)
    if (!companyId) throw new ApiError('Empresa não resolvida para o ticket', 400)

    // Guard de tenant no RESPONSÁVEL (espelha demandas): não atribuir a usuário de outra empresa.
    if (data.assignedToId) {
      const assignee = await db.user.findUnique({ where: { id: data.assignedToId } })
      if (!assignee) throw new ApiError('Responsavel nao encontrado', 400)
      assertCompanyAccess(assignee.companyId, user)
    }

    const { companyId: _omit, ...rest } = data
    const ticket = await db.ticket.create({
      data: { ...rest, companyId, createdById: user.id },
    })

    await createAuditLog({
      action: 'CREATE',
      entityType: 'Ticket',
      entityId: ticket.id,
      userId: user.id,
      userEmail: user.email || '',
      changes: { subject: { from: null, to: ticket.subject } },
    })

    return createdResponse(ticket, 'Ticket criado')
  } catch (error) {
    return handleApiError(error)
  }
}
