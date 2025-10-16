import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { db } from '@/lib/db'
import { updateCommentSchema, cuidSchema } from '@/lib/validations/comment'

// PUT /api/activities/[id]/comments/[commentId] - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Await params (Next.js 15)
    const { id, commentId } = await params

    // Validate activity ID format
    const activityIdValidation = cuidSchema.safeParse(id)
    if (!activityIdValidation.success) {
      return NextResponse.json(
        { error: 'ID de atividade inválido' },
        { status: 400 }
      )
    }

    // Validate comment ID format
    const commentIdValidation = cuidSchema.safeParse(commentId)
    if (!commentIdValidation.success) {
      return NextResponse.json(
        { error: 'ID de comentário inválido' },
        { status: 400 }
      )
    }
    const body = await request.json()

    // Validar dados
    const validation = updateCommentSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: validation.error.issues },
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

    // Buscar comentário e verificar ownership
    const existingComment = await db.activityComment.findUnique({
      where: { id: commentId }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário é o dono do comentário ou admin
    if (existingComment.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sem permissão para editar este comentário' },
        { status: 403 }
      )
    }

    // Atualizar comentário
    const comment = await db.activityComment.update({
      where: { id: commentId },
      data: {
        content: validation.data.content
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

    return NextResponse.json(comment)
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Update comment error:', error)
    }
    return NextResponse.json(
      { error: 'Erro ao atualizar comentário' },
      { status: 500 }
    )
  }
}

// DELETE /api/activities/[id]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Await params (Next.js 15)
    const { id, commentId } = await params

    // Validate activity ID format
    const activityIdValidation = cuidSchema.safeParse(id)
    if (!activityIdValidation.success) {
      return NextResponse.json(
        { error: 'ID de atividade inválido' },
        { status: 400 }
      )
    }

    // Validate comment ID format
    const commentIdValidation = cuidSchema.safeParse(commentId)
    if (!commentIdValidation.success) {
      return NextResponse.json(
        { error: 'ID de comentário inválido' },
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

    // Buscar comentário e verificar ownership
    const existingComment = await db.activityComment.findUnique({
      where: { id: commentId }
    })

    if (!existingComment) {
      return NextResponse.json(
        { error: 'Comentário não encontrado' },
        { status: 404 }
      )
    }

    // Verificar se o usuário é o dono do comentário ou admin
    if (existingComment.userId !== user.id && user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sem permissão para deletar este comentário' },
        { status: 403 }
      )
    }

    // Deletar comentário
    await db.activityComment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Delete comment error:', error)
    }
    return NextResponse.json(
      { error: 'Erro ao deletar comentário' },
      { status: 500 }
    )
  }
}
