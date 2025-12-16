'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts'

interface ExecutiveChartsProps {
    data: {
        funilGeralData: any[]
        conversionData: any[]
        pipelineValueData: any[]
        activityVsResultData: any[]
        insightTableData: any[]
    }
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value)
}

export default function ExecutiveCharts({ data }: ExecutiveChartsProps) {
    const {
        funilGeralData,
        conversionData,
        pipelineValueData,
        activityVsResultData,
        insightTableData
    } = data

    return (
        <div className="space-y-6">
            {/* Funil Geral */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-center text-foreground">Funil Geral</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={funilGeralData}
                                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                <XAxis type="number" stroke="#94a3b8" />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    stroke="#94a3b8"
                                    width={150}
                                    tick={{ fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                    cursor={{ fill: '#334155', opacity: 0.2 }}
                                />
                                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                                    {funilGeralData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#3b82f6" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* Qual lista Converte mais */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-center text-foreground">Qual lista Converte mais</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[500px] w-full">
                        {conversionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={conversionData}
                                    margin={{ top: 5, right: 30, left: 200, bottom: 5 }}
                                    barGap={2}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                    <XAxis type="number" stroke="#94a3b8" />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke="#94a3b8"
                                        width={250}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                        cursor={{ fill: '#334155', opacity: 0.2 }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="propostas" name="Propostas Enviadas" fill="#f97316" stackId="a" />
                                    <Bar dataKey="reunioes" name="Reuniões Agendadas" fill="#22c55e" stackId="a" />
                                    <Bar dataKey="emails" name="Total de Emails Enviados" fill="#eab308" stackId="a" />
                                    <Bar dataKey="ligacoes" name="Total de Ligações" fill="#ef4444" stackId="a" />
                                    <Bar dataKey="contatos" name="Número de contatos validados" fill="#3b82f6" stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Nenhuma lista de marketing encontrada.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Pipeline por Valor */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-center text-foreground">Pipeline por Valor</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full">
                        {pipelineValueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={pipelineValueData}
                                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                    <XAxis dataKey="name" stroke="#94a3b8" />
                                    <YAxis
                                        stroke="#94a3b8"
                                        tickFormatter={(value) => `R$ ${value}`}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                        cursor={{ fill: '#334155', opacity: 0.2 }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                                        {pipelineValueData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill="#3b82f6" />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Nenhuma oportunidade com valor encontrada.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Atividade Vs Resultado */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-center text-foreground">Atividade Vs Resultado</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="h-[400px] w-full">
                        {activityVsResultData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    layout="vertical"
                                    data={activityVsResultData}
                                    margin={{ top: 5, right: 30, left: 150, bottom: 5 }}
                                    stackOffset="expand"
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                                    <XAxis type="number" stroke="#94a3b8" tickFormatter={(value) => `${value * 100}%`} />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        stroke="#94a3b8"
                                        width={200}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => `${(value * 100).toFixed(0)}%`}
                                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                                        cursor={{ fill: '#334155', opacity: 0.2 }}
                                    />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                    <Bar dataKey="atividades" name="Atividades (Lig+Email)" fill="#3b82f6" stackId="a" />
                                    <Bar dataKey="reunioes" name="Reuniões" fill="#ef4444" stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Nenhuma atividade registrada nas listas.
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Insight imediato dos seus dados */}
            <Card className="bg-card border-border">
                <CardHeader>
                    <CardTitle className="text-xl font-bold text-foreground">Insight imediato dos seus dados:</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted text-muted-foreground">
                                <tr>
                                    <th className="px-6 py-3">Origem</th>
                                    <th className="px-6 py-3 text-center">Contatos</th>
                                    <th className="px-6 py-3 text-center">Ligações</th>
                                    <th className="px-6 py-3 text-center">Reuniões</th>
                                    <th className="px-6 py-3 text-center">Taxa</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {insightTableData.length > 0 ? (
                                    insightTableData.map((row: any, index: number) => (
                                        <tr key={index} className="bg-card hover:bg-muted/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-foreground">{row.origem}</td>
                                            <td className="px-6 py-4 text-center text-muted-foreground">{row.contatos}</td>
                                            <td className="px-6 py-4 text-center text-muted-foreground">{row.ligacoes}</td>
                                            <td className="px-6 py-4 text-center text-muted-foreground">{row.reunioes}</td>
                                            <td className="px-6 py-4 text-center text-muted-foreground">{row.taxa}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-muted-foreground">
                                            Nenhum dado de origem encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
