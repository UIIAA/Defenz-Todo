'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getInteractionStats, ReportStats } from '@/actions/reports'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, Cell } from 'recharts'
import { Phone, Mail, Users, Activity } from 'lucide-react'
import { toast } from 'sonner'

export default function ReportsPage() {
    const [stats, setStats] = useState<ReportStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadStats() {
            try {
                const data = await getInteractionStats()
                setStats(data)
            } catch (error) {
                console.error('Error loading report stats:', error)
                toast.error('Erro ao carregar dados do relatório')
            } finally {
                setIsLoading(false)
            }
        }

        loadStats()
    }, [])

    if (isLoading) {
        return (
            <div className="min-h-screen p-6 flex items-center justify-center">
                <div className="text-muted-foreground">Carregando relatórios...</div>
            </div>
        )
    }

    if (!stats) return null

    return (
        <div className="space-y-8 p-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Activity className="h-8 w-8 text-primary" />
                    Relatórios de Atividades
                </h1>
                <p className="text-muted-foreground mt-2">
                    Análise detalhada de interações e produtividade nos últimos 30 dias.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Ligações Realizadas
                        </CardTitle>
                        <Phone className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.calls}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total no período
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Emails Enviados
                        </CardTitle>
                        <Mail className="h-4 w-4 text-secondary-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.emails}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total no período
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Reuniões Realizadas
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.summary.meetings}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total no período
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Timeline Chart */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Evolução Diária</CardTitle>
                        <CardDescription>
                            Volume de interações por dia
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.timeline}>
                                    <defs>
                                        <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorEmails" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1e293b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#1e293b" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorMeetings" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `${value}`}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                                    />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="calls"
                                        name="Ligações"
                                        stroke="#dc2626"
                                        fillOpacity={1}
                                        fill="url(#colorCalls)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="emails"
                                        name="Emails"
                                        stroke="#1e293b"
                                        fillOpacity={1}
                                        fill="url(#colorEmails)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="meetings"
                                        name="Reuniões"
                                        stroke="#64748b"
                                        fillOpacity={1}
                                        fill="url(#colorMeetings)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Distribution Chart */}
                <Card>
                    <CardHeader>
                        <CardTitle>Distribuição por Tipo</CardTitle>
                        <CardDescription>
                            Comparativo total de interações
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.byType} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                                    <XAxis type="number" stroke="#888888" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        stroke="#888888"
                                        width={100}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'hsl(var(--muted))' }}
                                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
                                    />
                                    <Bar dataKey="value" name="Quantidade" radius={[0, 4, 4, 0]}>
                                        {stats.byType.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? '#dc2626' : index === 1 ? '#1e293b' : '#64748b'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
