import { Suspense } from "react"
import Link from "next/link"
import {
    getExecutiveMetrics,
    getFunnelData,
    getPipelineByStage,
    getListsPerformance,
    getTopOpportunities,
    getClosedClients,
    getMrrEvolution
} from "@/actions/dashboard"
import { ExecutiveDashboardClient } from "@/components/dashboard/executive-dashboard-client"
import { Button } from "@/components/ui/button"
import { Settings2 } from "lucide-react"

export const metadata = {
    title: "Dashboard Executivo | Defenz",
    description: "Visão estratégica de vendas e métricas",
}

export default async function ExecutiveDashboardPage() {
    // Buscar dados em paralelo para melhor performance
    const [
        metrics,
        funnelData,
        pipelineByStage,
        listsPerformance,
        topOpportunities,
        closedClients,
        mrrEvolution
    ] = await Promise.all([
        getExecutiveMetrics().catch(() => null),
        getFunnelData().catch(() => []),
        getPipelineByStage().catch(() => []),
        getListsPerformance().catch(() => []),
        getTopOpportunities().catch(() => []),
        getClosedClients().catch(() => []),
        getMrrEvolution().catch(() => [])
    ])

    // Placeholder para métricas vazias se falhar
    const safeMetrics = metrics || {
        receitaFechada: 0,
        clientesFechados: 0,
        pipelineTotal: 0,
        pipelineQtd: 0,
        reunioes: 0,
        totalContatos: 0,
        totalAtividades: 0,
        ligacoes: 0,
        emails: 0,
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Executivo</h2>
                    <p className="text-muted-foreground">
                        Acompanhamento estratégico de vendas, pipeline e atividades.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/executive/manage">
                        <Button variant="outline" className="gap-2">
                            <Settings2 className="h-4 w-4" />
                            Gerenciar Dados
                        </Button>
                    </Link>
                    <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-full border border-border hidden md:inline-block">
                        Atualizado em {new Date().toLocaleDateString('pt-BR')}
                    </span>
                </div>
            </div>

            <Suspense fallback={<div className="text-foreground flex items-center justify-center p-12">Carregando métricas...</div>}>
                <ExecutiveDashboardClient
                    metrics={safeMetrics}
                    funnelData={funnelData}
                    pipelineByStage={pipelineByStage}
                    listsPerformance={listsPerformance}
                    topOpportunities={topOpportunities}
                    closedClients={closedClients}
                    mrrEvolution={mrrEvolution}
                />
            </Suspense>
        </div>
    )
}
