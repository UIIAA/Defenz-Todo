import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, assertCompanyAccess } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { updateTicketSchema } from '@/lib/validations/ticket'
import { createAuditLog, diffChanges } from '@/lib/audit'
import { computeTicketTimestamps } from '@/lib/tickets-server'

const TRACKED = ['subject', 'description', 'status', 'priority', 'channel', 'requester', 'assignedToId']

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await resolveActor(request)
    const { id } = await params

    const ticket = await db.ticket.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        assignedTo: { select: { name: true, email: true } },
        demanda: { select: { id: true, title: true, status: true } },
      },
    })
    if (!ticket) throw new ApiError('Ticket nao encontrado', 404)
    assertCompanyAccess(ticket.companyId, user)

    return successResponse(ticket)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await resolveActor(request)
    const { id } = await params

    const existing = await db.ticket.findUnique({ where: { id } })
    if (!existing) throw new ApiError('Ticket nao encontrado', 404)
    assertCompanyAccess(existing.companyId, user)

    const body = await request.json()
    const data = updateTicketSchema.parse(body)

    // Timestamps de relógio derivados num único ponto (service layer).
    const ts = computeTicketTimestamps(
      { status: existing.status, resolvedAt: existing.resolvedAt },
      data,
      new Date()
    )

    const ticket = await db.ticket.update({ where: { id }, data: { ...data, ...ts } })

    // Diff sobre objetos COMPLETOS (existing vs atualizado) — evita o bug do PUT parcial.
    const changes = diffChanges(
      existing as unknown as Record<string, unknown>,
      ticket as unknown as Record<string, unknown>,
      TRACKED
    )
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Ticket',
      entityId: id,
      userId: user.id,
      userEmail: user.email || '',
      changes,
    })

    return successResponse(ticket, 'Ticket atualizado')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await resolveActor(request)
    const { id } = await params

    const existing = await db.ticket.findUnique({ where: { id } })
    if (!existing) throw new ApiError('Ticket nao encontrado', 404)
    assertCompanyAccess(existing.companyId, user)

    await db.ticket.delete({ where: { id } })

    await createAuditLog({
      action: 'DELETE',
      entityType: 'Ticket',
      entityId: id,
      userId: user.id,
      userEmail: user.email || '',
      changes: { subject: { from: existing.subject, to: null } },
    })

    return successResponse(null, 'Ticket excluido')
  } catch (error) {
    return handleApiError(error)
  }
}
