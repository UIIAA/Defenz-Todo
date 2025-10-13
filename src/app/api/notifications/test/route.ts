import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sendEmail } from '@/lib/email'
import ActivityAssigned from '@/emails/ActivityAssigned'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!user.email) {
      return NextResponse.json({ error: 'User email not found' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service not configured. Please set RESEND_API_KEY environment variable.' },
        { status: 503 }
      )
    }

    // Send test email using ActivityAssigned template
    const result = await sendEmail({
      userId: user.id!,
      emailType: 'assigned',
      to: user.email,
      subject: 'Teste de Notificação - Defenz To-Do',
      react: ActivityAssigned({
        activityTitle: 'Teste de Notificação por Email',
        activityDescription: 'Este é um email de teste para verificar se as notificações estão funcionando corretamente.',
        area: 'Sistema',
        priority: 'Média',
        deadline: new Date().toLocaleDateString('pt-BR'),
        location: 'Dashboard',
        assignedBy: user.name || user.email,
        activityUrl: `${process.env.NEXTAUTH_URL}/dashboard/activities`
      })
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Email de teste enviado com sucesso para ${user.email}`
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Falha ao enviar email de teste'
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Failed to send test email', details: error.message },
      { status: 500 }
    )
  }
}
