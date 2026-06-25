import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, assertCompanyAccess } from '@/lib/auth'
import { handleApiError, createdResponse, ApiError } from '@/lib/api-helpers'
import { createTicketMessageSchema } from '@/lib/validations/ticket'
import { createAuditLog } from '@/lib/audit'

/** Adiciona uma mensagem (reply conta como interação; note é interna). 1ª reply → firstReplyAt. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await resolveActor(request)
    const { id } = await params

    const ticket = await db.ticket.findUnique({ where: { id } })
    if (!ticket) throw new ApiError('Ticket nao encontrado', 404)
    assertCompanyAccess(ticket.companyId, user)

    const body = await request.json()
    const data = createTicketMessageSchema.parse(body)

    const message = await db.ticketMessage.create({
      data: { ticketId: id, kind: data.kind, body: data.body, authorId: user.id },
    })

    // 1ª resposta de agente fecha o "first response time".
    if (data.kind === 'reply' && ticket.firstReplyAt == null) {
      await db.ticket.update({ where: { id }, data: { firstReplyAt: new Date() } })
    }

    await createAuditLog({
      action: 'CREATE',
      entityType: 'TicketMessage',
      entityId: message.id,
      userId: user.id,
      userEmail: user.email || '',
      changes: { ticketId: { from: null, to: id }, kind: { from: null, to: data.kind } },
    })

    return createdResponse(message, 'Mensagem adicionada')
  } catch (error) {
    return handleApiError(error)
  }
}
