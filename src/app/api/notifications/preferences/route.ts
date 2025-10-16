import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let preferences = await db.notificationPreferences.findUnique({
      where: { userId: user.id }
    })

    // Create default preferences if they don't exist
    if (!preferences) {
      preferences = await db.notificationPreferences.create({
        data: { userId: user.id }
      })
    }

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notification preferences' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Validate data
    const {
      activityAssigned,
      deadlineApproaching,
      statusChanged,
      activityDeleted,
      dailyDigest,
      weeklyReport,
      quietHoursStart,
      quietHoursEnd
    } = data

    // Validate quiet hours format if provided
    if (quietHoursStart && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(quietHoursStart)) {
      return NextResponse.json(
        { error: 'Invalid quiet hours start format. Use HH:MM format.' },
        { status: 400 }
      )
    }

    if (quietHoursEnd && !/^([01]\d|2[0-3]):([0-5]\d)$/.test(quietHoursEnd)) {
      return NextResponse.json(
        { error: 'Invalid quiet hours end format. Use HH:MM format.' },
        { status: 400 }
      )
    }

    const preferences = await db.notificationPreferences.upsert({
      where: { userId: user.id },
      update: {
        activityAssigned: activityAssigned ?? undefined,
        deadlineApproaching: deadlineApproaching ?? undefined,
        statusChanged: statusChanged ?? undefined,
        activityDeleted: activityDeleted ?? undefined,
        dailyDigest: dailyDigest ?? undefined,
        weeklyReport: weeklyReport ?? undefined,
        quietHoursStart: quietHoursStart ?? undefined,
        quietHoursEnd: quietHoursEnd ?? undefined
      },
      create: {
        userId: user.id,
        activityAssigned: activityAssigned ?? true,
        deadlineApproaching: deadlineApproaching ?? true,
        statusChanged: statusChanged ?? true,
        activityDeleted: activityDeleted ?? true,
        dailyDigest: dailyDigest ?? false,
        weeklyReport: weeklyReport ?? false,
        quietHoursStart,
        quietHoursEnd
      }
    })

    return NextResponse.json(preferences)
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    )
  }
}
