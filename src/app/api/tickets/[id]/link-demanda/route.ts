import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, assertCompanyAccess } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { linkDemandaSchema } from '@/lib/validations/ticket'
import { createAuditLog } from '@/lib/audit'

/** Vincula (1:1) uma Demanda existente ao ticket. A Demanda DEVE estar no mesmo escopo de empresa. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await resolveActor(request)
    const { id } = await params

    const ticket = await db.ticket.findUnique({ where: { id } })
    if (!ticket) throw new ApiError('Ticket nao encontrado', 404)
    assertCompanyAccess(ticket.companyId, user)

    const { demandaId } = linkDemandaSchema.parse(await request.json())

    const demanda = await db.demanda.findUnique({ where: { id: demandaId } })
    if (!demanda) throw new ApiError('Demanda nao encontrada', 404)
    // Tenant guard no ALVO: impede vincular a uma demanda de outra empresa.
    assertCompanyAccess(demanda.companyId, user)

    const updated = await db.ticket.update({ where: { id }, data: { demandaId } })

    await createAuditLog({
      action: 'LINK',
      entityType: 'Ticket',
      entityId: id,
      userId: user.id,
      userEmail: user.email || '',
      changes: { demandaId: { from: ticket.demandaId, to: demandaId } },
    })

    return successResponse(updated, 'Demanda vinculada ao ticket')
  } catch (error) {
    return handleApiError(error)
  }
}
