import { getOpportunityById } from '@/actions/crm'
import { notFound } from 'next/navigation'
import { InteractionTimeline } from '@/components/crm/InteractionTimeline'
import { AddInteractionForm } from '@/components/crm/AddInteractionForm'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Building, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const opportunity = await getOpportunityById(id)

    if (!opportunity) {
        notFound()
    }

    const formatCurrency = (value: number | null) => {
        if (!value) return 'R$ 0,00'
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value))
    }

    const STATUS_LABELS: Record<string, string> = {
        prospecting: 'Prospecção',
        qualification: 'Qualificação',
        proposal: 'Proposta',
        negotiation: 'Negociação',
        closed_won: 'Fechado Ganho',
        closed_lost: 'Perdido',
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/crm/pipeline">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <div className="flex items-center gap-2">
                        <h2 className="text-2xl font-bold tracking-tight">{opportunity.title}</h2>
                        <Badge variant="outline">{STATUS_LABELS[opportunity.status] || opportunity.status}</Badge>
                    </div>
                    <p className="text-muted-foreground">
                        Cliente: <span className="font-medium text-foreground">{opportunity.client.name}</span>
                    </p>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-2xl font-bold text-primary">
                        {formatCurrency(Number(opportunity.value))}
                    </div>
                    <div className="text-sm text-muted-foreground">Valor Estimado</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Interações</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <AddInteractionForm opportunityId={opportunity.id} />
                            <InteractionTimeline interactions={opportunity.interactions} />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalhes do Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">Empresa</div>
                                <div className="flex items-center gap-2">
                                    <Building className="h-4 w-4 text-muted-foreground" />
                                    <span>{opportunity.client.company || '-'}</span>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">Contato</div>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{opportunity.client.email || '-'}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{opportunity.client.phone || '-'}</span>
                                    </div>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <div className="text-sm font-medium text-muted-foreground mb-1">Segmento</div>
                                <span>{opportunity.client.segment || '-'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Sobre o Caso</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {opportunity.description || 'Nenhuma descrição fornecida.'}
                            </p>
                            <div className="mt-4 pt-4 border-t">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Prioridade</span>
                                    <span className="capitalize font-medium">{opportunity.priority}</span>
                                </div>
                                <div className="flex justify-between text-sm mt-2">
                                    <span className="text-muted-foreground">Probabilidade</span>
                                    <span className="font-medium">{opportunity.probability}%</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
