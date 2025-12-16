'use client'

import { updateOpportunityStatus } from '@/actions/crm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MoreHorizontal } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface Opportunity {
    id: string
    title: string
    client: { name: string }
    value: number | null
    priority: string
    status: string
    updatedAt: Date
}

interface PipelineBoardProps {
    opportunities: Opportunity[]
}

const COLUMNS = [
    { id: 'prospecting', label: 'Prospecção', color: 'bg-blue-100 dark:bg-blue-950' },
    { id: 'qualification', label: 'Qualificação', color: 'bg-yellow-100 dark:bg-yellow-950' },
    { id: 'proposal', label: 'Proposta', color: 'bg-orange-100 dark:bg-orange-950' },
    { id: 'negotiation', label: 'Negociação', color: 'bg-purple-100 dark:bg-purple-950' },
    { id: 'closed_won', label: 'Fechado Ganho', color: 'bg-green-100 dark:bg-green-950' },
    { id: 'closed_lost', label: 'Perdido', color: 'bg-red-100 dark:bg-red-950' },
]

export function PipelineBoard({ opportunities }: PipelineBoardProps) {
    const router = useRouter()

    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            await updateOpportunityStatus(id, newStatus)
            toast.success('Status atualizado')
        } catch (error) {
            toast.error('Erro ao atualizar status')
        }
    }

    const formatCurrency = (value: number | null) => {
        if (!value) return 'R$ 0,00'
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
    }

    return (
        <div className="flex h-[calc(100vh-200px)] gap-4 overflow-x-auto pb-4">
            {COLUMNS.map((col) => {
                const colOpps = opportunities.filter((o) => o.status === col.id)
                const totalValue = colOpps.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)

                return (
                    <div key={col.id} className="flex-none w-80 flex flex-col gap-2">
                        <div className={`p-3 rounded-md ${col.color} border border-border/50`}>
                            <div className="flex justify-between items-center mb-1">
                                <h3 className="font-semibold text-sm">{col.label}</h3>
                                <Badge variant="secondary" className="text-xs">{colOpps.length}</Badge>
                            </div>
                            <div className="text-xs text-muted-foreground font-medium">
                                {formatCurrency(totalValue)}
                            </div>
                        </div>

                        <ScrollArea className="flex-1">
                            <div className="flex flex-col gap-2 pr-2">
                                {colOpps.map((opp) => (
                                    <Card
                                        key={opp.id}
                                        className="cursor-pointer hover:border-primary transition-colors"
                                        onClick={() => router.push(`/dashboard/crm/opportunities/${opp.id}`)}
                                    >
                                        <CardHeader className="p-3 pb-0 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {opp.priority}
                                                </Badge>
                                                <div onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                                <MoreHorizontal className="h-3 w-3" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuSub>
                                                                <DropdownMenuSubTrigger>Mover para...</DropdownMenuSubTrigger>
                                                                <DropdownMenuPortal>
                                                                    <DropdownMenuSubContent>
                                                                        {COLUMNS.map((c) => (
                                                                            <DropdownMenuItem
                                                                                key={c.id}
                                                                                disabled={c.id === opp.status}
                                                                                onClick={() => handleStatusChange(opp.id, c.id)}
                                                                            >
                                                                                {c.label}
                                                                            </DropdownMenuItem>
                                                                        ))}
                                                                    </DropdownMenuSubContent>
                                                                </DropdownMenuPortal>
                                                            </DropdownMenuSub>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                            <CardTitle className="text-sm font-medium leading-tight">
                                                {opp.title}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-3 pt-2">
                                            <div className="text-xs text-muted-foreground mb-2">
                                                {opp.client.name}
                                            </div>
                                            <div className="font-semibold text-sm text-primary">
                                                {formatCurrency(opp.value)}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )
            })}
        </div>
    )
}
