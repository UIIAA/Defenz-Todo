"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface MrrEvolutionChartProps {
    data: {
        name: string
        value: number
    }[]
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function MrrEvolutionChart({ data }: MrrEvolutionChartProps) {
    if (!data || data.length === 0) {
        return <div className="h-[300px] flex items-center justify-center text-muted-foreground">Sem dados para exibir</div>
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                    dataKey="name"
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 12, fill: 'var(--foreground)' }}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="var(--muted-foreground)"
                    tick={{ fontSize: 12, fill: 'var(--foreground)' }}
                    tickFormatter={(value) => `R$${value / 1000}k`}
                    tickLine={false}
                    axisLine={false}
                />
                <Tooltip
                    cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: 'var(--popover)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--popover-foreground)' }}
                    itemStyle={{ color: 'var(--popover-foreground)' }}
                    labelStyle={{ color: 'var(--popover-foreground)' }}
                    formatter={(value: number) => [formatCurrency(value), "MRR"]}
                />
                <Bar
                    dataKey="value"
                    fill="var(--primary)"
                    radius={[4, 4, 0, 0]}
                    barSize={40}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
