'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Clock, Filter, Users, Building2, ClipboardList, Tag, UserRound } from 'lucide-react'
import { groupBy, sumMinutes } from '@/lib/time-entries'
import { minutesToHoursLabel } from '@/lib/duration'
import { CLASSIFICATIONS } from '../helpers'
import { getWeekRange, getMonthRange } from '@/lib/date'

interface TimeEntry {
  id: string
  userId: string | null
  userName: string
  minutes: number
  client: string | null
  source: string
  createdAt: string
  demanda: {
    id: string
    title: string
    teamId: string | null
    classification: string | null
    companyId: string | null
  }
}

type GroupKey = 'client' | 'user' | 'team' | 'area' | 'card'

const GROUPS: { id: GroupKey; label: string; icon: typeof Users }[] = [
  { id: 'client', label: 'Cliente', icon: Building2 },
  { id: 'user', label: 'Responsavel', icon: UserRound },
  { id: 'team', label: 'Equipe', icon: Users },
  { id: 'area', label: 'Area', icon: Tag },
  { id: 'card', label: 'Card', icon: ClipboardList },
]

type Period = 'this_month' | 'this_week' | 'all' | 'custom'

const classificationLabel = (id: string | null) =>
  CLASSIFICATIONS.find((c) => c.id === id)?.label ?? null

export default function DemandasHorasPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const userRole = session?.user?.role || ''
  const isAdminOrGerencia = userRole === 'admin' || userRole === 'gerencia'

  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [teamNames, setTeamNames] = useState<Record<string, string>>({})
  const [capped, setCapped] = useState(false)
  const [loading, setLoading] = useState(false)

  const [period, setPeriod] = useState<Period>('this_month')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [groupKey, setGroupKey] = useState<GroupKey>('client')
  const [filterClient, setFilterClient] = useState('all')
  const [filterUser, setFilterUser] = useState('all')
  const [filterTeam, setFilterTeam] = useState('all')

  // Gate de acesso (admin/gerência) — espelha as outras sub-páginas de demandas.
  useEffect(() => {
    if (session && !isAdminOrGerencia) {
      router.push('/dashboard/demandas')
    }
  }, [session, isAdminOrGerencia, router])

  // Mapa teamId → nome (para agrupar/exibir por Equipe)
  useEffect(() => {
    fetch('/api/teams')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          const map: Record<string, string> = {}
          for (const t of d.data) map[t.id] = t.name
          setTeamNames(map)
        }
      })
      .catch(() => {})
  }, [])

  // Busca lançamentos do período selecionado (escopo de tenant aplicado no servidor)
  useEffect(() => {
    const range = (): { from?: string; to?: string } => {
      if (period === 'all') return {}
      if (period === 'this_week') return getWeekRange()
      if (period === 'this_month') return getMonthRange()
      return { from: customFrom || undefined, to: customTo || undefined }
    }
    const { from, to } = range()
    const params = new URLSearchParams()
    if (from) params.set('from', from)
    if (to) params.set('to', to)

    setLoading(true)
    fetch(`/api/time-entries${params.toString() ? `?${params}` : ''}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setEntries(d.data.entries)
          setCapped(d.data.capped)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [period, customFrom, customTo])

  // Opções de filtro derivadas dos lançamentos carregados
  const clientOptions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.client).filter((c): c is string => !!c))).sort(),
    [entries]
  )
  const userOptions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.userName).filter(Boolean))).sort(),
    [entries]
  )
  const teamOptions = useMemo(
    () => Array.from(new Set(entries.map((e) => e.demanda.teamId).filter((t): t is string => !!t))),
    [entries]
  )

  // Filtros secundários (cliente / responsável / equipe) aplicados no client
  const filtered = useMemo(
    () =>
      entries.filter((e) => {
        if (filterClient !== 'all' && (e.client ?? '__none__') !== filterClient) return false
        if (filterUser !== 'all' && e.userName !== filterUser) return false
        if (filterTeam !== 'all' && (e.demanda.teamId ?? '__none__') !== filterTeam) return false
        return true
      }),
    [entries, filterClient, filterUser, filterTeam]
  )

  const keyFn = (e: TimeEntry): string => {
    switch (groupKey) {
      case 'client':
        return e.client || 'Sem cliente'
      case 'user':
        return e.userName || 'Sem responsavel'
      case 'team':
        return e.demanda.teamId ? teamNames[e.demanda.teamId] || e.demanda.teamId : 'Sem equipe'
      case 'area':
        return classificationLabel(e.demanda.classification) || 'Sem area'
      case 'card':
        return e.demanda.title
    }
  }

  const rows = useMemo(() => {
    const grouped = groupBy(filtered, keyFn)
    return Array.from(grouped.entries())
      .map(([label, items]) => ({ label, minutes: sumMinutes(items), count: items.length }))
      .sort((a, b) => b.minutes - a.minutes)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, groupKey, teamNames])

  const totalMinutes = useMemo(() => sumMinutes(filtered), [filtered])

  if (session && !isAdminOrGerencia) return null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <Clock className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Horas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Diario de horas por cliente, responsavel, equipe, area e card
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200/60 dark:border-slate-700/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Periodo</label>
            <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="this_month">Este mes</SelectItem>
                <SelectItem value="this_week">Esta semana</SelectItem>
                <SelectItem value="all">Tudo</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {period === 'custom' && (
            <>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">De</label>
                <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="mt-1" />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Ate</label>
                <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="mt-1" />
              </div>
            </>
          )}

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Cliente</label>
            <Select value={filterClient} onValueChange={setFilterClient}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {entries.some((e) => !e.client) && <SelectItem value="__none__">Sem cliente</SelectItem>}
                {clientOptions.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Responsavel</label>
            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {userOptions.map((u) => (
                  <SelectItem key={u} value={u}>{u}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Equipe</label>
            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {entries.some((e) => !e.demanda.teamId) && <SelectItem value="__none__">Sem equipe</SelectItem>}
                {teamOptions.map((t) => (
                  <SelectItem key={t} value={t}>{teamNames[t] || t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agrupar por */}
      <div className="flex flex-wrap gap-2">
        {GROUPS.map((g) => {
          const Icon = g.icon
          const active = groupKey === g.id
          return (
            <button
              key={g.id}
              onClick={() => setGroupKey(g.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                active
                  ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'border-slate-200/60 dark:border-slate-700/40 text-slate-500 dark:text-slate-400 hover:border-slate-300'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {g.label}
            </button>
          )
        })}
      </div>

      {/* Total + resultado */}
      <Card className="border-slate-200/60 dark:border-slate-700/40">
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Total: <span className="text-blue-600 dark:text-blue-400">{minutesToHoursLabel(totalMinutes)}</span>
            <span className="ml-2 text-xs font-normal text-slate-400">
              ({filtered.length} lancamento{filtered.length === 1 ? '' : 's'})
            </span>
          </CardTitle>
          {capped && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400">
              Resultado truncado — refine o periodo
            </span>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-400 py-8 text-center">Carregando...</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">Nenhum lancamento no periodo.</p>
          ) : (
            <div className="space-y-1">
              {rows.map((row) => {
                const pct = totalMinutes > 0 ? (row.minutes / totalMinutes) * 100 : 0
                return (
                  <div key={row.label} className="relative flex items-center justify-between px-3 py-2 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 dark:bg-blue-500/10" style={{ width: `${pct}%` }} />
                    <span className="relative text-sm text-slate-700 dark:text-slate-200 truncate pr-3">{row.label}</span>
                    <span className="relative shrink-0 text-sm font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
                      {minutesToHoursLabel(row.minutes)}
                      <span className="ml-2 text-xs font-normal text-slate-400">{row.count}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
