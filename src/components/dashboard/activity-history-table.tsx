"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, Users, FileText, Calendar } from "lucide-react"
import { format, isToday, isYesterday } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ActivityHistoryItem {
    id: string
    date: Date
    calls: number
    emails: number
    meetings: number
    proposals: number
    total: number
    notes?: string | null
    marketingList?: { id: string; name: string } | null
    opportunity?: { id: string; title: string } | null
}

interface ActivityHistoryTableProps {
    activities: ActivityHistoryItem[]
}

export function ActivityHistoryTable({ activities }: ActivityHistoryTableProps) {
    const formatDate = (date: Date) => {
        if (isToday(date)) {
            return "Hoje"
        }
        if (isYesterday(date)) {
            return "Ontem"
        }
        return format(date, "dd/MM/yyyy (EEE)", { locale: ptBR })
    }

    const totals = activities.reduce(
        (acc, activity) => ({
            calls: acc.calls + activity.calls,
            emails: acc.emails + activity.emails,
            meetings: acc.meetings + activity.meetings,
            proposals: acc.proposals + activity.proposals,
            total: acc.total + activity.total,
        }),
        { calls: 0, emails: 0, meetings: 0, proposals: 0, total: 0 }
    )

    if (activities.length === 0) {
        return (
            <Card className="bg-card border-border shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-primary" />
                        Histórico de Atividades
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-muted-foreground">
                        <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                        <p>Nenhuma atividade registrada ainda.</p>
                        <p className="text-sm mt-2">
                            Comece registrando as atividades do seu dia!
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
                    <Calendar className="h-5 w-5 text-primary" />
                    Histórico de Atividades (Últimos 7 Dias)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left">Data</th>
                                <th className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <Phone className="h-3 w-3 text-blue-500" />
                                        Ligações
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <Mail className="h-3 w-3 text-green-500" />
                                        Emails
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <Users className="h-3 w-3 text-purple-500" />
                                        Reuniões
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <FileText className="h-3 w-3 text-orange-500" />
                                        Propostas
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-center">Total</th>
                                <th className="px-4 py-3 text-left">Contexto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {activities.map((activity) => (
                                <tr
                                    key={activity.id}
                                    className={`border-b border-border hover:bg-muted/50 ${
                                        isToday(activity.date) ? "bg-primary/5" : ""
                                    }`}
                                >
                                    <td className="px-4 py-3 font-medium text-foreground">
                                        <div className="flex items-center gap-2">
                                            {formatDate(activity.date)}
                                            {isToday(activity.date) && (
                                                <Badge
                                                    variant="default"
                                                    className="text-xs"
                                                >
                                                    Hoje
                                                </Badge>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="font-medium text-blue-500">
                                            {activity.calls}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="font-medium text-green-500">
                                            {activity.emails}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="font-medium text-purple-500">
                                            {activity.meetings}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="font-medium text-orange-500">
                                            {activity.proposals}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant="outline" className="font-semibold">
                                            {activity.total}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground text-xs">
                                        {activity.marketingList && (
                                            <div className="mb-1">
                                                📋 {activity.marketingList.name}
                                            </div>
                                        )}
                                        {activity.opportunity && (
                                            <div className="mb-1">
                                                💼 {activity.opportunity.title}
                                            </div>
                                        )}
                                        {activity.notes && (
                                            <div className="line-clamp-2" title={activity.notes}>
                                                💬 {activity.notes}
                                            </div>
                                        )}
                                        {!activity.marketingList &&
                                            !activity.opportunity &&
                                            !activity.notes && (
                                                <span className="text-muted-foreground/50">
                                                    -
                                                </span>
                                            )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-muted/80 font-semibold text-foreground">
                            <tr>
                                <td className="px-4 py-3">TOTAL (7 dias)</td>
                                <td className="px-4 py-3 text-center text-blue-500">
                                    {totals.calls}
                                </td>
                                <td className="px-4 py-3 text-center text-green-500">
                                    {totals.emails}
                                </td>
                                <td className="px-4 py-3 text-center text-purple-500">
                                    {totals.meetings}
                                </td>
                                <td className="px-4 py-3 text-center text-orange-500">
                                    {totals.proposals}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <Badge variant="default" className="font-bold">
                                        {totals.total}
                                    </Badge>
                                </td>
                                <td className="px-4 py-3"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
