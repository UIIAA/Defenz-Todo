import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { sendEmailWithChecks } from '@/lib/email'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { ReminderEmail } from './email-template'
import { PlaybookReviewEmail } from './playbook-email-template'
import crypto from 'crypto'

/** Cap do passo de frescor: um lote grande não pode estourar o tempo do cron. */
const MAX_PLAYBOOK_REMINDERS = 200

/**
 * Portal Defenz: avisa os donos de POPs cujo prazo de revisão venceu.
 * Retorna quantos e-mails saíram.
 *
 * Compara instantes (`reviewDueAt <= now`), sem fronteira de dia — por isso não
 * há questão de fuso aqui. Marca `reviewReminderSent` para não reavisar até a
 * próxima verificação (que reseta a flag).
 */
export async function notificarPlaybooksVencidos(): Promise<number> {
  const vencidos = await db.playbook.findMany({
    where: {
      isArchived: false,
      reviewReminderSent: false,
      reviewDueAt: { lte: new Date() },
    },
    select: {
      id: true,
      title: true,
      owner: { select: { id: true, email: true, name: true } },
    },
    take: MAX_PLAYBOOK_REMINDERS,
  })

  const appUrl = process.env.NEXTAUTH_URL || 'https://defenz-todo.vercel.app'
  let enviados = 0

  for (const playbook of vencidos) {
    // Sem dono não há para quem mandar — e marcar como avisado esconderia o item
    // para sempre. Deixa pendente de propósito.
    if (!playbook.owner?.email) continue

    await sendEmailWithChecks(
      {
        userId: playbook.owner.id,
        emailType: 'deadline',
        to: playbook.owner.email,
        subject: `Revisar POP: ${playbook.title}`,
        react: PlaybookReviewEmail({
          playbookTitle: playbook.title,
          ownerName: playbook.owner.name,
          playbookId: playbook.id,
          appUrl,
        }),
      },
      'deadlineApproaching'
    )

    await db.playbook.update({
      where: { id: playbook.id },
      data: { reviewReminderSent: true },
    })
    enviados++
  }

  return enviados
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return crypto.timingSafeEqual(bufA, bufB)
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (timing-safe comparison)
    const authHeader = request.headers.get('authorization') || ''
    const expected = `Bearer ${process.env.CRON_SECRET || ''}`
    if (!process.env.CRON_SECRET || !timingSafeEqual(authHeader, expected)) {
      throw new ApiError('Nao autorizado', 401)
    }

    const today = new Date()
    today.setHours(23, 59, 59, 999)

    // Find demandas with reminder due today or earlier, not yet sent, not completed
    const demandas = await db.demanda.findMany({
      where: {
        reminderDate: { lte: today },
        reminderSent: false,
        status: { not: 'concluida' },
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
      },
    })

    let sent = 0
    let skipped = 0

    for (const demanda of demandas) {
      // Determine recipient: assignee user or creator
      let recipientEmail = demanda.user.email
      let recipientUserId = demanda.user.id

      if (demanda.assignee) {
        // Try to find the assignee user by name or email
        const assigneeUser = await db.user.findFirst({
          where: {
            OR: [
              { name: { equals: demanda.assignee, mode: 'insensitive' } },
              { email: { equals: demanda.assignee, mode: 'insensitive' } },
            ],
          },
          select: { id: true, email: true },
        })
        if (assigneeUser) {
          recipientEmail = assigneeUser.email
          recipientUserId = assigneeUser.id
        }
      }

      const appUrl = process.env.NEXTAUTH_URL || 'https://defenz-todo.vercel.app'

      const result = await sendEmailWithChecks(
        {
          userId: recipientUserId,
          emailType: 'deadline', // Reuse deadline type for reminders
          to: recipientEmail,
          subject: `Lembrete: ${demanda.title}`,
          react: ReminderEmail({
            demandaTitle: demanda.title,
            demandaDescription: demanda.description,
            assignee: demanda.assignee,
            appUrl,
          }),
        },
        'deadlineApproaching'
      )

      if (result.success) {
        sent++
      } else {
        skipped++
      }

      // Mark as sent regardless (to avoid re-sending)
      await db.demanda.update({
        where: { id: demanda.id },
        data: { reminderSent: true },
      })
    }

    // Passo do Portal ISOLADO: uma falha no frescor dos POPs não pode derrubar
    // os lembretes de Demanda, que já rodaram acima.
    let playbooksNotificados = 0
    try {
      playbooksNotificados = await notificarPlaybooksVencidos()
    } catch (err) {
      console.error('Cron de frescor de playbooks falhou:', err)
    }

    return successResponse(
      { total: demandas.length, sent, skipped, playbooksNotificados },
      `Lembretes processados: ${sent} enviados, ${skipped} ignorados, ${playbooksNotificados} POPs a revisar`
    )
  } catch (error) {
    return handleApiError(error)
  }
}
