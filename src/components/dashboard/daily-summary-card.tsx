"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, Users, FileText, TrendingUp, TrendingDown, Calendar } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DailySummaryCardProps {
    todayActivities: {
        calls: number
        emails: number
        meetings: number
        proposals: number
        total: number
    }
    comparison?: {
        calls: number
        emails: number
        meetings: number
        proposals: number
        total: number
    }
}

export function DailySummaryCard({ todayActivities, comparison }: DailySummaryCardProps) {
    const formatPercentage = (value: number) => {
        const sign = value > 0 ? "+" : ""
        return `${sign}${value}%`
    }

    const getChangeIcon = (value: number) => {
        if (value > 0) return <TrendingUp className="h-3 w-3" />
        if (value < 0) return <TrendingDown className="h-3 w-3" />
        return null
    }

    const getChangeColor = (value: number) => {
        if (value > 0) return "text-emerald-500"
        if (value < 0) return "text-red-500"
        return "text-muted-foreground"
    }

    const activities = [
        {
            label: "Ligações",
            value: todayActivities.calls,
            icon: Phone,
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            change: comparison?.calls,
        },
        {
            label: "Emails",
            value: todayActivities.emails,
            icon: Mail,
            color: "text-green-500",
            bgColor: "bg-green-500/10",
            change: comparison?.emails,
        },
        {
            label: "Reuniões",
            value: todayActivities.meetings,
            icon: Users,
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            change: comparison?.meetings,
        },
        {
            label: "Propostas",
            value: todayActivities.proposals,
            icon: FileText,
            color: "text-orange-500",
            bgColor: "bg-orange-500/10",
            change: comparison?.proposals,
        },
    ]

    const today = format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })

    return (
        <Card className="bg-gradient-to-br from-card to-muted/20 border-border shadow-lg">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Atividades de Hoje
                    </CardTitle>
                    <Badge variant="outline" className="capitalize">
                        {today}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {activities.map((activity) => {
                        const Icon = activity.icon
                        return (
                            <div
                                key={activity.label}
                                className="bg-background rounded-lg p-4 border border-border hover:border-primary/50 transition-colors"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`p-2 rounded-lg ${activity.bgColor}`}>
                                        <Icon className={`h-4 w-4 ${activity.color}`} />
                                    </div>
                                    {activity.change !== undefined && (
                                        <div
                                            className={`flex items-center gap-1 text-xs font-medium ${getChangeColor(
                                                activity.change
                                            )}`}
                                        >
                                            {getChangeIcon(activity.change)}
                                            {formatPercentage(activity.change)}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">
                                        {activity.value}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {activity.label}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Total */}
                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <FileText className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total de Atividades</p>
                                <p className="text-2xl font-bold text-foreground">
                                    {todayActivities.total}
                                </p>
                            </div>
                        </div>
                        {comparison?.total !== undefined && (
                            <Badge
                                variant={comparison.total >= 0 ? "default" : "destructive"}
                                className="gap-1"
                            >
                                {getChangeIcon(comparison.total)}
                                {formatPercentage(comparison.total)}
                                <span className="text-xs ml-1">vs ontem</span>
                            </Badge>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
