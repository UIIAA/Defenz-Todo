import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, type ScopeUser } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { scopedPlaybookWhere } from '@/lib/playbook-scope'
import { nextReviewDueAt } from '@/lib/playbook-freshness'
import { createAuditLog } from '@/lib/audit'

type Ctx = { params: Promise<{ id: string }> }

/**
 * Verifica/re-verifica um playbook: reinicia o relógio de frescor.
 *
 * Qualquer um do escopo pode verificar (é um ato de leitura atenta, não de edição) —
 * quem verificou fica registrado em `verifiedById` e no AuditLog.
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  try {
    const { id } = await ctx.params
    const user = (await resolveActor(request)) as ScopeUser & {
      id: string
      email?: string | null
    }

    const playbook = await db.playbook.findFirst({
      where: scopedPlaybookWhere(user, { id }),
    })
    if (!playbook) throw new ApiError('Playbook não encontrado', 404)

    const agora = new Date()
    const updated = await db.playbook.update({
      where: { id },
      data: {
        verifiedAt: agora,
        verifiedById: user.id,
        reviewDueAt: nextReviewDueAt(playbook.reviewIntervalDays, agora),
        // Sem este reset, o 2º ciclo de staleness nunca reavisaria o dono —
        // bug latente do cron de lembretes de Demanda, não replicar aqui.
        reviewReminderSent: false,
      },
    })

    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Playbook',
      entityId: id,
      userId: user.id,
      userEmail: user.email ?? '',
      changes: { verifiedAt: { from: playbook.verifiedAt, to: agora } },
    })

    return successResponse(updated)
  } catch (error) {
    return handleApiError(error)
  }
}
