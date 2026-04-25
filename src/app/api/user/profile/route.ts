import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { updateProfileSchema } from '@/lib/validations/profile'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const dbUser = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    if (!dbUser) throw new ApiError('Usuario nao encontrado', 404)

    let preferences = await db.notificationPreferences.findUnique({
      where: { userId: user.id },
    })

    if (!preferences) {
      preferences = await db.notificationPreferences.create({
        data: { userId: user.id },
      })
    }

    return successResponse({
      user: dbUser,
      preferences: {
        notificationEmail: preferences.notificationEmail,
        emailEnabled: preferences.emailEnabled,
        activityAssigned: preferences.activityAssigned,
        deadlineApproaching: preferences.deadlineApproaching,
        statusChanged: preferences.statusChanged,
        quietHoursStart: preferences.quietHoursStart,
        quietHoursEnd: preferences.quietHoursEnd,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    const body = await request.json()
    const { name, notificationEmail, emailEnabled, activityAssigned, deadlineApproaching, statusChanged, quietHoursStart, quietHoursEnd } = updateProfileSchema.parse(body)

    // Update user name if provided
    if (name !== undefined) {
      await db.user.update({
        where: { id: user.id },
        data: { name },
      })
    }

    // Upsert notification preferences
    const preferences = await db.notificationPreferences.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        notificationEmail: notificationEmail || null,
        emailEnabled: emailEnabled ?? true,
        activityAssigned: activityAssigned ?? true,
        deadlineApproaching: deadlineApproaching ?? true,
        statusChanged: statusChanged ?? true,
        quietHoursStart: quietHoursStart || null,
        quietHoursEnd: quietHoursEnd || null,
      },
      update: {
        ...(notificationEmail !== undefined && { notificationEmail: notificationEmail || null }),
        ...(emailEnabled !== undefined && { emailEnabled }),
        ...(activityAssigned !== undefined && { activityAssigned }),
        ...(deadlineApproaching !== undefined && { deadlineApproaching }),
        ...(statusChanged !== undefined && { statusChanged }),
        ...(quietHoursStart !== undefined && { quietHoursStart: quietHoursStart || null }),
        ...(quietHoursEnd !== undefined && { quietHoursEnd: quietHoursEnd || null }),
      },
    })

    return successResponse({ preferences }, 'Preferencias salvas')
  } catch (error) {
    return handleApiError(error)
  }
}
