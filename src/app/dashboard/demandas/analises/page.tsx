'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Activity,
  Users,
  Filter,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

import { toDateStr, todayStr, CLASSIFICATIONS } from '../helpers'

interface Demanda {
  id: string
  title: string
  description: string | null
  origin: string
  status: string
  priority: string
  classification: string | null
  assignee: string | null
  dateIn: string
  deadline: string | null
  dateDone: string | null
  createdAt: string
}

const ORIGINS = [
  { id: 'fernando', label: 'Fernando', color: 'bg-blue-500', hex: '#3b82f6' },
  { id: 'securisoft', label: 'SecuriSoft', color: 'bg-amber-500', hex: '#f59e0b' },
  { id: 'autogerada', label: 'Autogerada', color: 'bg-green-500', hex: '#22c55e' },
  { id: 'outra', label: 'Outra', color: 'bg-slate-500', hex: '#64748b' },
]

export default function DemandasAnalisesPage() {
  const [allDemandas, setAllDemandas] = useState<Demanda[]>([])
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [filterOrigin, setFilterOrigin] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterClassification, setFilterClassification] = useState('all')

  useEffect(() => {
    const fetchDemandas = async () => {
      try {
        const res = await fetch('/api/demandas')
        const json = await res.json()
        if (json.success) setAllDemandas(json.data)
      } catch (err) {
        console.error('Erro:', err)
      }
    }
    fetchDemandas()
  }, [])

  // Lista unica de assignees
  const assignees = useMemo(() => {
    const names = allDemandas
      .map((d) => d.assignee)
      .filter((a): a is string => !!a && a.trim().length > 0)
    return [...new Set(names)].sort()
  }, [allDemandas])

  // Aplicar filtros
  const demandas = useMemo(() => {
    let filtered = allDemandas
    if (filterAssignee !== 'all') {
      if (filterAssignee === '_unassigned') {
        filtered = filtered.filter((d) => !d.assignee)
      } else {
        filtered = filtered.filter((d) => d.assignee === filterAssignee)
      }
    }
    if (filterOrigin !== 'all') {
      filtered = filtered.filter((d) => d.origin === filterOrigin)
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter((d) => d.priority === filterPriority)
    }
    if (filterClassification !== 'all') {
      if (filterClassification === '_unclassified') {
        filtered = filtered.filter((d) => !d.classification)
      } else {
        filtered = filtered.filter((d) => d.classification === filterClassification)
      }
    }
    return filtered
  }, [allDemandas, filterAssignee, filterOrigin, filterPriority, filterClassification])

  const total = demandas.length
  const solicitadas = demandas.filter((d) => d.status === 'solicitada').length
  const selecionadas = demandas.filter((d) => d.status === 'selecionada').length
  const emAndamento = demandas.filter((d) => d.status === 'em_andamento').length
  const concluidas = demandas.filter((d) => d.status === 'concluida').length
  const bloqueadas = demandas.filter((d) => d.status === 'bloqueada').length
  const atrasadas = demandas.filter(
    (d) => d.deadline && toDateStr(d.deadline) < todayStr() && d.status !== 'concluida'
  ).length

  const altaPrio = demandas.filter((d) => d.priority === 'alta').length
  const mediaPrio = demandas.filter((d) => d.priority === 'media').length
  const baixaPrio = demandas.filter((d) => d.priority === 'baixa').length

  const completionRate = total > 0 ? (concluidas / total) * 100 : 0
  const overdueRate = total > 0 ? (atrasadas / total) * 100 : 0

  const leadTimes = demandas
    .filter((d) => d.status === 'concluida' && d.dateDone && d.dateIn)
    .map((d) => {
      const start = new Date(d.dateIn).getTime()
      const end = new Date(d.dateDone!).getTime()
      return Math.max(1, Math.ceil((end - start) / 86400000))
    })
  const avgLeadTime =
    leadTimes.length > 0
      ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
      : 0

  const originData = ORIGINS.map((o) => ({
    ...o,
    total: demandas.filter((d) => d.origin === o.id).length,
    concluidas: demandas.filter((d) => d.origin === o.id && d.status === 'concluida').length,
  }))

  const statusData = [
    { name: 'Solicitada', value: solicitadas, color: 'bg-amber-500', hex: '#f59e0b' },
    { name: 'Selecionada', value: selecionadas, color: 'bg-violet-500', hex: '#8b5cf6' },
    { name: 'Em Andamento', value: emAndamento, color: 'bg-blue-500', hex: '#3b82f6' },
    { name: 'Concluida', value: concluidas, color: 'bg-green-500', hex: '#22c55e' },
    { name: 'Bloqueada', value: bloqueadas, color: 'bg-red-500', hex: '#ef4444' },
  ]

  const priorityData = [
    { name: 'Alta', value: altaPrio, color: 'bg-red-500', hex: '#ef4444' },
    { name: 'Media', value: mediaPrio, color: 'bg-amber-500', hex: '#f59e0b' },
    { name: 'Baixa', value: baixaPrio, color: 'bg-blue-500', hex: '#3b82f6' },
  ]

  // Performance por pessoa
  const assigneeData = useMemo(() => {
    const map = new Map<string, { total: number; concluidas: number; atrasadas: number; emAndamento: number }>()

    demandas.forEach((d) => {
      const name = d.assignee || 'Sem responsavel'
      if (!map.has(name)) map.set(name, { total: 0, concluidas: 0, atrasadas: 0, emAndamento: 0 })
      const entry = map.get(name)!
      entry.total++
      if (d.status === 'concluida') entry.concluidas++
      if (d.status === 'em_andamento') entry.emAndamento++
      if (d.deadline && toDateStr(d.deadline) < todayStr() && d.status !== 'concluida') entry.atrasadas++
    })

    return Array.from(map.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total)
  }, [demandas])

  // Classification chart data
  const classificationData = useMemo(() => {
    return CLASSIFICATIONS.map((c) => ({
      ...c,
      total: demandas.filter((d) => d.classification === c.id).length,
      concluidas: demandas.filter((d) => d.classification === c.id && d.status === 'concluida').length,
      atrasadas: demandas.filter(
        (d) => d.classification === c.id && d.deadline && toDateStr(d.deadline) < todayStr() && d.status !== 'concluida'
      ).length,
    })).filter((c) => c.total > 0)
  }, [demandas])

  const unclassifiedCount = useMemo(() => demandas.filter((d) => !d.classification).length, [demandas])

  const hasFilters = filterAssignee !== 'all' || filterOrigin !== 'all' || filterPriority !== 'all' || filterClassification !== 'all'

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Analise de Demandas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Metricas e indicadores do fluxo de demandas
            {hasFilters && (
              <span className="text-red-500 font-medium ml-2">
                (filtrado: {total} de {allDemandas.length})
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/25 shadow-sm shadow-slate-900/[0.04]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Filtros</span>
            {hasFilters && (
              <button
                onClick={() => {
                  setFilterAssignee('all')
                  setFilterOrigin('all')
                  setFilterPriority('all')
                  setFilterClassification('all')
                }}
                className="text-xs text-red-500 hover:text-red-400 ml-auto"
              >
                Limpar filtros
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                Responsavel
              </label>
              <Select value={filterAssignee} onValueChange={setFilterAssignee}>
                <SelectTrigger className="bg-white dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-900 dark:text-slate-100 h-9 text-sm">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800/60 backdrop-blur-sm border-white/50 dark:border-slate-700/30">
                  <SelectItem value="all" className="text-slate-900 dark:text-slate-100">Todos</SelectItem>
                  <SelectItem value="_unassigned" className="text-slate-900 dark:text-slate-100">Sem responsavel</SelectItem>
                  {assignees.map((a) => (
                    <SelectItem key={a} value={a} className="text-slate-900 dark:text-slate-100">
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                Origem
              </label>
              <Select value={filterOrigin} onValueChange={setFilterOrigin}>
                <SelectTrigger className="bg-white dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-900 dark:text-slate-100 h-9 text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800/60 backdrop-blur-sm border-white/50 dark:border-slate-700/30">
                  <SelectItem value="all" className="text-slate-900 dark:text-slate-100">Todas</SelectItem>
                  {ORIGINS.map((o) => (
                    <SelectItem key={o.id} value={o.id} className="text-slate-900 dark:text-slate-100">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                Prioridade
              </label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="bg-white dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-900 dark:text-slate-100 h-9 text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800/60 backdrop-blur-sm border-white/50 dark:border-slate-700/30">
                  <SelectItem value="all" className="text-slate-900 dark:text-slate-100">Todas</SelectItem>
                  <SelectItem value="alta" className="text-slate-900 dark:text-slate-100">Alta</SelectItem>
                  <SelectItem value="media" className="text-slate-900 dark:text-slate-100">Media</SelectItem>
                  <SelectItem value="baixa" className="text-slate-900 dark:text-slate-100">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 block">
                Classificacao
              </label>
              <Select value={filterClassification} onValueChange={setFilterClassification}>
                <SelectTrigger className="bg-white dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-900 dark:text-slate-100 h-9 text-sm">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800/60 backdrop-blur-sm border-white/50 dark:border-slate-700/30">
                  <SelectItem value="all" className="text-slate-900 dark:text-slate-100">Todas</SelectItem>
                  <SelectItem value="_unclassified" className="text-slate-900 dark:text-slate-100">Sem classificacao</SelectItem>
                  {CLASSIFICATIONS.map((c) => (
                    <SelectItem key={c.id} value={c.id} className="text-slate-900 dark:text-slate-100">
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conclusao</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <div className="flex items-center gap-1 mt-1">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">
                {concluidas} de {total}
              </span>
            </div>
            <Progress value={completionRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atrasadas</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{atrasadas}</div>
            <div className="flex items-center gap-1 mt-1">
              {atrasadas > 0 ? (
                <>
                  <ArrowDownRight className="h-3 w-3 text-red-500" />
                  <span className="text-xs text-red-500">{overdueRate.toFixed(0)}% do total</span>
                </>
              ) : (
                <span className="text-xs text-green-500">Nenhuma atrasada</span>
              )}
            </div>
            <Progress value={overdueRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Em Andamento</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{emAndamento}</div>
            <p className="text-xs text-muted-foreground mt-1">+ {selecionadas} selecionadas</p>
            <p className="text-xs text-muted-foreground mt-1">
              {bloqueadas > 0 ? `${bloqueadas} bloqueada(s)` : 'Sem bloqueios'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Lead Time Medio</CardTitle>
            <Clock className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLeadTime > 0 ? `${avgLeadTime}d` : '—'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {leadTimes.length > 0
                ? `Baseado em ${leadTimes.length} concluida(s)`
                : 'Conclua demandas para calcular'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance por Pessoa */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-500" />
              Performance por Responsavel
            </CardTitle>
            <CardDescription>Volume, conclusao e atrasos por pessoa</CardDescription>
          </CardHeader>
          <CardContent>
            {assigneeData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma demanda encontrada com os filtros atuais
              </p>
            ) : (
              <div className="space-y-4">
                {assigneeData.map((person) => (
                  <div key={person.name} className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300">
                          {person.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium">{person.name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-green-500">{person.concluidas} concl.</span>
                        <span className="text-blue-500">{person.emAndamento} andamento</span>
                        {person.atrasadas > 0 && (
                          <span className="text-red-500">{person.atrasadas} atrasada(s)</span>
                        )}
                        <span className="text-muted-foreground font-bold">{person.total} total</span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2.5 flex overflow-hidden">
                      {person.total > 0 && (
                        <>
                          <div
                            className="h-full bg-green-500 transition-all"
                            style={{ width: `${(person.concluidas / person.total) * 100}%` }}
                          />
                          <div
                            className="h-full bg-blue-500 transition-all"
                            style={{ width: `${(person.emAndamento / person.total) * 100}%` }}
                          />
                          <div
                            className="h-full bg-red-500 transition-all"
                            style={{ width: `${(person.atrasadas / person.total) * 100}%` }}
                          />
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status - PieChart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Distribuicao por Status
            </CardTitle>
            <CardDescription>Visao geral do fluxo Kanban</CardDescription>
          </CardHeader>
          <CardContent>
            {total > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData.filter((s) => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {statusData.filter((s) => s.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.hex} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, name: string) => [`${value} demanda(s)`, name]}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {statusData.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.hex }} />
                  <span className="text-slate-600 dark:text-slate-300">{s.name}</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prioridade - BarChart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-500" />
              Distribuicao por Prioridade
            </CardTitle>
            <CardDescription>Urgencia das demandas</CardDescription>
          </CardHeader>
          <CardContent>
            {total > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={priorityData} layout="vertical" margin={{ left: 10, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f044" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 13, fill: '#94a3b8' }} width={60} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number) => [`${value} demanda(s)`, 'Quantidade']}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={28}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.hex} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Por Origem - BarChart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-amber-500" />
              Demandas por Origem
            </CardTitle>
            <CardDescription>Volume e conclusao por fonte</CardDescription>
          </CardHeader>
          <CardContent>
            {total > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={originData} layout="vertical" margin={{ left: 20, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f044" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 13, fill: '#94a3b8' }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} demanda(s)`,
                      name === 'total' ? 'Total' : 'Concluidas',
                    ]}
                  />
                  <Bar dataKey="total" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={20} name="total" />
                  <Bar dataKey="concluidas" radius={[0, 4, 4, 0]} barSize={20} name="concluidas">
                    {originData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.hex} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </CardContent>
        </Card>

        {/* Classificacao - BarChart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              Distribuicao por Classificacao
            </CardTitle>
            <CardDescription>Volume e conclusao por area</CardDescription>
          </CardHeader>
          <CardContent>
            {classificationData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(250, classificationData.length * 40)}>
                <BarChart data={classificationData} layout="vertical" margin={{ left: 30, right: 20, top: 5, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f044" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 13, fill: '#94a3b8' }} width={100} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, name: string) => [
                      `${value} demanda(s)`,
                      name === 'total' ? 'Total' : name === 'concluidas' ? 'Concluidas' : 'Atrasadas',
                    ]}
                  />
                  <Bar dataKey="total" fill="#94a3b8" radius={[0, 4, 4, 0]} barSize={20} name="total" />
                  <Bar dataKey="concluidas" radius={[0, 4, 4, 0]} barSize={20} name="concluidas">
                    {classificationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                {unclassifiedCount > 0
                  ? `${unclassifiedCount} demanda(s) sem classificacao`
                  : 'Sem dados'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Insights
            </CardTitle>
            <CardDescription>Analise automatica do fluxo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {atrasadas > 0 && (
                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    <h4 className="font-medium text-red-600 dark:text-red-400 text-sm">Atencao</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {atrasadas} demanda(s) atrasadas. Revise prazos ou priorize a execucao.
                  </p>
                </div>
              )}

              {bloqueadas > 0 && (
                <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-amber-500" />
                    <h4 className="font-medium text-amber-600 dark:text-amber-400 text-sm">Bloqueios</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {bloqueadas} demanda(s) bloqueada(s). Identifique e remova impedimentos.
                  </p>
                </div>
              )}

              {solicitadas > 3 && (
                <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="h-4 w-4 text-blue-500" />
                    <h4 className="font-medium text-blue-600 dark:text-blue-400 text-sm">Backlog</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {solicitadas} demandas aguardando selecao. Priorize e mova para "Selecionada".
                  </p>
                </div>
              )}

              {assigneeData.some((a) => a.name === 'Sem responsavel' && a.total > 0) && (
                <div className="p-3 bg-violet-500/10 rounded-lg border border-violet-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-violet-500" />
                    <h4 className="font-medium text-violet-600 dark:text-violet-400 text-sm">Sem dono</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {assigneeData.find((a) => a.name === 'Sem responsavel')?.total || 0} demanda(s) sem responsavel designado.
                  </p>
                </div>
              )}

              {completionRate >= 50 && (
                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <h4 className="font-medium text-green-600 dark:text-green-400 text-sm">Bom ritmo</h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {completionRate.toFixed(0)}% das demandas concluidas.
                  </p>
                </div>
              )}

              {total === 0 && (
                <div className="p-3 bg-slate-500/10 rounded-lg border border-slate-500/20">
                  <p className="text-xs text-muted-foreground text-center">
                    {hasFilters
                      ? 'Nenhuma demanda encontrada com esses filtros.'
                      : 'Nenhuma demanda cadastrada. Importe ou crie demandas para ver analises.'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
