import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { sendEmailWithChecks } from '@/lib/email'
import ActivityAssigned from '@/emails/ActivityAssigned'

export async function GET() {
  try {
    const activities = await db.activity.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(activities)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Manual check since Prisma doesn't support case-insensitive search on SQLite
    const allActivities = await db.activity.findMany({
      where: {
        userId: user.id!,
        deletedAt: null
      }
    })

    const isDuplicate = allActivities.some(activity =>
      activity.title.trim().toLowerCase() === data.title.trim().toLowerCase() &&
      activity.area.trim().toLowerCase() === data.area.trim().toLowerCase()
    )

    if (isDuplicate) {
      return NextResponse.json(
        {
          error: 'Duplicate activity',
          message: `Atividade duplicada! Já existe uma atividade com o título "${data.title}" na área "${data.area}"`
        },
        { status: 409 }
      )
    }

    const activity = await db.activity.create({
      data: {
        title: data.title,
        area: data.area,
        priority: data.priority,
        status: data.status,
        description: data.description,
        responsible: data.responsible,
        deadline: data.deadline,
        location: data.location,
        how: data.how,
        cost: data.cost,
        userId: user.id!
      }
    })

    // Send assignment email if responsible person is assigned
    if (data.responsible && user.email) {
      const getPriorityLabel = (priority: number) => {
        switch (priority) {
          case 0: return 'Alta' as const
          case 1: return 'Média' as const
          case 2: return 'Baixa' as const
          default: return 'Média' as const
        }
      }

      // Send email notification (non-blocking)
      sendEmailWithChecks(
        {
          userId: user.id!,
          emailType: 'assigned',
          activityId: activity.id,
          to: user.email,
          subject: `Nova Atividade Atribuída: ${activity.title}`,
          react: ActivityAssigned({
            activityTitle: activity.title,
            activityDescription: activity.description || undefined,
            area: activity.area,
            priority: getPriorityLabel(activity.priority),
            deadline: activity.deadline || undefined,
            location: activity.location || undefined,
            assignedBy: user.name || user.email,
            activityUrl: `${process.env.NEXTAUTH_URL}/dashboard/activities`
          })
        },
        'activityAssigned'
      ).catch(error => {
        console.error('Failed to send assignment email:', error)
      })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Error creating activity:', error)
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 })
  }
}