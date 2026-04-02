import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { sendEmailWithChecks } from '@/lib/email'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { ReminderEmail } from './email-template'

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

    return successResponse(
      { total: demandas.length, sent, skipped },
      `Lembretes processados: ${sent} enviados, ${skipped} ignorados`
    )
  } catch (error) {
    return handleApiError(error)
  }
}
