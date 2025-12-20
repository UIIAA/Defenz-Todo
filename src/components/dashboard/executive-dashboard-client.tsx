"use client"

import React, { useState } from 'react';
import { ConversionFunnelChart, PipelineStageChart, ListsActivityChart } from './executive-charts';
import { MrrEvolutionChart } from './mrr-evolution-chart';
import { DailyActivityModal } from './daily-activity-modal';
import { DailySummaryCard } from './daily-summary-card';
import { ActivityHistoryTable } from './activity-history-table';
import { ActivityEvolutionChart } from './activity-evolution-chart';
import { PeriodComparisonCards } from './period-comparison-cards';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, DollarSign, Users, Briefcase, Clock, Target, FileText, Plus } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

// Tipos baseados no retorno das actions
interface DashboardProps {
    metrics: {
        receitaFechada: number;
        mrr?: number;
        clientesFechados: number;
        pipelineTotal: number;
        pipelineQtd: number;
        reunioes: number;
        winRate?: number;
        avgCycleTime?: number;
        totalContatos: number;
        totalAtividades: number;
        ligacoes: number;
        emails: number;
        todayActivities?: {
            calls: number;
            emails: number;
            meetings: number;
            proposals: number;
            total: number;
        };
    };
    funnelData: any[];
    pipelineByStage: any[];
    listsPerformance: any[];
    topOpportunities: any[];
    closedClients: any[];
    mrrEvolution: any[];
    activityHistory?: any[];
    activityEvolution?: any[];
    todayVsYesterday?: any;
    weekVsLastWeek?: any;
    monthVsLastMonth?: any;
}

export function ExecutiveDashboardClient({
    metrics,
    funnelData,
    pipelineByStage,
    listsPerformance,
    topOpportunities,
    closedClients,
    mrrEvolution,
    activityHistory = [],
    activityEvolution = [],
    todayVsYesterday,
    weekVsLastWeek,
    monthVsLastMonth,
}: DashboardProps) {
    const router = useRouter()
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleModalSuccess = () => {
        toast.success("Produtividade registrada!")
        router.refresh() // Atualizar dados
    }

    return (
        <div className="space-y-6">
            {/* Botão flutuante de registro rápido */}
            <div className="fixed bottom-6 right-6 z-50">
                <Button
                    onClick={() => setIsModalOpen(true)}
                    size="lg"
                    className="rounded-full shadow-lg hover:shadow-xl transition-all gap-2 h-14 px-6"
                >
                    <Plus className="h-5 w-5" />
                    Registrar Produtividade
                </Button>
            </div>

            {/* Modal de Registro */}
            <DailyActivityModal
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                onSuccess={handleModalSuccess}
            />
            {/* Header com KPI Cards */}
            {/* Header com KPI Cards (Ideal Layout: MRR, Pipeline, Reuniões, Win Rate, Ciclo) */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {/* MRR */}
                <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground text-xs uppercase font-semibold">MRR</p>
                                <p className="text-2xl font-bold mt-1 text-foreground">{formatCurrency(metrics.mrr || metrics.receitaFechada)}</p>
                                <p className="text-emerald-500 text-xs flex items-center mt-1 font-medium">
                                    <TrendingUp className="w-3 h-3 mr-1" />
                                    ↑ meta
                                </p>
                            </div>
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <DollarSign className="w-5 h-5 text-emerald-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Pipeline */}
                <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground text-xs uppercase font-semibold">Pipeline</p>
                                <p className="text-2xl font-bold mt-1 text-foreground">{formatCurrency(metrics.pipelineTotal)}</p>
                                <p className="text-muted-foreground text-xs mt-1">
                                    em aberto
                                </p>
                            </div>
                            <div className="p-2 bg-blue-500/10 rounded-lg">
                                <Briefcase className="w-5 h-5 text-blue-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Reuniões */}
                <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground text-xs uppercase font-semibold">Reuniões</p>
                                <p className="text-2xl font-bold mt-1 text-foreground">{metrics.reunioes}</p>
                                <p className="text-muted-foreground text-xs mt-1">
                                    este mês
                                </p>
                            </div>
                            <div className="p-2 bg-purple-500/10 rounded-lg">
                                <Users className="w-5 h-5 text-purple-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Win Rate */}
                <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground text-xs uppercase font-semibold">Win Rate</p>
                                <p className="text-2xl font-bold mt-1 text-foreground">{metrics.winRate || 0}%</p>
                                <p className="text-muted-foreground text-xs mt-1">
                                    prop→cli
                                </p>
                            </div>
                            <div className="p-2 bg-orange-500/10 rounded-lg">
                                <Target className="w-5 h-5 text-orange-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Ciclo Médio */}
                <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-5">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground text-xs uppercase font-semibold">Ciclo</p>
                                <p className="text-2xl font-bold mt-1 text-foreground">{metrics.avgCycleTime || 0}d</p>
                                <p className="text-muted-foreground text-xs mt-1">
                                    médio
                                </p>
                            </div>
                            <div className="p-2 bg-gray-500/10 rounded-lg">
                                <Clock className="w-5 h-5 text-gray-500" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-muted text-muted-foreground border border-border">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Visão Geral</TabsTrigger>
                    <TabsTrigger value="atividades" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Produtividade Diária</TabsTrigger>
                    <TabsTrigger value="pipeline" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Pipeline</TabsTrigger>
                    <TabsTrigger value="listas" className="data-[state=active]:bg-background data-[state=active]:text-foreground">Listas</TabsTrigger>
                </TabsList>

                {/* === TAB: OVERVIEW === */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Funil de Conversão */}
                        <Card className="bg-card border-border shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-card-foreground">Funil de Conversão</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ConversionFunnelChart data={funnelData} />
                            </CardContent>
                        </Card>

                        {/* Evolução MRR - NOVO (Substituindo Pipeline por Estágio na prioridade visual ou adicionando acima?) 
                            O User pediu +1 gráfico. Vamos colocar lado a lado ou em uma nova linha.
                            Como era grid-cols-2, vamos manter e colocar MRR Evolution onde estava Pipeline. 
                        */}
                        <Card className="bg-card border-border shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-card-foreground">Evolução MRR (Tendência)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <MrrEvolutionChart data={mrrEvolution} />
                            </CardContent>
                        </Card>

                        {/* Pipeline por Estágio Gráfico - Movendo para grid inteira ou 50% abaixo */}
                        <Card className="bg-card border-border shadow-lg lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-card-foreground">Pipeline por Estágio</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <PipelineStageChart data={pipelineByStage} />
                            </CardContent>
                        </Card>

                        {/* Top Oportunidades Table - Adjusted to Top 5 */}
                        <Card className="bg-card border-border shadow-lg lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-card-foreground">Top 5 Oportunidades</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-muted-foreground">
                                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-3">Empresa</th>
                                                <th className="px-4 py-3">Valor</th>
                                                <th className="px-4 py-3">Estágio</th>
                                                <th className="px-4 py-3">Origem</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {topOpportunities.slice(0, 5).map((opp, idx) => (
                                                <tr key={opp.id} className="border-b border-border hover:bg-muted/50">
                                                    <td className="px-4 py-3 font-medium text-foreground">{opp.empresa}</td>
                                                    <td className="px-4 py-3 text-emerald-500 font-medium">{formatCurrency(opp.valor)}</td>
                                                    <td className="px-4 py-3">
                                                        <Badge variant="outline" className={`
                              ${['Negociação', 'negotiation'].includes(opp.estagio) ? 'border-yellow-600 text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-500' :
                                                                ['Proposta Enviada', 'proposal'].includes(opp.estagio) ? 'border-blue-600 text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-500' :
                                                                    'border-border text-muted-foreground'}
                            `}>
                                                            {opp.estagio}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-4 py-3">{opp.origem}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* === TAB: ATIVIDADES DIÁRIAS === */}
                <TabsContent value="atividades" className="space-y-6">
                    {/* Card de Resumo de Hoje */}
                    {metrics.todayActivities && (
                        <DailySummaryCard
                            todayActivities={metrics.todayActivities}
                            comparison={todayVsYesterday?.percentageChange}
                        />
                    )}

                    {/* Cards de Comparação de Períodos */}
                    <PeriodComparisonCards
                        todayVsYesterday={todayVsYesterday}
                        weekVsLastWeek={weekVsLastWeek}
                        monthVsLastMonth={monthVsLastMonth}
                    />

                    {/* Gráfico de Evolução */}
                    <ActivityEvolutionChart data={activityEvolution} />

                    {/* Histórico dos Últimos 7 Dias */}
                    <ActivityHistoryTable activities={activityHistory} />
                </TabsContent>

                {/* === TAB: PIPELINE === */}
                <TabsContent value="pipeline" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {/* Clientes Fechados */}
                        <Card className="bg-card border-border shadow-lg col-span-full">
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-emerald-500 flex items-center gap-2">
                                    <span>✓</span> Clientes Fechados Recentemente
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {closedClients.map((client) => (
                                    <div key={client.id} className="bg-muted/50 rounded-lg p-4 border-l-4 border-emerald-500">
                                        <p className="font-semibold text-foreground">{client.cliente}</p>
                                        <p className="text-2xl font-bold text-emerald-500 mt-1">{formatCurrency(client.valor)}</p>
                                        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{client.status}</span>
                                            <span>{client.origem}</span>
                                        </div>
                                    </div>
                                ))}
                                {closedClients.length === 0 && (
                                    <div className="text-muted-foreground col-span-full text-center py-4">
                                        Nenhum cliente fechado encontrado.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* === TAB: LISTAS === */}
                <TabsContent value="listas" className="space-y-4">
                    {/* Gráfico de Atividades */}
                    <Card className="bg-card border-border shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-card-foreground">Volume de Atividades por Lista</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ListsActivityChart data={listsPerformance} />
                        </CardContent>
                    </Card>

                    {/* Tabela Detalhada */}
                    <Card className="bg-card border-border shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg font-semibold text-card-foreground">Performance Detalhada das Listas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-muted-foreground">
                                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                        <tr>
                                            <th className="px-4 py-3">Lista</th>
                                            <th className="px-4 py-3">Data Criação</th>
                                            <th className="px-4 py-3 text-center">Contatos</th>
                                            <th className="px-4 py-3 text-center">Ligações</th>
                                            <th className="px-4 py-3 text-center">Emails</th>
                                            <th className="px-4 py-3 text-center">Reuniões</th>
                                            <th className="px-4 py-3 text-center">Propostas</th>
                                            {/* <th className="px-4 py-3">Origem</th> */}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listsPerformance.map((lista) => (
                                            <tr key={lista.id} className="border-b border-border hover:bg-muted/50">
                                                <td className="px-4 py-3 font-medium text-foreground">{lista.nome}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{lista.data}</td>
                                                <td className="px-4 py-3 text-center">{lista.contatos}</td>
                                                <td className="px-4 py-3 text-center text-blue-500 font-medium">{lista.ligacoes}</td>
                                                <td className="px-4 py-3 text-center text-emerald-500 font-medium">{lista.emails}</td>
                                                <td className="px-4 py-3 text-center text-purple-500 font-bold bg-purple-100 dark:bg-purple-900/10 rounded">{lista.reunioes}</td>
                                                <td className="px-4 py-3 text-center text-orange-500 font-bold bg-orange-100 dark:bg-orange-900/10 rounded">{lista.propostas}</td>
                                                {/* <td className="px-4 py-3">{lista.origem}</td> */}
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-muted/80 font-semibold text-foreground">
                                        <tr>
                                            <td className="px-4 py-3">TOTAL</td>
                                            <td className="px-4 py-3"></td>
                                            <td className="px-4 py-3 text-center">{listsPerformance.reduce((a, b) => a + b.contatos, 0)}</td>
                                            <td className="px-4 py-3 text-center text-blue-500">{listsPerformance.reduce((a, b) => a + b.ligacoes, 0)}</td>
                                            <td className="px-4 py-3 text-center text-emerald-500">{listsPerformance.reduce((a, b) => a + b.emails, 0)}</td>
                                            <td className="px-4 py-3 text-center text-purple-500">{listsPerformance.reduce((a, b) => a + b.reunioes, 0)}</td>
                                            <td className="px-4 py-3 text-center text-orange-500">{listsPerformance.reduce((a, b) => a + b.propostas, 0)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
