'use server'

import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { subDays, format, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export interface ReportStats {
    summary: {
        calls: number
        emails: number
        meetings: number
        total: number
    }
    byType: {
        name: string
        value: number
        color: string
    }[]
    timeline: {
        date: string
        calls: number
        emails: number
        meetings: number
    }[]
}

export async function getInteractionStats(): Promise<ReportStats> {
    const user = await requireAuth()
    const endDate = new Date()
    const startDate = subDays(endDate, 30)

    // 1. Buscar INTERAÇÕES individuais (Calls, Emails, Meetings logged via CRM/Timeline)
    const interactions = await db.interaction.findMany({
        where: {
            userId: user.id,
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        orderBy: {
            date: 'asc'
        }
    })

    // 2. Buscar ATIVIDADES DIÁRIAS (Logged via Executive Dashboard / Fast Track)
    const dailyActivities = await db.dailyActivityLog.findMany({
        where: {
            userId: user.id,
            date: {
                gte: startDate,
                lte: endDate
            }
        }
    })

    // 3. Agregar dados por dia
    const timelineMap = new Map<string, { calls: number; emails: number; meetings: number }>()

    // Inicializar timeline com zeros para todos os dias (garante continuidade no gráfico)
    for (let i = 0; i <= 30; i++) {
        const date = subDays(endDate, 30 - i)
        const dateKey = format(date, 'dd/MM', { locale: ptBR })
        timelineMap.set(dateKey, { calls: 0, emails: 0, meetings: 0 })
    }

    // Processar Interações Individuais
    interactions.forEach(interaction => {
        const dateKey = format(interaction.date, 'dd/MM', { locale: ptBR })
        const current = timelineMap.get(dateKey)
        if (current) {
            if (interaction.type === 'call') current.calls++
            else if (interaction.type === 'email') current.emails++
            else if (interaction.type === 'meeting') current.meetings++
        }
    })

    // Processar Atividades Diárias (Somar aos contadores existentes)
    dailyActivities.forEach(activity => {
        const dateKey = format(activity.date, 'dd/MM', { locale: ptBR })
        // Tenta pegar pelo dia exato. 
        // Nota: DailyActivityLog.date geralmente é 12:00, então deve bater com o dia se format for consistente.
        let current = timelineMap.get(dateKey)

        // Se por algum motivo fuso horário deslocar, tentamos garantir (mas format dd/MM deve segurar)
        if (!current) {
            // Fallback: se a chave não existir (ex: data fora do range por horas), ignora ou cria.
            // Aqui assumimos que o range inicialização cobre tudo.
            return
        }

        current.calls += activity.calls
        current.emails += activity.emails
        current.meetings += activity.meetings
        // Proposals não estão no gráfico original, mas poderiam ser adicionadas futuro
    })

    // 4. Gerar Resumo Total
    const timeline = Array.from(timelineMap.values())
    const summary = {
        calls: timeline.reduce((acc, day) => acc + day.calls, 0),
        emails: timeline.reduce((acc, day) => acc + day.emails, 0),
        meetings: timeline.reduce((acc, day) => acc + day.meetings, 0),
        total: 0
    }
    summary.total = summary.calls + summary.emails + summary.meetings

    // 5. Formatar dados para o Gráfico
    const finalTimeline = Array.from(timelineMap.entries()).map(([date, stats]) => ({
        date,
        ...stats
    }))

    const byType = [
        { name: 'Ligações', value: summary.calls, color: '#3b82f6' }, // blue-500
        { name: 'Emails', value: summary.emails, color: '#a855f7' }, // purple-500
        { name: 'Reuniões', value: summary.meetings, color: '#22c55e' } // green-500
    ]

    return {
        summary,
        byType,
        timeline: finalTimeline
    }
}
