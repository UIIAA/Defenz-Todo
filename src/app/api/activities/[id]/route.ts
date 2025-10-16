import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { createAuditLog } from '@/lib/audit'
import { sendEmailWithChecks } from '@/lib/email'
import StatusChanged from '@/emails/StatusChanged'
import { findDuplicateActivity } from '@/lib/db-utils'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params (Next.js 15)
    const { id } = await params

    const activity = await db.activity.findUnique({
      where: { id }
    })

    if (!activity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Soft delete
    const deletedActivity = await db.activity.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Create audit log
    await createAuditLog({
      action: 'DELETE',
      entityType: 'Activity',
      entityId: id,
      userId: user.id,
      userEmail: user.email || '',
      changes: {
        title: activity.title,
        area: activity.area,
        deletedAt: new Date().toISOString()
      }
    })

    // Send deletion notification email (non-blocking)
    if (user.email) {
      sendEmailWithChecks(
        {
          userId: user.id,
          emailType: 'deleted',
          activityId: id,
          to: user.email,
          subject: `Atividade Deletada: ${activity.title}`,
          react: StatusChanged({
            activityTitle: activity.title,
            area: activity.area,
            oldStatus: 'Em Andamento',
            newStatus: 'Pendente', // Placeholder, will show as deleted in context
            changedBy: user.name || user.email,
            activityUrl: `${process.env.NEXTAUTH_URL}/dashboard/activities`
          })
        },
        'activityDeleted'
      ).catch(error => {
        console.error('Failed to send deletion email:', error)
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Activity deleted successfully'
    })
  } catch (error) {
    console.error('Delete activity error:', error)
    return NextResponse.json(
      { error: 'Failed to delete activity' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Await params (Next.js 15)
    const { id } = await params

    const data = await request.json()

    // Get old activity data to check for status change
    const oldActivity = await db.activity.findUnique({
      where: { id }
    })

    if (!oldActivity) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    // Check for duplicates if title or area changed (case-insensitive)
    if (
      data.title !== oldActivity.title ||
      data.area !== oldActivity.area
    ) {
      const duplicate = await findDuplicateActivity(
        user.id,
        data.title,
        data.area,
        id // Exclude current activity
      )

      if (duplicate) {
        return NextResponse.json(
          {
            error: `Atividade duplicada! Já existe uma atividade com o título "${data.title}" na área "${data.area}"`
          },
          { status: 409 }
        )
      }
    }

    const activity = await db.activity.update({
      where: { id },
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
        cost: data.cost
      }
    })

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'Activity',
      entityId: id,
      userId: user.id,
      userEmail: user.email || '',
      changes: data
    })

    // Send status change email if status changed
    if (oldActivity.status !== data.status && user.email) {
      const getStatusLabel = (status: string) => {
        switch (status) {
          case 'pending': return 'Pendente' as const
          case 'in_progress': return 'Em Andamento' as const
          case 'completed': return 'Concluído' as const
          default: return 'Pendente' as const
        }
      }

      // Send email notification (non-blocking)
      sendEmailWithChecks(
        {
          userId: user.id,
          emailType: 'status_change',
          activityId: activity.id,
          to: user.email,
          subject: `Status Atualizado: ${activity.title}`,
          react: StatusChanged({
            activityTitle: activity.title,
            area: activity.area,
            oldStatus: getStatusLabel(oldActivity.status),
            newStatus: getStatusLabel(activity.status),
            changedBy: user.name || user.email,
            activityUrl: `${process.env.NEXTAUTH_URL}/dashboard/activities`
          })
        },
        'statusChanged'
      ).catch(error => {
        console.error('Failed to send status change email:', error)
      })
    }

    return NextResponse.json(activity)
  } catch (error) {
    console.error('Update activity error:', error)
    return NextResponse.json(
      { error: 'Failed to update activity' },
      { status: 500 }
    )
  }
}
