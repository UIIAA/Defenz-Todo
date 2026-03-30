import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, createdResponse, ApiError } from '@/lib/api-helpers'
import { createLinkSchema } from '@/lib/validations/demanda-link'
import { createAuditLog } from '@/lib/audit'

const MAX_LINKS_PER_DEMANDA = 10

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const { id: demandaId } = await params

    const demanda = await db.demanda.findUnique({ where: { id: demandaId } })
    if (!demanda) throw new ApiError('Demanda nao encontrada', 404)

    // Check link limit
    const linkCount = await db.demandaLink.count({ where: { demandaId } })
    if (linkCount >= MAX_LINKS_PER_DEMANDA) {
      throw new ApiError(`Limite de ${MAX_LINKS_PER_DEMANDA} links por demanda atingido`, 400)
    }

    const body = await request.json()
    const data = createLinkSchema.parse(body)

    // Get max position
    const maxPos = await db.demandaLink.findFirst({
      where: { demandaId },
      orderBy: { position: 'desc' },
      select: { position: true },
    })

    const link = await db.demandaLink.create({
      data: {
        label: data.label,
        url: data.url,
        position: data.position ?? (maxPos ? maxPos.position + 1 : 0),
        demandaId,
      },
    })

    await createAuditLog({
      action: 'CREATE',
      entityType: 'DemandaLink',
      entityId: link.id,
      userId: user.id,
      userEmail: user.email || '',
      changes: { label: { from: null, to: link.label }, url: { from: null, to: link.url }, demandaId: { from: null, to: demandaId } },
    })

    return createdResponse(link, 'Link criado')
  } catch (error) {
    return handleApiError(error)
  }
}
