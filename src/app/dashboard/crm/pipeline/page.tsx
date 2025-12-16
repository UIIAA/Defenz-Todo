import { getOpportunities, getClients } from '@/actions/crm'
import { PipelineBoard } from '@/components/crm/PipelineBoard'
import { AddOpportunityDialog } from '@/components/crm/AddOpportunityDialog'

export default async function PipelinePage() {
    const opportunities = await getOpportunities()
    const clients = await getClients()

    // Serializar Decimal para number para passar para Client Component
    const serializedOpportunities = opportunities.map(opp => ({
        ...opp,
        value: opp.value ? Number(opp.value) : 0,
        client: { name: opp.client.name }
    }))

    const clientOptions = clients.map(c => ({ id: c.id, name: c.name }))

    return (
        <div className="space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between flex-none">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Pipeline de Vendas</h2>
                    <p className="text-muted-foreground">Gerencie seus casos e oportunidades.</p>
                </div>
                <AddOpportunityDialog clients={clientOptions} />
            </div>

            <div className="flex-1 min-h-0">
                <PipelineBoard opportunities={serializedOpportunities} />
            </div>
        </div>
    )
}
