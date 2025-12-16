'use server'

import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// ============================================================
// CLIENTS
// ============================================================

export async function getClients() {
    const user = await requireAuth()

    return await db.client.findMany({
        where: { userId: user.id },
        orderBy: { name: 'asc' },
        include: {
            _count: {
                select: { opportunities: true }
            }
        }
    })
}

export async function createClient(data: {
    name: string
    email?: string
    phone?: string
    company?: string
    segment?: string
    notes?: string
}) {
    const user = await requireAuth()

    const client = await db.client.create({
        data: {
            ...data,
            userId: user.id
        }
    })

    revalidatePath('/dashboard/crm/clients')
    return client
}

// ============================================================
// OPPORTUNITIES
// ============================================================

export async function getOpportunities() {
    const user = await requireAuth()

    return await db.opportunity.findMany({
        where: { userId: user.id },
        include: {
            client: true,
            _count: {
                select: { interactions: true }
            }
        },
        orderBy: { updatedAt: 'desc' }
    })
}

export async function searchOpportunities(query: string) {
    const user = await requireAuth()

    return await db.opportunity.findMany({
        where: {
            userId: user.id,
            OR: [
                { title: { contains: query, mode: 'insensitive' } },
                { client: { name: { contains: query, mode: 'insensitive' } } }
            ]
        },
        select: {
            id: true,
            title: true,
            status: true,
            client: {
                select: {
                    name: true
                }
            }
        },
        take: 10,
        orderBy: { updatedAt: 'desc' }
    })
}

export async function createOpportunity(data: {
    title: string
    clientId: string
    status?: string
    value?: number
    priority?: string
    description?: string
    expectedCloseDate?: Date
}) {
    const user = await requireAuth()

    const opportunity = await db.opportunity.create({
        data: {
            ...data,
            userId: user.id
        }
    })

    revalidatePath('/dashboard/crm/pipeline')
    return opportunity
}

export async function updateOpportunityStatus(id: string, status: string) {
    const user = await requireAuth()

    const opportunity = await db.opportunity.update({
        where: {
            id,
            userId: user.id
        },
        data: { status }
    })

    revalidatePath('/dashboard/crm/pipeline')
    return opportunity
}

export async function getOpportunityById(id: string) {
    const user = await requireAuth()

    return await db.opportunity.findUnique({
        where: {
            id,
            userId: user.id
        },
        include: {
            client: true,
            interactions: {
                orderBy: { date: 'desc' },
                include: {
                    user: {
                        select: { name: true }
                    }
                }
            }
        }
    })
}

// ============================================================
// INTERACTIONS
// ============================================================

export async function createInteraction(data: {
    opportunityId: string
    type: string
    content: string
    date?: Date
}) {
    const user = await requireAuth()

    // Verificar se a oportunidade pertence ao usuário
    const opportunity = await db.opportunity.findUnique({
        where: { id: data.opportunityId, userId: user.id }
    })

    if (!opportunity) {
        throw new Error('Opportunity not found or access denied')
    }

    const interaction = await db.interaction.create({
        data: {
            ...data,
            userId: user.id
        }
    })

    revalidatePath(`/dashboard/crm/opportunities/${data.opportunityId}`)
    return interaction
}
