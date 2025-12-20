"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { startOfDay, endOfDay, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns"

// ============================================================
// TYPES
// ============================================================

export interface DailyActivityInput {
    date: Date
    calls: number
    emails: number
    meetings: number
    proposals: number
    notes?: string
    marketingListId?: string
    opportunityId?: string
}

export interface DailyActivityStats {
    calls: number
    emails: number
    meetings: number
    proposals: number
    total: number
}

export interface DailyActivityComparison {
    current: DailyActivityStats
    previous: DailyActivityStats
    percentageChange: {
        calls: number
        emails: number
        meetings: number
        proposals: number
        total: number
    }
}

// ============================================================
// CREATE & UPDATE
// ============================================================

/**
 * Criar ou atualizar registro de atividades diárias
 */
export async function upsertDailyActivity(input: DailyActivityInput) {
    const user = await requireAuth()

    // Normalizar a data para início do dia no timezone local
    const normalizedDate = new Date(input.date.getFullYear(), input.date.getMonth(), input.date.getDate(), 0, 0, 0, 0)
    const dateStart = startOfDay(normalizedDate)
    const dateEnd = endOfDay(normalizedDate)

    // Verificar se já existe registro para essa data
    const existing = await db.dailyActivityLog.findFirst({
        where: {
            userId: user.id,
            date: {
                gte: dateStart,
                lte: dateEnd,
            },
        },
    })

    if (existing) {
        // Atualizar registro existente
        return await db.dailyActivityLog.update({
            where: { id: existing.id },
            data: {
                calls: input.calls,
                emails: input.emails,
                meetings: input.meetings,
                proposals: input.proposals,
                notes: input.notes,
                marketingListId: input.marketingListId,
                opportunityId: input.opportunityId,
            },
        })
    } else {
        // Criar novo registro com a data normalizada
        return await db.dailyActivityLog.create({
            data: {
                userId: user.id,
                date: normalizedDate,
                calls: input.calls,
                emails: input.emails,
                meetings: input.meetings,
                proposals: input.proposals,
                notes: input.notes,
                marketingListId: input.marketingListId,
                opportunityId: input.opportunityId,
            },
        })
    }
}

// ============================================================
// READ
// ============================================================

/**
 * Buscar atividades de uma data específica
 */
export async function getDailyActivity(date: Date) {
    const user = await requireAuth()

    // Normalizar a data para início do dia no timezone local
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0)
    const dateStart = startOfDay(normalizedDate)
    const dateEnd = endOfDay(normalizedDate)

    const activity = await db.dailyActivityLog.findFirst({
        where: {
            userId: user.id,
            date: {
                gte: dateStart,
                lte: dateEnd,
            },
        },
        include: {
            marketingList: {
                select: {
                    id: true,
                    name: true,
                },
            },
            opportunity: {
                select: {
                    id: true,
                    title: true,
                },
            },
        },
    })

    return activity
}

/**
 * Buscar estatísticas de um período
 */
export async function getDailyStats(startDate: Date, endDate: Date): Promise<DailyActivityStats> {
    const user = await requireAuth()

    const activities = await db.dailyActivityLog.findMany({
        where: {
            userId: user.id,
            date: {
                gte: startOfDay(startDate),
                lte: endOfDay(endDate),
            },
        },
    })

    const stats = activities.reduce(
        (acc, activity) => ({
            calls: acc.calls + activity.calls,
            emails: acc.emails + activity.emails,
            meetings: acc.meetings + activity.meetings,
            proposals: acc.proposals + activity.proposals,
            total: acc.total + activity.calls + activity.emails + activity.meetings + activity.proposals,
        }),
        { calls: 0, emails: 0, meetings: 0, proposals: 0, total: 0 }
    )

    return stats
}

/**
 * Buscar atividades de hoje
 */
export async function getTodayActivity() {
    return await getDailyActivity(new Date())
}

/**
 * Buscar estatísticas de hoje
 */
export async function getTodayStats(): Promise<DailyActivityStats> {
    const today = new Date()
    return await getDailyStats(today, today)
}

/**
 * Buscar resumo semanal (semana atual)
 */
export async function getWeeklySummary(): Promise<DailyActivityStats> {
    const now = new Date()
    const weekStart = startOfWeek(now, { weekStartsOn: 0 }) // Domingo
    const weekEnd = endOfWeek(now, { weekStartsOn: 0 })

    return await getDailyStats(weekStart, weekEnd)
}

/**
 * Buscar resumo mensal (mês atual)
 */
export async function getMonthlySummary(): Promise<DailyActivityStats> {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    return await getDailyStats(monthStart, monthEnd)
}

/**
 * Comparar dois períodos
 */
export async function getComparison(
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date
): Promise<DailyActivityComparison> {
    const current = await getDailyStats(currentStart, currentEnd)
    const previous = await getDailyStats(previousStart, previousEnd)

    const calculateChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0
        return Math.round(((current - previous) / previous) * 100)
    }

    return {
        current,
        previous,
        percentageChange: {
            calls: calculateChange(current.calls, previous.calls),
            emails: calculateChange(current.emails, previous.emails),
            meetings: calculateChange(current.meetings, previous.meetings),
            proposals: calculateChange(current.proposals, previous.proposals),
            total: calculateChange(current.total, previous.total),
        },
    }
}

/**
 * Comparar hoje vs ontem
 */
export async function getTodayVsYesterdayComparison(): Promise<DailyActivityComparison> {
    const today = new Date()
    const yesterday = subDays(today, 1)

    return await getComparison(today, today, yesterday, yesterday)
}

/**
 * Comparar esta semana vs semana passada
 */
export async function getThisWeekVsLastWeekComparison(): Promise<DailyActivityComparison> {
    const now = new Date()

    const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 })
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 0 })

    const lastWeekStart = startOfWeek(subDays(now, 7), { weekStartsOn: 0 })
    const lastWeekEnd = endOfWeek(subDays(now, 7), { weekStartsOn: 0 })

    return await getComparison(thisWeekStart, thisWeekEnd, lastWeekStart, lastWeekEnd)
}

/**
 * Comparar este mês vs mês passado
 */
export async function getThisMonthVsLastMonthComparison(): Promise<DailyActivityComparison> {
    const now = new Date()

    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)

    const lastMonth = subDays(thisMonthStart, 1)
    const lastMonthStart = startOfMonth(lastMonth)
    const lastMonthEnd = endOfMonth(lastMonth)

    return await getComparison(thisMonthStart, thisMonthEnd, lastMonthStart, lastMonthEnd)
}

/**
 * Buscar histórico dos últimos N dias
 */
export async function getActivityHistory(days: number = 7) {
    const user = await requireAuth()
    const endDate = new Date()
    const startDate = subDays(endDate, days - 1)

    const activities = await db.dailyActivityLog.findMany({
        where: {
            userId: user.id,
            date: {
                gte: startOfDay(startDate),
                lte: endOfDay(endDate),
            },
        },
        orderBy: {
            date: 'desc',
        },
        include: {
            marketingList: {
                select: {
                    id: true,
                    name: true,
                },
            },
            opportunity: {
                select: {
                    id: true,
                    title: true,
                },
            },
        },
    })

    return activities.map(activity => ({
        id: activity.id,
        date: activity.date,
        calls: activity.calls,
        emails: activity.emails,
        meetings: activity.meetings,
        proposals: activity.proposals,
        total: activity.calls + activity.emails + activity.meetings + activity.proposals,
        notes: activity.notes,
        marketingList: activity.marketingList,
        opportunity: activity.opportunity,
    }))
}

/**
 * Buscar dados para gráfico de evolução (últimos N dias)
 */
export async function getActivityEvolution(days: number = 30) {
    const user = await requireAuth()
    const endDate = new Date()
    const startDate = subDays(endDate, days - 1)

    const activities = await db.dailyActivityLog.findMany({
        where: {
            userId: user.id,
            date: {
                gte: startOfDay(startDate),
                lte: endOfDay(endDate),
            },
        },
        orderBy: {
            date: 'asc',
        },
    })

    return activities.map(activity => {
        // Formatar data garantindo timezone UTC para evitar conversões indesejadas
        const dateUTC = new Date(activity.date.getTime() + activity.date.getTimezoneOffset() * 60000)
        const year = dateUTC.getFullYear()
        const month = String(dateUTC.getMonth() + 1).padStart(2, '0')
        const day = String(dateUTC.getDate()).padStart(2, '0')
        const dateString = `${year}-${month}-${day}`

        return {
            date: dateString, // YYYY-MM-DD
            calls: activity.calls,
            emails: activity.emails,
            meetings: activity.meetings,
            proposals: activity.proposals,
            total: activity.calls + activity.emails + activity.meetings + activity.proposals,
        }
    })
}

// ============================================================
// DELETE
// ============================================================

/**
 * Deletar registro de atividades de uma data
 */
export async function deleteDailyActivity(id: string) {
    const user = await requireAuth()

    // Verificar se o registro pertence ao usuário
    const activity = await db.dailyActivityLog.findFirst({
        where: {
            id,
            userId: user.id,
        },
    })

    if (!activity) {
        throw new Error('Registro não encontrado ou você não tem permissão para deletá-lo')
    }

    return await db.dailyActivityLog.delete({
        where: { id },
    })
}

/**
 * Deletar TODOS os registros (útil para limpar dados de teste)
 */
export async function deleteAllDailyActivities() {
    const user = await requireAuth()

    return await db.dailyActivityLog.deleteMany({
        where: {
            userId: user.id,
        },
    })
}
