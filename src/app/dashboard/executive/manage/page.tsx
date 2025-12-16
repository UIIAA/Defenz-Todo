'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    getExecutiveData,
    upsertMarketingList,
    deleteMarketingList,
    updateOpportunityExecutiveFields,
    updateClientExecutiveFields,
    ExecutiveData
} from '@/actions/executive'
import { Plus, Trash2, Loader2, Briefcase, CheckSquare } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

export default function ExecutivePage() {
    const [data, setData] = useState<ExecutiveData | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const result = await getExecutiveData()
            setData(result)
        } catch (error) {
            console.error('Error loading data:', error)
            toast.error('Erro ao carregar dados.')
        } finally {
            setLoading(false)
        }
    }

    const handleAddList = async () => {
        try {
            await upsertMarketingList({ name: 'Nova Lista' })
            loadData()
            toast.success('Lista criada!')
        } catch (error) {
            toast.error('Erro ao criar lista.')
        }
    }

    const handleDeleteList = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir esta lista?')) return
        try {
            await deleteMarketingList(id)
            loadData()
            toast.success('Lista excluída!')
        } catch (error) {
            toast.error('Erro ao excluir lista.')
        }
    }

    const handleFieldChange = (id: string, field: string, value: any) => {
        // Local state update only
        const newData = { ...data! }
        const listIndex = newData.marketingLists.findIndex(l => l.id === id)
        if (listIndex === -1) return

        newData.marketingLists[listIndex] = { ...newData.marketingLists[listIndex], [field]: value }
        setData(newData)
    }

    const handleSaveList = async (list: any) => {
        try {
            await upsertMarketingList(list)
            toast.success('Lista salva com sucesso!')
        } catch (error) {
            toast.error('Erro ao salvar lista.')
        }
    }

    const handleUpdateOpportunity = async (id: string, field: string, value: any) => {
        // Optimistic update
        const newData = { ...data! }
        const oppIndex = newData.opportunities.findIndex(o => o.id === id)
        if (oppIndex === -1) return

        newData.opportunities[oppIndex] = { ...newData.opportunities[oppIndex], [field]: value }
        setData(newData)

        try {
            await updateOpportunityExecutiveFields(id, { [field]: value })
        } catch (error) {
            toast.error('Erro ao salvar alteração.')
            loadData()
        }
    }

    const handleUpdateClient = async (id: string, field: string, value: any) => {
        // Optimistic update
        const newData = { ...data! }
        const clientIndex = newData.clients.findIndex(c => c.id === id)
        if (clientIndex === -1) return

        newData.clients[clientIndex] = { ...newData.clients[clientIndex], [field]: value }
        setData(newData)

        try {
            await updateClientExecutiveFields(id, { [field]: value })
        } catch (error) {
            toast.error('Erro ao salvar alteração.')
            loadData()
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!data) return null

    return (
        <div className="min-h-screen bg-background p-6 space-y-8">

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                    <Briefcase className="h-8 w-8 text-primary" />
                    Visão Executiva
                </h1>
                <p className="text-muted-foreground mt-2">
                    Gerenciamento estratégico de listas, oportunidades e clientes.
                </p>
            </div>

            {/* 1. Listas de Marketing */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-primary">Listas de Marketing</CardTitle>
                    <Button onClick={handleAddList} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="h-4 w-4 mr-2" />
                        Nova Lista
                    </Button>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted">
                            <tr>
                                <th className="px-4 py-3">Nome da Lista</th>
                                <th className="px-4 py-3">Data Envio</th>
                                <th className="px-4 py-3">Contatos Validados</th>
                                <th className="px-4 py-3">Origem</th>
                                <th className="px-4 py-3">Ligações</th>
                                <th className="px-4 py-3">Emails</th>
                                <th className="px-4 py-3">Reuniões</th>
                                <th className="px-4 py-3">Propostas</th>
                                <th className="px-4 py-3">Leads Gerados</th>
                                <th className="px-4 py-3">Conversão</th>
                                <th className="px-4 py-3">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.marketingLists.map((list) => (
                                <tr key={list.id} className="border-b border-border hover:bg-muted/50">
                                    <td className="p-2 font-medium">
                                        <Input
                                            value={list.name}
                                            onChange={(e) => handleUpdateList(list.id, 'name', e.target.value)}
                                            className="h-8 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="date"
                                            value={list.sentDate ? format(new Date(list.sentDate), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => handleUpdateList(list.id, 'sentDate', e.target.value)}
                                            className="h-8 w-32 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={list.validatedContacts}
                                            onChange={(e) => handleUpdateList(list.id, 'validatedContacts', e.target.value)}
                                            className="h-8 w-20 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            value={list.origin || ''}
                                            onChange={(e) => handleUpdateList(list.id, 'origin', e.target.value)}
                                            className="h-8 w-24 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={list.callsCount}
                                            onChange={(e) => handleUpdateList(list.id, 'callsCount', e.target.value)}
                                            className="h-8 w-16 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={list.emailsCount}
                                            onChange={(e) => handleUpdateList(list.id, 'emailsCount', e.target.value)}
                                            className="h-8 w-16 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={list.meetingsCount || 0}
                                            onChange={(e) => handleUpdateList(list.id, 'meetingsCount', e.target.value)}
                                            className="h-8 w-16 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={list.proposalsCount || 0}
                                            onChange={(e) => handleUpdateList(list.id, 'proposalsCount', e.target.value)}
                                            className="h-8 w-16 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={list.leadsGenerated}
                                            onChange={(e) => handleUpdateList(list.id, 'leadsGenerated', e.target.value)}
                                            className="h-8 w-16 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            value={list.conversionRate || ''}
                                            onChange={(e) => handleUpdateList(list.id, 'conversionRate', e.target.value)}
                                            className="h-8 w-20 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeleteList(list.id)}
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* 2. Oportunidades em Andamento */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Oportunidades em Andamento</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted">
                            <tr>
                                <th className="px-4 py-3">Oportunidade</th>
                                <th className="px-4 py-3">Executivo</th>
                                <th className="px-4 py-3">Licenças</th>
                                <th className="px-4 py-3">Serviços Add</th>
                                <th className="px-4 py-3">Origem</th>
                                <th className="px-4 py-3">Data Entrada</th>
                                <th className="px-4 py-3">Estágio</th>
                                <th className="px-4 py-3">Valor Est.</th>
                                <th className="px-4 py-3">Último Contato</th>
                                <th className="px-4 py-3">Próx. Ação</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.opportunities.map((opp) => (
                                <tr key={opp.id} className="border-b border-border hover:bg-muted/50">
                                    <td className="p-2 font-medium">{opp.title}</td>
                                    <td className="p-2">
                                        <Input
                                            value={opp.responsibleExecutive || ''}
                                            onChange={(e) => handleUpdateOpportunity(opp.id, 'responsibleExecutive', e.target.value)}
                                            className="h-8 w-32 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={opp.licenseCount || ''}
                                            onChange={(e) => handleUpdateOpportunity(opp.id, 'licenseCount', e.target.value)}
                                            className="h-8 w-20 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            value={opp.additionalServices || ''}
                                            onChange={(e) => handleUpdateOpportunity(opp.id, 'additionalServices', e.target.value)}
                                            className="h-8 w-32 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            value={opp.origin || ''}
                                            onChange={(e) => handleUpdateOpportunity(opp.id, 'origin', e.target.value)}
                                            className="h-8 w-24 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="date"
                                            value={opp.entryDate ? format(new Date(opp.entryDate), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => handleUpdateOpportunity(opp.id, 'entryDate', e.target.value)}
                                            className="h-8 w-32 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            value={opp.stage || opp.status}
                                            onChange={(e) => handleUpdateOpportunity(opp.id, 'stage', e.target.value)}
                                            className="h-8 w-32 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={opp.value || ''}
                                            onChange={(e) => handleUpdateOpportunity(opp.id, 'value', e.target.value)}
                                            className="h-8 w-24 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="date"
                                            value={opp.lastContact ? format(new Date(opp.lastContact), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => handleUpdateOpportunity(opp.id, 'lastContact', e.target.value)}
                                            className="h-8 w-32 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            value={opp.nextAction || ''}
                                            onChange={(e) => handleUpdateOpportunity(opp.id, 'nextAction', e.target.value)}
                                            className="h-8 w-32 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* 3. Clientes Gerados */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-primary">Clientes Gerados</CardTitle>
                </CardHeader>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted">
                            <tr>
                                <th className="px-4 py-3">Cliente</th>
                                <th className="px-4 py-3">Licenças</th>
                                <th className="px-4 py-3">Valor Fatura</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Data Faturamento</th>
                                <th className="px-4 py-3">Origem</th>
                                <th className="px-4 py-3">Ciclo Venda</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.clients.map((client) => (
                                <tr key={client.id} className="border-b border-border hover:bg-muted/50">
                                    <td className="p-2 font-medium">{client.name}</td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={client.licenseCount || ''}
                                            onChange={(e) => handleUpdateClient(client.id, 'licenseCount', e.target.value)}
                                            className="h-8 w-20 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="number"
                                            value={client.invoiceValue || ''}
                                            onChange={(e) => handleUpdateClient(client.id, 'invoiceValue', e.target.value)}
                                            className="h-8 w-24 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            value={client.status || ''}
                                            onChange={(e) => handleUpdateClient(client.id, 'status', e.target.value)}
                                            className="h-8 w-32 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            type="date"
                                            value={client.billingDate ? format(new Date(client.billingDate), 'yyyy-MM-dd') : ''}
                                            onChange={(e) => handleUpdateClient(client.id, 'billingDate', e.target.value)}
                                            className="h-8 w-32 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            value={client.origin || ''}
                                            onChange={(e) => handleUpdateClient(client.id, 'origin', e.target.value)}
                                            className="h-8 w-24 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                    <td className="p-2">
                                        <Input
                                            value={client.salesCycle || ''}
                                            onChange={(e) => handleUpdateClient(client.id, 'salesCycle', e.target.value)}
                                            className="h-8 w-32 focus:ring-1 focus:ring-primary"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    )
}
