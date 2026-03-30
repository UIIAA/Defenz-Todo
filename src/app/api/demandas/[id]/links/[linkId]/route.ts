import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { updateLinkSchema } from '@/lib/validations/demanda-link'
import { createAuditLog } from '@/lib/audit'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const { id: demandaId, linkId } = await params

    const existing = await db.demandaLink.findFirst({
      where: { id: linkId, demandaId },
    })
    if (!existing) throw new ApiError('Link nao encontrado', 404)

    const body = await request.json()
    const data = updateLinkSchema.parse(body)

    const link = await db.demandaLink.update({
      where: { id: linkId },
      data: {
        ...(data.label !== undefined && { label: data.label }),
        ...(data.url !== undefined && { url: data.url }),
        ...(data.position !== undefined && { position: data.position }),
      },
    })

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'DemandaLink',
      entityId: link.id,
      userId: user.id,
      userEmail: user.email || '',
      changes: {
        ...(data.label !== undefined && { label: { from: existing.label, to: data.label } }),
        ...(data.url !== undefined && { url: { from: existing.url, to: data.url } }),
      },
    })

    return successResponse(link, 'Link atualizado')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; linkId: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const { id: demandaId, linkId } = await params

    const existing = await db.demandaLink.findFirst({
      where: { id: linkId, demandaId },
    })
    if (!existing) throw new ApiError('Link nao encontrado', 404)

    await db.demandaLink.delete({ where: { id: linkId } })

    await createAuditLog({
      action: 'DELETE',
      entityType: 'DemandaLink',
      entityId: linkId,
      userId: user.id,
      userEmail: user.email || '',
      changes: { label: { from: existing.label, to: null }, url: { from: existing.url, to: null } },
    })

    return successResponse(null, 'Link excluido')
  } catch (error) {
    return handleApiError(error)
  }
}
