import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { db } from '@/lib/db'
import { createCommentSchema } from '@/lib/validations/comment'

// GET /api/activities/[id]/comments - List all comments for an activity
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const activityId = params.id

    // Verificar se a atividade existe e pertence ao usuário
    const activity = await db.activity.findFirst({
      where: {
        id: activityId,
        user: {
          email: session.user.email
        }
      }
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Atividade não encontrada' },
        { status: 404 }
      )
    }

    // Buscar comentários ordenados por data (mais recente primeiro)
    const comments = await db.activityComment.findMany({
      where: {
        activityId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        content: true,
        userName: true,
        userEmail: true,
        createdAt: true,
        updatedAt: true,
        userId: true
      }
    })

    return NextResponse.json(comments)
  } catch (error: any) {
    console.error('Get comments error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar comentários', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/activities/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const activityId = params.id
    const body = await request.json()

    // Validar dados
    const validation = createCommentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.errors },
        { status: 400 }
      )
    }

    // Buscar usuário
    const user = await db.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se a atividade existe e pertence ao usuário
    const activity = await db.activity.findFirst({
      where: {
        id: activityId,
        userId: user.id
      }
    })

    if (!activity) {
      return NextResponse.json(
        { error: 'Atividade não encontrada' },
        { status: 404 }
      )
    }

    // Criar comentário
    const comment = await db.activityComment.create({
      data: {
        content: validation.data.content,
        activityId,
        userId: user.id,
        userName: user.name || user.email.split('@')[0],
        userEmail: user.email
      },
      select: {
        id: true,
        content: true,
        userName: true,
        userEmail: true,
        createdAt: true,
        updatedAt: true,
        userId: true
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error: any) {
    console.error('Create comment error:', error)
    return NextResponse.json(
      { error: 'Erro ao criar comentário', details: error.message },
      { status: 500 }
    )
  }
}
