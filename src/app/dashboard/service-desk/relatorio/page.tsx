'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { BarChart3, Ticket, Inbox, ArrowUpRight, Timer, MessageSquare, Hourglass } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { getWeekRange, getMonthRange } from '@/lib/date'
import { formatMinutesHuman } from '@/components/service-desk/ticket-helpers'

interface Metrics {
  total: number
  backlog: number
  escalatedCount: number
  escalatedPct: number
  avgRepliesPerTicket: number
  avgResolutionMinutes: number
  avgOpenAgeMinutes: number
  escalatedByPartner: { partner: string; count: number }[]
  capped?: boolean
}

type Period = 'this_month' | 'this_week' | 'all'

export default function ServiceDeskReportPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const userRole = session?.user?.role || ''
  const isAdminOrGerencia = userRole === 'admin' || userRole === 'gerencia'

  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [period, setPeriod] = useState<Period>('this_month')

  useEffect(() => {
    if (session && !isAdminOrGerencia) router.push('/dashboard/service-desk')
  }, [session, isAdminOrGerencia, router])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const range = period === 'this_week' ? getWeekRange() : period === 'this_month' ? getMonthRange() : null
      const qs = new URLSearchParams()
      if (range) { qs.set('from', range.from); qs.set('to', range.to) }
      const r = await fetch(`/api/service-desk/metrics${qs.toString() ? `?${qs}` : ''}`)
      const j = await r.json()
      if (j.success) setMetrics(j.data)
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => { if (isAdminOrGerencia) load() }, [load, isAdminOrGerencia])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Relatório — Service Desk</h1>
            <p className="text-sm text-muted-foreground">Volume, interações, tempo e escalonamento ao N2</p>
          </div>
        </div>
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="this_month">Este mês</SelectItem>
            <SelectItem value="this_week">Esta semana</SelectItem>
            <SelectItem value="all">Tudo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Carregando…</p>}

      {metrics && (
        <>
          <p className="text-xs text-muted-foreground -mt-2">
            Coorte: tickets <strong>criados</strong> no período selecionado (fuso de São Paulo).
          </p>
          {metrics.capped && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Mostrando os 5000 tickets mais recentes do período — métricas podem estar truncadas.
            </p>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Metric icon={Ticket} label="Tickets criados no período" value={String(metrics.total)} />
            <Metric icon={Inbox} label="Em aberto (não concluídos)" value={String(metrics.backlog)} />
            <Metric icon={ArrowUpRight} label="Repassados ao N2" value={`${metrics.escalatedCount} (${metrics.escalatedPct.toFixed(0)}%)`} accent="amber" />
            <Metric icon={Timer} label="Tempo médio de resolução" value={formatMinutesHuman(metrics.avgResolutionMinutes)} />
            <Metric icon={Hourglass} label="Tempo médio em aberto" value={formatMinutesHuman(metrics.avgOpenAgeMinutes)} />
            <Metric icon={MessageSquare} label="Interações por ticket" value={metrics.avgRepliesPerTicket.toFixed(1)} />
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowUpRight className="h-4 w-4" /> Escalonamentos ao N2 por parceiro</CardTitle></CardHeader>
            <CardContent>
              {metrics.escalatedByPartner.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum ticket escalado no período.</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={metrics.escalatedByPartner} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="partner" width={120} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Tickets" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function Metric({
  icon: Icon, label, value, accent,
}: {
  icon: typeof Ticket
  label: string
  value: string
  accent?: 'amber'
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
          <Icon className={`h-4 w-4 ${accent === 'amber' ? 'text-amber-500' : 'text-blue-500'}`} />
          {label}
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  )
}
