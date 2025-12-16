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

    // Buscar todas as interações dos últimos 30 dias
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

    // Calcular resumo
    const summary = {
        calls: interactions.filter(i => i.type === 'call').length,
        emails: interactions.filter(i => i.type === 'email').length,
        meetings: interactions.filter(i => i.type === 'meeting').length,
        total: interactions.length
    }

    // Dados para gráfico de pizza/barras
    const byType = [
        { name: 'Ligações', value: summary.calls, color: '#3b82f6' }, // blue-500
        { name: 'Emails', value: summary.emails, color: '#a855f7' }, // purple-500
        { name: 'Reuniões', value: summary.meetings, color: '#22c55e' } // green-500
    ]

    // Dados para timeline (agrupados por dia)
    const timelineMap = new Map<string, { calls: number; emails: number; meetings: number }>()

    // Inicializar timeline com zeros para todos os dias
    for (let i = 0; i <= 30; i++) {
        const date = subDays(endDate, 30 - i)
        const dateKey = format(date, 'dd/MM', { locale: ptBR })
        timelineMap.set(dateKey, { calls: 0, emails: 0, meetings: 0 })
    }

    // Preencher com dados reais
    interactions.forEach(interaction => {
        const dateKey = format(interaction.date, 'dd/MM', { locale: ptBR })
        const current = timelineMap.get(dateKey)
        if (current) {
            if (interaction.type === 'call') current.calls++
            else if (interaction.type === 'email') current.emails++
            else if (interaction.type === 'meeting') current.meetings++
        }
    })

    const timeline = Array.from(timelineMap.entries()).map(([date, stats]) => ({
        date,
        ...stats
    }))

    return {
        summary,
        byType,
        timeline
    }
}
