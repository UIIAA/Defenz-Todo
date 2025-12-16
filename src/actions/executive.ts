'use server'

import { db } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

// --- Types ---
export interface ExecutiveData {
    marketingLists: any[]
    opportunities: any[]
    clients: any[]
}

// --- Fetch Data ---
export async function getExecutiveData(): Promise<ExecutiveData> {
    const user = await requireAuth()

    const [marketingLists, opportunities, clients] = await Promise.all([
        db.marketingList.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        }),
        db.opportunity.findMany({
            where: { userId: user.id, status: { not: 'closed_lost' } }, // Show active opportunities
            orderBy: { createdAt: 'desc' },
            include: { client: true }
        }),
        db.client.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        })
    ])

    return { marketingLists, opportunities, clients }
}

// --- Marketing Lists ---
export async function upsertMarketingList(data: any) {
    const user = await requireAuth()

    if (data.id) {
        await db.marketingList.update({
            where: { id: data.id, userId: user.id },
            data: {
                name: data.name,
                sentDate: data.sentDate ? new Date(data.sentDate) : null,
                validatedContacts: Number(data.validatedContacts) || 0,
                origin: data.origin,
                callsCount: Number(data.callsCount) || 0,
                emailsCount: Number(data.emailsCount) || 0,
                meetingsCount: Number(data.meetingsCount) || 0,
                proposalsCount: Number(data.proposalsCount) || 0,
                leadsGenerated: Number(data.leadsGenerated) || 0,
                conversionRate: data.conversionRate
            }
        })
    } else {
        await db.marketingList.create({
            data: {
                userId: user.id,
                name: data.name || 'Nova Lista',
                sentDate: data.sentDate ? new Date(data.sentDate) : null,
                validatedContacts: Number(data.validatedContacts) || 0,
                origin: data.origin,
                callsCount: Number(data.callsCount) || 0,
                emailsCount: Number(data.emailsCount) || 0,
                meetingsCount: Number(data.meetingsCount) || 0,
                proposalsCount: Number(data.proposalsCount) || 0,
                leadsGenerated: Number(data.leadsGenerated) || 0,
                conversionRate: data.conversionRate
            }
        })
    }
    revalidatePath('/dashboard/executive')
    revalidatePath('/dashboard/executive/manage')
    return { success: true }
}

export async function deleteMarketingList(id: string) {
    const user = await requireAuth()
    await db.marketingList.delete({
        where: { id, userId: user.id }
    })
    revalidatePath('/dashboard/executive')
    revalidatePath('/dashboard/executive/manage')
    return { success: true }
}

// --- Opportunities ---
export async function updateOpportunityExecutiveFields(id: string, data: any) {
    const user = await requireAuth()

    await db.opportunity.update({
        where: { id, userId: user.id },
        data: {
            responsibleExecutive: data.responsibleExecutive,
            licenseCount: data.licenseCount ? Number(data.licenseCount) : null,
            additionalServices: data.additionalServices,
            origin: data.origin,
            entryDate: data.entryDate ? new Date(data.entryDate) : null,
            lastContact: data.lastContact ? new Date(data.lastContact) : null,
            nextAction: data.nextAction,
            stage: data.stage,
            value: data.value ? Number(data.value) : undefined
        }
    })
    revalidatePath('/dashboard/executive')
    revalidatePath('/dashboard/executive/manage')
    return { success: true }
}

// --- Clients ---
export async function updateClientExecutiveFields(id: string, data: any) {
    const user = await requireAuth()

    await db.client.update({
        where: { id, userId: user.id },
        data: {
            licenseCount: data.licenseCount ? Number(data.licenseCount) : null,
            invoiceValue: data.invoiceValue ? Number(data.invoiceValue) : null,
            status: data.status,
            billingDate: data.billingDate ? new Date(data.billingDate) : null,
            origin: data.origin,
            salesCycle: data.salesCycle
        }
    })
    revalidatePath('/dashboard/executive')
    revalidatePath('/dashboard/executive/manage')
    return { success: true }
}
