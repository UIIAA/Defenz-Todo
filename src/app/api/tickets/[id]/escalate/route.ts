import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, assertCompanyAccess } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { escalateTicketSchema } from '@/lib/validations/ticket'
import { createAuditLog } from '@/lib/audit'

/** Encaminha o ticket ao Nível 2 EXTERNO. escalatedAt é idempotente (mantém o 1º). */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await resolveActor(request)
    const { id } = await params

    const existing = await db.ticket.findUnique({ where: { id } })
    if (!existing) throw new ApiError('Ticket nao encontrado', 404)
    assertCompanyAccess(existing.companyId, user)

    const { escalatedTo } = escalateTicketSchema.parse(await request.json())

    // Idempotente: a primeira escalada fixa o timestamp (métrica honesta de "% que subiu").
    const escalatedAt = existing.escalatedAt ?? new Date()

    const ticket = await db.ticket.update({ where: { id }, data: { escalatedAt, escalatedTo } })

    await createAuditLog({
      action: 'ESCALATE',
      entityType: 'Ticket',
      entityId: id,
      userId: user.id,
      userEmail: user.email || '',
      changes: { escalatedTo: { from: existing.escalatedTo, to: escalatedTo } },
    })

    return successResponse(ticket, 'Ticket encaminhado ao Nível 2')
  } catch (error) {
    return handleApiError(error)
  }
}
