import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, companyScopeWhere } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-helpers'
import { metricsQuerySchema } from '@/lib/validations/ticket'
import { computeServiceDeskMetrics, type MetricTicket } from '@/lib/tickets-server'

const CAP = 5000

/** Métricas do Service Desk (4 agregações), scoped por empresa. Período opcional via createdAt. */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveActor(request)
    const { searchParams } = new URL(request.url)
    const q = metricsQuerySchema.parse({
      from: searchParams.get('from') ?? undefined,
      to: searchParams.get('to') ?? undefined,
      companyId: searchParams.get('companyId') ?? undefined,
    })

    const where: Record<string, unknown> = { ...companyScopeWhere(user) }
    // Admin pode estreitar por empresa específica.
    if (q.companyId && user.role === 'admin') where.companyId = q.companyId
    if (q.from || q.to) {
      const createdAt: { gte?: Date; lte?: Date } = {}
      if (q.from) createdAt.gte = new Date(q.from + 'T00:00:00')
      if (q.to) createdAt.lte = new Date(q.to + 'T23:59:59')
      where.createdAt = createdAt
    }

    const rows = await db.ticket.findMany({
      where,
      select: {
        id: true,
        status: true,
        createdAt: true,
        resolvedAt: true,
        escalatedAt: true,
        escalatedTo: true,
        _count: { select: { messages: { where: { kind: 'reply' } } } },
      },
      take: CAP,
    })

    const mapped: MetricTicket[] = rows.map((r) => ({
      id: r.id,
      status: r.status,
      createdAt: r.createdAt,
      resolvedAt: r.resolvedAt,
      escalatedAt: r.escalatedAt,
      escalatedTo: r.escalatedTo,
      replyCount: r._count.messages,
    }))

    const metrics = computeServiceDeskMetrics(mapped, new Date())
    return successResponse({ ...metrics, capped: rows.length >= CAP })
  } catch (error) {
    return handleApiError(error)
  }
}
