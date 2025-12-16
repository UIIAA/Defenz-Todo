'use server'

import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export type CalendarEventType = 'activity' | 'opportunity' | 'interaction'

export interface CalendarEvent {
    id: string
    title: string
    date: Date
    type: CalendarEventType
    status?: string
    priority?: string | number
    description?: string
    meta?: any // Dados extras específicos de cada tipo
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
    const user = await requireAuth()

    // 1. Buscar Atividades
    const activities = await db.activity.findMany({
        where: { userId: user.id }
    })

    // 2. Buscar Oportunidades (pela data de fechamento prevista)
    const opportunities = await db.opportunity.findMany({
        where: {
            userId: user.id,
            expectedCloseDate: { not: null }
        },
        include: { client: true }
    })

    // 3. Buscar Interações
    const interactions = await db.interaction.findMany({
        where: { userId: user.id },
        include: { opportunity: true }
    })

    // Normalizar dados
    const events: CalendarEvent[] = []

    // Mapear Atividades
    activities.forEach(activity => {
        if (activity.deadline) {
            events.push({
                id: activity.id,
                title: activity.title,
                date: new Date(activity.deadline),
                type: 'activity',
                status: activity.status,
                priority: activity.priority,
                description: activity.description || undefined,
                meta: {
                    area: activity.area,
                    responsible: activity.responsible
                }
            })
        }
    })

    // Mapear Oportunidades
    opportunities.forEach(opp => {
        if (opp.expectedCloseDate) {
            events.push({
                id: opp.id,
                title: `Fechamento: ${opp.title}`,
                date: opp.expectedCloseDate,
                type: 'opportunity',
                status: opp.status,
                priority: opp.priority,
                description: `Cliente: ${opp.client.name} | Valor: R$ ${opp.value}`,
                meta: {
                    clientName: opp.client.name,
                    value: opp.value
                }
            })
        }
    })

    // Mapear Interações
    interactions.forEach(interaction => {
        events.push({
            id: interaction.id,
            title: `${interaction.type.charAt(0).toUpperCase() + interaction.type.slice(1)} - ${interaction.opportunity.title}`,
            date: interaction.date,
            type: 'interaction',
            description: interaction.content,
            meta: {
                opportunityTitle: interaction.opportunity.title,
                interactionType: interaction.type
            }
        })
    })

    // Ordenar por data
    return events.sort((a, b) => a.date.getTime() - b.date.getTime())
}
