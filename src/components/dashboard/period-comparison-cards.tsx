"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight } from "lucide-react"

interface PeriodComparisonData {
    current: {
        calls: number
        emails: number
        meetings: number
        proposals: number
        total: number
    }
    previous: {
        calls: number
        emails: number
        meetings: number
        proposals: number
        total: number
    }
    percentageChange: {
        calls: number
        emails: number
        meetings: number
        proposals: number
        total: number
    }
}

interface PeriodComparisonCardsProps {
    todayVsYesterday?: PeriodComparisonData
    weekVsLastWeek?: PeriodComparisonData
    monthVsLastMonth?: PeriodComparisonData
}

export function PeriodComparisonCards({
    todayVsYesterday,
    weekVsLastWeek,
    monthVsLastMonth,
}: PeriodComparisonCardsProps) {
    const formatPercentage = (value: number) => {
        const sign = value > 0 ? "+" : ""
        return `${sign}${value}%`
    }

    const getChangeIcon = (value: number) => {
        if (value > 0) return <ArrowUpRight className="h-4 w-4" />
        if (value < 0) return <ArrowDownRight className="h-4 w-4" />
        return <span className="text-xs">→</span>
    }

    const getChangeColor = (value: number) => {
        if (value > 0) return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        if (value < 0) return "bg-red-500/10 text-red-500 border-red-500/20"
        return "bg-muted text-muted-foreground border-border"
    }

    const ComparisonCard = ({
        title,
        period,
        data,
    }: {
        title: string
        period: string
        data?: PeriodComparisonData
    }) => {
        if (!data) return null

        const change = data.percentageChange.total
        const isPositive = change >= 0

        return (
            <Card className="bg-card border-border shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-sm font-semibold">
                                {title}
                            </CardTitle>
                        </div>
                        <Badge
                            variant="outline"
                            className={`gap-1 ${getChangeColor(change)}`}
                        >
                            {getChangeIcon(change)}
                            {formatPercentage(change)}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{period}</p>
                </CardHeader>
                <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-3">
                        {/* Current Period */}
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground font-medium">
                                Período Atual
                            </p>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Ligações:</span>
                                    <span className="font-semibold text-blue-500">
                                        {data.current.calls}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Emails:</span>
                                    <span className="font-semibold text-green-500">
                                        {data.current.emails}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Reuniões:</span>
                                    <span className="font-semibold text-purple-500">
                                        {data.current.meetings}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Propostas:</span>
                                    <span className="font-semibold text-orange-500">
                                        {data.current.proposals}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold">Total:</span>
                                    <Badge variant="default" className="text-xs">
                                        {data.current.total}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        {/* Previous Period */}
                        <div className="space-y-2 opacity-60">
                            <p className="text-xs text-muted-foreground font-medium">
                                Período Anterior
                            </p>
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Ligações:</span>
                                    <span className="font-medium">{data.previous.calls}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Emails:</span>
                                    <span className="font-medium">{data.previous.emails}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Reuniões:</span>
                                    <span className="font-medium">{data.previous.meetings}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-muted-foreground">Propostas:</span>
                                    <span className="font-medium">{data.previous.proposals}</span>
                                </div>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-semibold">Total:</span>
                                    <Badge variant="outline" className="text-xs">
                                        {data.previous.total}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Detailed Changes */}
                    <div className="mt-4 pt-3 border-t">
                        <p className="text-xs text-muted-foreground font-medium mb-2">
                            Variação por Atividade
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-500">Ligações</span>
                                <span
                                    className={
                                        data.percentageChange.calls >= 0
                                            ? "text-emerald-500"
                                            : "text-red-500"
                                    }
                                >
                                    {formatPercentage(data.percentageChange.calls)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-green-500">Emails</span>
                                <span
                                    className={
                                        data.percentageChange.emails >= 0
                                            ? "text-emerald-500"
                                            : "text-red-500"
                                    }
                                >
                                    {formatPercentage(data.percentageChange.emails)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-purple-500">Reuniões</span>
                                <span
                                    className={
                                        data.percentageChange.meetings >= 0
                                            ? "text-emerald-500"
                                            : "text-red-500"
                                    }
                                >
                                    {formatPercentage(data.percentageChange.meetings)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-orange-500">Propostas</span>
                                <span
                                    className={
                                        data.percentageChange.proposals >= 0
                                            ? "text-emerald-500"
                                            : "text-red-500"
                                    }
                                >
                                    {formatPercentage(data.percentageChange.proposals)}
                                </span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <ComparisonCard
                title="Hoje vs Ontem"
                period="Comparativo diário"
                data={todayVsYesterday}
            />
            <ComparisonCard
                title="Esta Semana vs Semana Passada"
                period="Comparativo semanal"
                data={weekVsLastWeek}
            />
            <ComparisonCard
                title="Este Mês vs Mês Passado"
                period="Comparativo mensal"
                data={monthVsLastMonth}
            />
        </div>
    )
}
