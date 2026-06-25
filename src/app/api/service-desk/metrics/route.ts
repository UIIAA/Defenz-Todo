import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, companyScopeWhere } from '@/lib/auth'
import { handleApiError, successResponse } from '@/lib/api-helpers'
import { metricsQuerySchema } from '@/lib/validations/ticket'
import { computeServiceDeskMetrics, type MetricTicket } from '@/lib/tickets-server'

const CAP = 5000

// "YYYY-MM-DD" → limites de dia em America/Sao_Paulo (UTC-3), igual ao relatório de Horas —
// senão o período mis-atribui tickets da noite (que cairiam no dia UTC seguinte na Vercel).
const SP_OFFSET = '-03:00'
const dayStart = (s: string) => (s.length === 10 ? new Date(`${s}T00:00:00.000${SP_OFFSET}`) : new Date(s))
const dayEnd = (s: string) => (s.length === 10 ? new Date(`${s}T23:59:59.999${SP_OFFSET}`) : new Date(s))

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
      if (q.from) createdAt.gte = dayStart(q.from)
      if (q.to) createdAt.lte = dayEnd(q.to)
      where.createdAt = createdAt
    }

    // take CAP+1 (sentinela) + orderBy determinístico: capped só quando há truncamento real.
    const fetched = await db.ticket.findMany({
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
      orderBy: { createdAt: 'desc' },
      take: CAP + 1,
    })
    const capped = fetched.length > CAP
    const rows = capped ? fetched.slice(0, CAP) : fetched

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
    return successResponse({ ...metrics, capped })
  } catch (error) {
    return handleApiError(error)
  }
}
