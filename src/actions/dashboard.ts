"use server"

import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

// --- NOVAS ACTIONS EXECUTIVAS (Sua implementação) ---

export async function getExecutiveMetrics() {
    const user = await requireAuth()

    // 1. Receita Fechada (Opportunities closed_won)
    const closedWonDeals = await db.opportunity.aggregate({
        where: {
            userId: user.id,
            status: "closed_won"
        },
        _sum: {
            value: true,
        },
        _count: {
            id: true,
        }
    })

    // List Performance (Legacy placeholder - commenting out to avoid build error as 'product' field does not exist)
    /*
    const listPerformanceRaw = await db.opportunity.groupBy({
        by: ['product'], 
        _sum: {
            value: true,
        },
        _count: {
            _all: true,
        },
        where: {
            userId: user.id,
        },
    });

    const listPerformance = listPerformanceRaw.map(item => ({
        name: item.product || 'N/A',
        revenue: item._sum.value ? Number(item._sum.value) : 0,
        conversion: 0, 
    }));
    */
    const listPerformance: any[] = []; // Returning empty array as fallback

    // Pipeline by Stage
    const pipelineByStageRaw = await db.opportunity.groupBy({
        by: ['status'],
        _sum: {
            value: true,
        },
        _count: {
            _all: true,
        },
        where: {
            userId: user.id, // Added userId filter
            status: {
                in: ['OPEN', 'CONTACTED', 'PROPOSAL', 'NEGOTIATION'],
            },
        },
    });

    const pipelineByStage = pipelineByStageRaw.map((stage) => ({
        stage: stage.status,
        value: stage._sum.value ? Number(stage._sum.value) : 0,
        count: stage._count._all,
    }));

    // 1. Total Pipeline Value (Sum of all active opportunities)
    const pipelineValueRaw = await db.opportunity.aggregate({
        _sum: {
            value: true,
        },
        where: {
            userId: user.id, // Added userId filter
            status: {
                notIn: ["closed_won", "closed_lost"], // Adjusted to match original logic
            },
        },
    });
    // Ensure we handle potential null/undefined from _sum and convert Decimal to number
    const pipelineValue = pipelineValueRaw._sum.value
        ? pipelineValueRaw._sum.value.toNumber() // Changed to .toNumber()
        : 0;

    // 2. Won Value (Last 30 days) - This metric is new, assuming a startDate is needed
    // For now, let's define a simple startDate for demonstration, or remove if not intended
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const wonValueRaw = await db.opportunity.aggregate({
        _sum: {
            value: true,
        },
        where: {
            userId: user.id, // Added userId filter
            status: 'closed_won', // Adjusted to match original status
            updatedAt: {
                gte: startDate,
            },
        },
    });
    const wonValue = wonValueRaw._sum.value
        ? wonValueRaw._sum.value.toNumber() // Changed to .toNumber()
        : 0;

    // 3. Conversion Rate (Won / Total Closed)
    const wonCount = await db.opportunity.count({
        where: {
            userId: user.id, // Added userId filter
            status: 'closed_won', // Adjusted to match original status
            updatedAt: {
                gte: startDate,
            },
        },
    });

    const lostCount = await db.opportunity.count({
        where: {
            userId: user.id, // Added userId filter
            status: 'closed_lost', // Adjusted to match original status
            updatedAt: {
                gte: startDate,
            },
        },
    });

    const totalClosed = wonCount + lostCount;
    const conversionRate = totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0;

    // 4. Active Deal Count
    const activeDeals = await db.opportunity.count({
        where: {
            userId: user.id, // Added userId filter
            status: {
                notIn: ["closed_won", "closed_lost"], // Adjusted to match original logic
            },
        },
    });

    // 5. Tasks/Activities completed
    const completedTasks = await db.interaction.count({
        where: {
            userId: user.id, // Added userId filter
            type: {
                not: 'NOTE', // Assuming notes aren't "tasks"
            },
            createdAt: {
                gte: startDate,
            },
        },
    });

    // Original metrics that were not replaced by the provided block
    // 2. Pipeline Total (Opportunities not closed) - This was replaced by pipelineValueRaw/pipelineValue
    const pipeline = await db.opportunity.aggregate({
        where: {
            userId: user.id,
            status: {
                notIn: ["closed_won", "closed_lost"]
            }
        },
        _sum: {
            value: true,
        },
        _count: {
            id: true,
        }
    })

    // 3. Reuniões Agendadas (Interactions type='meeting')
    const meetings = await db.interaction.count({
        where: {
            userId: user.id,
            type: "meeting"
        }
    })

    // 4. Total de Contatos (Leads/Clients)
    const totalContacts = await db.client.count({
        where: {
            userId: user.id
        }
    })

    // 5. Atividades (Log de calls/emails via Interaction + Activity)
    const interactionsCount = await db.interaction.count({
        where: {
            userId: user.id,
            type: {
                in: ["call", "email"]
            }
        }
    })

    const activitiesCount = await db.activity.count({
        where: {
            userId: user.id,
            status: "completed"
        }
    })

    // 6. Win Rate (Won / (Won + Lost))
    // Reusing conversionRate logic but making it explicit for the dashboard
    const winRate = totalClosed > 0 ? (wonCount / totalClosed) * 100 : 0;

    // 7. Average Cycle Time (Days between createdAt and updatedAt for closed_won deals)
    const wonDealsWithDates = await db.opportunity.findMany({
        where: {
            userId: user.id,
            status: 'closed_won'
        },
        select: {
            createdAt: true,
            updatedAt: true
        }
    });

    const totalCycleDays = wonDealsWithDates.reduce((acc, deal) => {
        const diffTime = Math.abs(deal.updatedAt.getTime() - deal.createdAt.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return acc + diffDays;
    }, 0);

    const avgCycleTime = wonDealsWithDates.length > 0 ? Math.round(totalCycleDays / wonDealsWithDates.length) : 0;

    return {
        receitaFechada: closedWonDeals._sum.value?.toNumber() || 0,
        mrr: closedWonDeals._sum.value?.toNumber() || 0, // Using total revenue as proxy for MRR as per requirements
        mrr: closedWonDeals._sum.value?.toNumber() || 0,
        clientesFechados: closedWonDeals._count.id || 0,
        pipelineTotal: pipeline._sum.value?.toNumber() || 0,
        pipelineQtd: pipeline._count.id || 0,
        reunioes: totalMeetings,
        winRate: Math.round(winRate),
        avgCycleTime: avgCycleTime,
        totalContatos: totalContacts,
        totalAtividades: totalCalls + totalEmails, // Approx total activity
        ligacoes: totalCalls,
        emails: totalEmails,
    }
}

export async function getMrrEvolution() {
    const user = await requireAuth()
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(endDate.getMonth() - 5) // Last 6 months

    const deals = await db.opportunity.findMany({
        where: {
            userId: user.id,
            status: 'closed_won',
            updatedAt: {
                gte: startDate
            }
        },
        select: {
            value: true,
            updatedAt: true
        }
    })

    // Group by Month
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const groupedData = new Map<string, number>()

    // Initialize last 6 months with 0
    for (let i = 5; i >= 0; i--) {
        const d = new Date()
        d.setMonth(d.getMonth() - i)
        const key = months[d.getMonth()]
        groupedData.set(key, 0)
    }

    deals.forEach(deal => {
        const key = months[deal.updatedAt.getMonth()]
        // Only add if it's one of the months we are tracking (handles border cases)
        if (groupedData.has(key)) {
            const current = groupedData.get(key) || 0
            groupedData.set(key, current + (deal.value?.toNumber() || 0))
        }
    })

    return Array.from(groupedData.entries()).map(([name, value]) => ({
        name,
        value
    }))
}

export async function getPipelineByStage() {
    const user = await requireAuth()

    const opportunities = await db.opportunity.findMany({
        where: {
            userId: user.id,
            status: {
                notIn: ["closed_won", "closed_lost"]
            }
        },
        select: {
            status: true,
            stage: true,
            value: true,
        }
    })

    const grouped = opportunities.reduce((acc, curr) => {
        const key = curr.stage || curr.status // Use status as fallback
        if (!acc[key]) {
            acc[key] = { name: key, value: 0, count: 0 }
        }
        acc[key].value += curr.value?.toNumber() || 0
        acc[key].count += 1
        return acc
    }, {} as Record<string, { name: string, value: number, count: number }>)

    return Object.values(grouped).sort((a, b) => b.value - a.value)
}

export async function getFunnelData() {
    const user = await requireAuth()

    const lists = await db.marketingList.aggregate({
        where: { userId: user.id },
        _sum: {
            leadsGenerated: true,
            callsCount: true,
            emailsCount: true,
            meetingsCount: true,
            proposalsCount: true,
        }
    })

    const meetings = await db.interaction.count({
        where: { userId: user.id, type: "meeting" }
    })

    const proposals = await db.opportunity.count({
        where: {
            userId: user.id,
            OR: [
                { status: "proposal" },
                { stage: { contains: "Proposta", mode: "insensitive" } } // Busca 'proposta' no stage
            ]
        }
    })

    // Combine Auto + Manual
    const totalMeetings = meetings + (lists._sum.meetingsCount || 0)
    const totalProposals = proposals + (lists._sum.proposalsCount || 0)

    // Funnel Logic: 
    // Top: Leads (Manual Lists Leads + CRM Clients?) -> Let's stick to Lists Leads for Top of Funnel as usually Leads are cold.
    // Middle: Activities (Calls + Emails + Meetings)
    // Bottom: Proposals

    return [
        { name: 'Contatos', value: lists._sum.leadsGenerated || 0, fill: '#3B82F6' },
        { name: 'Ligações', value: lists._sum.callsCount || 0, fill: '#10B981' },
        { name: 'Emails', value: lists._sum.emailsCount || 0, fill: '#F59E0B' },
        { name: 'Reuniões', value: totalMeetings, fill: '#8B5CF6' },
        { name: 'Propostas', value: totalProposals, fill: '#EF4444' },
    ]
}

export async function getListsPerformance() {
    const user = await requireAuth()

    const lists = await db.marketingList.findMany({
        where: { userId: user.id },
        include: {
            opportunities: {
                select: {
                    id: true,
                    interactions: true,
                    status: true,
                    stage: true
                }
            }
        }
    })

    return lists.map(list => {
        const meetingsCount = list.opportunities.reduce((acc, opp) => {
            const oppMeetings = opp.interactions.filter(i => i.type === 'meeting').length
            return acc + oppMeetings
        }, 0)

        const proposalsCount = list.opportunities.filter(o =>
            o.status === 'proposal' || o.stage?.toLowerCase().includes('proposta')
        ).length

        return {
            id: list.id,
            nome: list.name,
            data: list.createdAt.toLocaleDateString('pt-BR'),
            contatos: list.leadsGenerated || list.validatedContacts,
            ligacoes: list.callsCount,
            emails: list.emailsCount,
            reunioes: meetingsCount,
            propostas: proposalsCount,
            origem: list.origin || 'N/A'
        }
    })
}

export async function getTopOpportunities() {
    const user = await requireAuth()

    const opportunities = await db.opportunity.findMany({
        where: {
            userId: user.id,
            status: { notIn: ['closed_won', 'closed_lost'] }
        },
        orderBy: {
            value: 'desc'
        },
        take: 5,
        include: {
            client: {
                select: {
                    name: true,
                    company: true
                }
            }
        }
    })

    return opportunities.map(opp => ({
        id: opp.id,
        empresa: opp.client?.company || opp.client?.name || opp.title,
        valor: opp.value?.toNumber() || 0,
        estagio: opp.stage || opp.status,
        origem: opp.origin || 'N/A',
        licencas: opp.licenseCount || 0,
    }))
}

export async function getClosedClients() {
    const user = await requireAuth()

    const clients = await db.opportunity.findMany({
        where: {
            userId: user.id,
            status: 'closed_won'
        },
        orderBy: {
            updatedAt: 'desc'
        },
        take: 5,
        include: {
            client: true
        }
    })

    return clients.map(deal => ({
        id: deal.id,
        cliente: deal.client?.company || deal.client?.name || deal.title,
        valor: deal.value?.toNumber() || 0,
        status: deal.status,
        origem: deal.origin || 'N/A'
    }))
}

// --- LEGACY / MAIN DASHBOARD ACTION (Recriada para compatibilidade) ---

/**
 * Retorna métricas globais para o Dashboard Principal (src/app/dashboard/page.tsx)
 */
export async function getDashboardMetrics() {
    const user = await requireAuth()

    // 1. Pipeline Stats
    const opportunities = await db.opportunity.findMany({
        where: { userId: user.id }
    })

    const totalValue = opportunities.reduce((acc, opp) => acc + (opp.value?.toNumber() || 0), 0)
    const totalCount = opportunities.length

    const wonCount = opportunities.filter(o => o.status === 'closed_won').length
    const closedCount = opportunities.filter(o => o.status === 'closed_won' || o.status === 'closed_lost').length
    const winRate = closedCount > 0 ? (wonCount / closedCount) * 100 : 0

    const statusCounts = opportunities.reduce((acc, opp) => {
        acc[opp.status] = (acc[opp.status] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    const priorityCounts = opportunities.reduce((acc, opp) => {
        acc[opp.priority] = (acc[opp.priority] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    // 2. Actionable Items (High priority opps not closed)
    const actionableItems = await db.opportunity.findMany({
        where: {
            userId: user.id,
            priority: 'high',
            status: { notIn: ['closed_won', 'closed_lost'] }
        },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: { client: true }
    })

    // 3. Recent Interactions
    const recentInteractions = await db.interaction.findMany({
        where: { userId: user.id },
        take: 5,
        orderBy: { date: 'desc' },
        include: { opportunity: true }
    })

    return {
        pipeline: {
            totalValue,
            totalCount,
            winRate,
            statusCounts,
            priorityCounts
        },
        actionableItems,
        recentInteractions
    }
}
