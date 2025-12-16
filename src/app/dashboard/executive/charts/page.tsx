import ExecutiveCharts from '@/components/executive/ExecutiveCharts'
import { getExecutiveChartData } from '@/actions/executive-charts'

export default async function ExecutiveChartsPage() {
    const chartData = await getExecutiveChartData()

    return (
        <div className="p-6 space-y-6 min-h-screen bg-background text-foreground">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Gráficos Executivos</h1>
                <p className="text-muted-foreground mt-2">
                    Análise visual detalhada do funil de vendas e performance das listas.
                </p>
            </div>

            <ExecutiveCharts data={chartData} />
        </div>
    )
}
