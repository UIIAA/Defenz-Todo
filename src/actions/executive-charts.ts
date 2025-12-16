'use server'

import { db as prisma } from '@/lib/db'

export async function getExecutiveChartData() {
    try {
        // 1. Funil Geral
        const contactsCount = await prisma.client.count()
        const callsCount = await prisma.interaction.count({
            where: { type: { in: ['call', 'Call', 'ligacao', 'Ligacao'] } }
        })
        const emailsCount = await prisma.interaction.count({
            where: { type: { in: ['email', 'Email'] } }
        })
        const meetingsCount = await prisma.interaction.count({
            where: { type: { in: ['meeting', 'Meeting', 'reuniao', 'Reuniao'] } }
        })
        const proposalsCount = await prisma.opportunity.count({
            where: {
                OR: [
                    { status: 'proposal' },
                    { stage: { contains: 'Proposta' } }
                ]
            }
        })

        const funilGeralData = [
            { name: 'Número de contatos validados', value: contactsCount },
            { name: 'Total de Ligações', value: callsCount },
            { name: 'Total de Emails Enviados', value: emailsCount },
            { name: 'Reuniões Agendadas', value: meetingsCount },
            { name: 'Propostas Enviadas', value: proposalsCount },
        ]

        // 2. Dados por Lista (MarketingList)
        const lists = await prisma.marketingList.findMany({
            include: {
                opportunities: {
                    include: {
                        interactions: true
                    }
                },
                clients: true
            }
        })

        const conversionData = lists.map(list => {
            const contacts = list.clients.length
            const opportunities = list.opportunities

            // Agregando interações de todas as oportunidades da lista
            let calls = 0
            let emails = 0
            let meetings = 0

            opportunities.forEach(opp => {
                opp.interactions.forEach(int => {
                    const type = int.type.toLowerCase()
                    if (type.includes('call') || type.includes('ligacao')) calls++
                    if (type.includes('email')) emails++
                    if (type.includes('meeting') || type.includes('reuniao')) meetings++
                })
            })

            const proposals = opportunities.filter(o =>
                o.status === 'proposal' || (o.stage && o.stage.includes('Proposta'))
            ).length

            return {
                name: list.name,
                propostas: proposals,
                reunioes: meetings,
                emails: emails,
                ligacoes: calls,
                contatos: contacts
            }
        })

        // 3. Pipeline por Valor
        const opportunities = await prisma.opportunity.findMany({
            select: {
                stage: true,
                status: true,
                value: true
            }
        })

        // Agrupar por estágio e somar valor
        const pipelineMap = new Map<string, number>()

        opportunities.forEach(opp => {
            // Usa 'stage' se existir, senão usa 'status' traduzido
            let stageName = opp.stage || opp.status

            // Normalização básica de status
            if (opp.status === 'prospecting') stageName = 'Contato Inicial'
            if (opp.status === 'qualification') stageName = 'Qualificação'
            if (opp.status === 'proposal') stageName = 'Proposta Enviada'
            if (opp.status === 'negotiation') stageName = 'Negociação'
            if (opp.status === 'closed_won') stageName = 'Fechado Ganho'

            const currentValue = pipelineMap.get(stageName) || 0
            pipelineMap.set(stageName, currentValue + Number(opp.value || 0))
        })

        const pipelineValueData = Array.from(pipelineMap.entries()).map(([name, value]) => ({
            name,
            value
        })).sort((a, b) => a.value - b.value) // Ordenar por valor crescente

        // 4. Atividade Vs Resultado (Baseado nas Listas)
        const activityVsResultData = lists.map(list => {
            const opportunities = list.opportunities

            let activitiesCount = 0 // Calls + Emails
            let meetingsCount = 0

            opportunities.forEach(opp => {
                opp.interactions.forEach(int => {
                    const type = int.type.toLowerCase()
                    if (type.includes('call') || type.includes('ligacao') || type.includes('email')) {
                        activitiesCount++
                    }
                    if (type.includes('meeting') || type.includes('reuniao')) {
                        meetingsCount++
                    }
                })
            })

            return {
                name: list.name,
                atividades: activitiesCount,
                reunioes: meetingsCount
            }
        })

        // 5. Insight Imediato (Por Origem)
        // Agrupar clientes e oportunidades por origem
        const origins = await prisma.client.groupBy({
            by: ['origin'],
            _count: {
                id: true
            }
        })

        // Para cada origem, buscar métricas adicionais
        const insightTableData = await Promise.all(origins.map(async (originGroup) => {
            const originName = originGroup.origin || 'Desconhecido'

            // Contatos (Clientes)
            const contatos = originGroup._count.id

            // Buscar oportunidades desta origem para contar interações
            const opportunities = await prisma.opportunity.findMany({
                where: { origin: originName },
                include: { interactions: true }
            })

            let ligacoes = 0
            let reunioes = 0

            opportunities.forEach(opp => {
                opp.interactions.forEach(int => {
                    const type = int.type.toLowerCase()
                    if (type.includes('call') || type.includes('ligacao')) ligacoes++
                    if (type.includes('meeting') || type.includes('reuniao')) reunioes++
                })
            })

            // Calcular taxa (Reuniões / Ligações ou Reuniões / Contatos?)
            // Usando Reuniões / Contatos como exemplo simples, ou 0 se não houver dados
            const taxaVal = contatos > 0 ? (reunioes / contatos) * 100 : 0
            const taxa = `${taxaVal.toFixed(1)}%`

            return {
                origem: originName,
                contatos,
                ligacoes,
                reunioes,
                taxa
            }
        }))

        return {
            funilGeralData,
            conversionData,
            pipelineValueData,
            activityVsResultData,
            insightTableData
        }

    } catch (error) {
        console.error('Error fetching executive chart data:', error)
        return {
            funilGeralData: [],
            conversionData: [],
            pipelineValueData: [],
            activityVsResultData: [],
            insightTableData: []
        }
    }
}
