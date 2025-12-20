"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface ActivityEvolutionData {
    date: string // YYYY-MM-DD
    calls: number
    emails: number
    meetings: number
    proposals: number
    total: number
}

interface ActivityEvolutionChartProps {
    data: ActivityEvolutionData[]
}

export function ActivityEvolutionChart({ data }: ActivityEvolutionChartProps) {
    // Formatar data para exibição
    const chartData = data.map((item) => {
        const [year, month, day] = item.date.split('-')
        return {
            ...item,
            dateFormatted: `${day}/${month}`
        }
    })

    // Custom Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-sm mb-2">{label}</p>
                    {payload.map((entry: any) => (
                        <div
                            key={entry.dataKey}
                            className="flex items-center justify-between gap-4 text-xs"
                        >
                            <span style={{ color: entry.color }}>{entry.name}:</span>
                            <span className="font-semibold">{entry.value}</span>
                        </div>
                    ))}
                </div>
            )
        }
        return null
    }

    if (data.length === 0) {
        return (
            <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Evolução da Produtividade (30 dias)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Dados insuficientes para exibir o gráfico.</p>
                        <p className="text-sm mt-2">
                            Registre produtividade diária para ver a evolução.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="bg-card border-border shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Evolução da Produtividade (Últimos 30 dias)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="dateFormatted"
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            style={{ fontSize: '12px' }}
                        />
                        <YAxis
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            style={{ fontSize: '12px' }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            wrapperStyle={{ paddingTop: '20px' }}
                            iconType="line"
                        />
                        <Line
                            type="monotone"
                            dataKey="calls"
                            name="Ligações"
                            stroke="#3B82F6"
                            strokeWidth={2}
                            dot={{ fill: '#3B82F6', r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="emails"
                            name="Emails"
                            stroke="#10B981"
                            strokeWidth={2}
                            dot={{ fill: '#10B981', r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="meetings"
                            name="Reuniões"
                            stroke="#8B5CF6"
                            strokeWidth={2}
                            dot={{ fill: '#8B5CF6', r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                        <Line
                            type="monotone"
                            dataKey="proposals"
                            name="Propostas"
                            stroke="#F59E0B"
                            strokeWidth={2}
                            dot={{ fill: '#F59E0B', r: 3 }}
                            activeDot={{ r: 5 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
