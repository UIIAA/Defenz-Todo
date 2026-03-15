'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, LayoutGrid, BarChart3, Clock, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DemandaSummary {
  emAndamento: number
  atrasadas: number
  concluidas: number
}

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  userEmail: string
  createdAt: string
  user: { name: string | null; email: string }
}

const ACTION_LABELS: Record<string, { label: string; colorClass: string }> = {
  CREATE: { label: 'Criacao', colorClass: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20' },
  UPDATE: { label: 'Edicao', colorClass: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' },
  DELETE: { label: 'Exclusao', colorClass: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' },
  IMPORT: { label: 'Importacao', colorClass: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' },
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

function getFormattedDate(): string {
  const now = new Date()
  const weekdays = ['Domingo', 'Segunda-feira', 'Terca-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sabado']
  const months = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  return `${weekdays[now.getDay()]}, ${now.getDate()} de ${months[now.getMonth()]} de ${now.getFullYear()}`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [summary, setSummary] = useState<DemandaSummary>({ emAndamento: 0, atrasadas: 0, concluidas: 0 })
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([])
  const [logsError, setLogsError] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch demandas for summary
        const demandasRes = await fetch('/api/demandas')
        const demandasJson = await demandasRes.json()
        if (demandasJson.success) {
          const demandas = demandasJson.data as Array<{
            status: string
            deadline: string | null
          }>
          const today = todayStr()
          setSummary({
            emAndamento: demandas.filter((d) => d.status === 'em_andamento').length,
            atrasadas: demandas.filter(
              (d) => d.deadline && d.deadline.slice(0, 10) < today && d.status !== 'concluida'
            ).length,
            concluidas: demandas.filter((d) => d.status === 'concluida').length,
          })
        }
      } catch {
        // silently fail
      }

      try {
        // Fetch audit logs (may 403 for non-admin)
        const logsRes = await fetch('/api/audit-logs?limit=5')
        if (logsRes.ok) {
          const logsJson = await logsRes.json()
          if (logsJson.success) {
            setRecentLogs(logsJson.data.logs)
          }
        } else {
          setLogsError(true)
        }
      } catch {
        setLogsError(true)
      }

      setLoading(false)
    }
    fetchData()
  }, [])

  const userName = session?.user?.name || session?.user?.email || ''
  const firstName = userName.split(' ')[0] || userName

  const summaryCards = [
    { label: 'Em Andamento', value: summary.emAndamento, color: '#3b82f6', icon: Clock },
    { label: 'Atrasadas', value: summary.atrasadas, color: '#ef4444', icon: AlertTriangle },
    { label: 'Concluidas', value: summary.concluidas, color: '#22c55e', icon: CheckCircle2 },
  ]

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {getGreeting()}, {firstName}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {getFormattedDate()}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Card
              key={card.label}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] border border-slate-200 dark:border-slate-700"
              style={{ borderTopWidth: 3, borderTopColor: card.color }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
                <div className="text-3xl font-bold" style={{ color: card.color }}>
                  {loading ? '-' : card.value}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
                  {card.label}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button
          onClick={() => router.push('/dashboard/demandas')}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nova Demanda
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/demandas')}
          className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
        >
          <LayoutGrid className="h-4 w-4 mr-1.5" />
          Ver Kanban
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/demandas/analises')}
          className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
        >
          <BarChart3 className="h-4 w-4 mr-1.5" />
          Ver Analises
        </Button>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3">
          Atividade Recente
        </h2>
        <Card className="bg-white dark:bg-slate-800 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] border border-slate-200 dark:border-slate-700">
          <CardContent className="p-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-10 bg-accent animate-pulse rounded-md" />
                ))}
              </div>
            ) : logsError || recentLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Sem atividade recente
              </p>
            ) : (
              <div className="space-y-2">
                {recentLogs.map((log) => {
                  const actionInfo = ACTION_LABELS[log.action] || {
                    label: log.action,
                    colorClass: 'text-slate-500 bg-slate-50 dark:bg-slate-700',
                  }
                  return (
                    <div
                      key={log.id}
                      className="flex items-center gap-3 py-2 border-b border-slate-100 dark:border-slate-700/30 last:border-0"
                    >
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${actionInfo.colorClass}`}
                      >
                        {actionInfo.label}
                      </span>
                      <span className="text-sm text-slate-700 dark:text-slate-300 flex-1 truncate">
                        {log.entityType}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                        {log.user.name || log.userEmail}
                      </span>
                      <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  )
                })}
                <div className="pt-2">
                  <button
                    onClick={() => router.push('/dashboard/logs')}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Ver todos os logs <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
