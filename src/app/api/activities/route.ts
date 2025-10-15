import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { sendEmailWithChecks } from '@/lib/email'
import ActivityAssigned from '@/emails/ActivityAssigned'
import { createActivitySchema } from '@/lib/validations/activity'
import { handleApiError, createdResponse, ApiError } from '@/lib/api-helpers'

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

    return NextResponse.json({ success: true, data: activities, count: activities.length })
  } catch (error) {
    console.error('Error fetching activities:', error)
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      throw new ApiError('Não autorizado', 401)
    }

    if (!user.id) {
      throw new ApiError('ID de usuário inválido', 400)
    }

    // Parse e validar dados com Zod
    const body = await request.json()
    const validatedData = createActivitySchema.parse(body)

    // Verificação otimizada de duplicatas - busca específica ao invés de carregar tudo
    const existingActivity = await db.activity.findFirst({
      where: {
        userId: user.id,
        deletedAt: null,
        title: {
          equals: validatedData.title,
          mode: 'insensitive' // Case-insensitive (funciona em PostgreSQL, não em SQLite)
        },
        area: {
          equals: validatedData.area,
          mode: 'insensitive'
        }
      },
      select: { id: true } // Apenas o ID, não precisa de todos os campos
    })

    if (existingActivity) {
      throw new ApiError(
        `Atividade duplicada! Já existe uma atividade com o título "${validatedData.title}" na área "${validatedData.area}"`,
        409
      )
    }

    const activity = await db.activity.create({
      data: {
        ...validatedData,
        userId: user.id
      }
    })

    // Send assignment email if responsible person is assigned
    if (validatedData.responsible && user.email) {
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
          userId: user.id,
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

    return createdResponse(activity, 'Atividade criada com sucesso')
  } catch (error) {
    console.error('Error creating activity:', error)
    return handleApiError(error)
  }
}