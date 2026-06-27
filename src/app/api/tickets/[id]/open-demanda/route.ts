import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, assertCompanyAccess } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { createAuditLog } from '@/lib/audit'

/**
 * Cria uma Demanda a partir do ticket e vincula 1:1 (ticket.demandaId).
 * Não move o ticket de coluna (Marcos move manual).
 * Se ticket.demandaId já estiver setado → 409 amigável (nunca cria órfã).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await resolveActor(request)
    const { id } = await params

    const ticket = await db.ticket.findUnique({ where: { id } })
    if (!ticket) throw new ApiError('Ticket nao encontrado', 404)
    assertCompanyAccess(ticket.companyId, user)

    // Guard 1:1 — nunca criar Demanda órfã se o vínculo já existe.
    if (ticket.demandaId) {
      throw new ApiError('Este ticket já tem demanda', 409)
    }

    // Cria a Demanda herdando dados do ticket, scoped na mesma empresa do ticket (Defenz).
    const demanda = await db.demanda.create({
      data: {
        companyId: ticket.companyId,
        userId: user.id, // criador (FK NOT NULL) — espelha POST /api/demandas
        client: ticket.client ?? null,
        title: ticket.subject,
        description: ticket.description ?? null,
        status: 'solicitada',
      },
    })

    // Seta o vínculo 1:1 no ticket.
    const updatedTicket = await db.ticket.update({
      where: { id },
      data: { demandaId: demanda.id },
    })

    // Auditoria: CREATE da Demanda + LINK no Ticket.
    await createAuditLog({
      action: 'CREATE',
      entityType: 'Demanda',
      entityId: demanda.id,
      userId: user.id,
      userEmail: user.email || '',
      changes: { title: { from: null, to: demanda.title } },
    })
    await createAuditLog({
      action: 'LINK',
      entityType: 'Ticket',
      entityId: id,
      userId: user.id,
      userEmail: user.email || '',
      changes: {
        demandaId: { from: null, to: demanda.id },
      },
    })

    return successResponse(
      { ticket: updatedTicket, demanda },
      'Demanda criada e vinculada ao ticket'
    )
  } catch (error) {
    return handleApiError(error)
  }
}
