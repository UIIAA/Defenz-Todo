'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Target,
  Users,
  Calendar,
  DollarSign,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  Award,
  TrendingUp as TrendingIcon
} from 'lucide-react'

interface Activity {
  id: string
  title: string
  area: string
  priority: number
  status: string
  responsible: string
  deadline: string
  cost: string
  description: string
  createdAt: string
  completedAt: string | null
}

export default function AnalyticsPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [timeRange, setTimeRange] = useState('month')

  useEffect(() => {
    // Fetch activities from database
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities')
        if (response.ok) {
          const data = await response.json()
          setActivities(data)
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      }
    }

    fetchActivities()
  }, [])

  // Calcular estatísticas
  const stats = {
    total: activities.length,
    pending: activities.filter(a => a.status === 'pending').length,
    inProgress: activities.filter(a => a.status === 'in_progress').length,
    completed: activities.filter(a => a.status === 'completed').length,
    highPriority: activities.filter(a => a.priority === 0).length,
    mediumPriority: activities.filter(a => a.priority === 1).length,
    lowPriority: activities.filter(a => a.priority === 2).length
  }

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

  // Dados para gráficos
  const areaData = [
    { name: 'Marketing', value: activities.filter(a => a.area === 'Marketing').length, color: 'bg-blue-400' },
    { name: 'Vendas', value: activities.filter(a => a.area === 'Vendas').length, color: 'bg-green-400' },
    { name: 'Gestão', value: activities.filter(a => a.area === 'Gestão').length, color: 'bg-yellow-400' },
    { name: 'Estratégico', value: activities.filter(a => a.area === 'Estratégico').length, color: 'bg-purple-400' },
    { name: 'Back office', value: activities.filter(a => a.area === 'Back office').length, color: 'bg-red-400' }
  ]

  const priorityData = [
    { name: 'Alta', value: stats.highPriority, color: 'bg-red-400' },
    { name: 'Média', value: stats.mediumPriority, color: 'bg-yellow-400' },
    { name: 'Baixa', value: stats.lowPriority, color: 'bg-green-400' }
  ]

  const statusData = [
    { name: 'Pendente', value: stats.pending, color: 'bg-slate-500' },
    { name: 'Em Andamento', value: stats.inProgress, color: 'bg-blue-400' },
    { name: 'Concluído', value: stats.completed, color: 'bg-green-400' }
  ]

  // Timeline data (mock)
  const timelineData = [
    { month: 'Jan', completed: 2, planned: 5 },
    { month: 'Fev', completed: 3, planned: 6 },
    { month: 'Mar', completed: 4, planned: 7 },
    { month: 'Abr', completed: 1, planned: 4 },
    { month: 'Mai', completed: 0, planned: 8 },
    { month: 'Jun', completed: 0, planned: 6 }
  ]

  // Cálculo de custos estimados
  const estimatedCosts = activities.reduce((total, activity) => {
    const costStr = activity.cost
    if (costStr.includes('R$')) {
      const match = costStr.match(/R\$ ([\d.,]+)-([\d.,]+)/)
      if (match) {
        const min = parseFloat(match[1].replace('.', '').replace(',', '.'))
        const max = parseFloat(match[2].replace('.', '').replace(',', '.'))
        return total + (min + max) / 2
      }
    }
    return total
  }, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="space-y-6 p-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Análise Estratégica</h1>
            <p className="text-slate-400 mt-2">Visualizações detalhadas do progresso do projeto Defenz</p>
          </div>
          <div className="flex gap-2">
            {['week', 'month', 'quarter'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  timeRange === range
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-slate-800/50 text-slate-300 hover:bg-slate-700/50 border border-slate-700/50'
                }`}
              >
                {range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Trimestre'}
              </button>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-blue-700/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Taxa de Conclusão</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{completionRate.toFixed(1)}%</div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400">+5% vs mês anterior</span>
              </div>
              <Progress value={completionRate} className="mt-3 h-2 bg-slate-800" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Atividades Concluídas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{stats.completed}</div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowUpRight className="h-3 w-3 text-green-400" />
                <span className="text-xs text-green-400">+2 este mês</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Total de {stats.total} atividades</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-900/30 to-yellow-800/20 border-yellow-700/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Custo Estimado</CardTitle>
              <DollarSign className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">R$ {estimatedCosts.toFixed(0)}</div>
              <div className="flex items-center gap-1 mt-2">
                <ArrowDownRight className="h-3 w-3 text-red-400" />
                <span className="text-xs text-red-400">-10% vs orçado</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Investimento total projetado</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/30 to-purple-800/20 border-purple-700/30 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Prioridades Críticas</CardTitle>
              <AlertCircle className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-100">{stats.highPriority}</div>
              <div className="flex items-center gap-1 mt-2">
                <Clock className="h-3 w-3 text-orange-400" />
                <span className="text-xs text-orange-400">{stats.highPriority - stats.completed} pendentes</span>
              </div>
              <p className="text-xs text-slate-400 mt-2">Atividades de alta prioridade</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribuição por Área */}
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <PieChart className="h-5 w-5 text-blue-400" />
                Distribuição por Área
              </CardTitle>
              <CardDescription className="text-slate-400">Visualização das atividades por departamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {areaData.map((area) => (
                  <div key={area.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${area.color}`}></div>
                      <span className="text-sm font-medium text-slate-300">{area.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${area.color}`}
                          style={{ width: `${(area.value / stats.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-8 text-right text-slate-100">{area.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Distribuição por Prioridade */}
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Target className="h-5 w-5 text-red-400" />
                Distribuição por Prioridade
              </CardTitle>
              <CardDescription className="text-slate-400">Análise das prioridades das atividades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {priorityData.map((priority) => (
                  <div key={priority.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${priority.color}`}></div>
                      <span className="text-sm font-medium text-slate-300">{priority.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${priority.color}`}
                          style={{ width: `${(priority.value / stats.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-8 text-right text-slate-100">{priority.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status das Atividades */}
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Activity className="h-5 w-5 text-green-400" />
                Status das Atividades
              </CardTitle>
              <CardDescription className="text-slate-400">Progresso geral das atividades</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusData.map((status) => (
                  <div key={status.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${status.color}`}></div>
                      <span className="text-sm font-medium text-slate-300">{status.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${status.color}`}
                          style={{ width: `${(status.value / stats.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-8 text-right text-slate-100">{status.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Timeline de Progresso */}
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Calendar className="h-5 w-5 text-purple-400" />
                Timeline de Progresso
              </CardTitle>
              <CardDescription className="text-slate-400">Comparação entre planejado e concluído</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timelineData.map((month) => (
                  <div key={month.month} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-300">{month.month}</span>
                      <span className="text-slate-400">{month.completed}/{month.planned}</span>
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1 bg-slate-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-400"
                          style={{ width: `${(month.planned / 8) * 100}%` }}
                        ></div>
                      </div>
                      <div className="flex-1 bg-slate-800 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-green-400"
                          style={{ width: `${(month.completed / 8) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-slate-400">Planejado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-slate-400">Concluído</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance por Responsável */}
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Users className="h-5 w-5 text-orange-400" />
                Performance por Responsável
              </CardTitle>
              <CardDescription className="text-slate-400">Produtividade por membro da equipe</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Marcos', completed: 3, total: 8, color: 'bg-blue-400' },
                  { name: 'Fernando', completed: 1, total: 3, color: 'bg-green-400' },
                  { name: 'Design', completed: 0, total: 2, color: 'bg-purple-400' }
                ].map((person) => (
                  <div key={person.name} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-300">{person.name}</span>
                      <span className="text-slate-400">{person.completed}/{person.total}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${person.color}`}
                        style={{ width: `${(person.completed / person.total) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custo vs Benefício */}
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <DollarSign className="h-5 w-5 text-green-400" />
                Custo vs Benefício
              </CardTitle>
              <CardDescription className="text-slate-400">Análise de investimento por área</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { area: 'Marketing', cost: 5000, benefit: 85, color: 'bg-blue-400' },
                  { area: 'Vendas', cost: 3000, benefit: 70, color: 'bg-green-400' },
                  { area: 'Gestão', cost: 1500, benefit: 60, color: 'bg-yellow-400' }
                ].map((item) => (
                  <div key={item.area} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-slate-300">{item.area}</span>
                      <span className="text-slate-400">{item.benefit}% ROI</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${item.color}`}
                        style={{ width: `${item.benefit}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-slate-500">
                      Custo: R$ {item.cost.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Taxa de Conclusão Semanal */}
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <TrendingIcon className="h-5 w-5 text-purple-400" />
                Taxa de Conclusão Semanal
              </CardTitle>
              <CardDescription className="text-slate-400">Evolução da produtividade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { week: 'Sem 1', rate: 20, trend: 'up' },
                  { week: 'Sem 2', rate: 35, trend: 'up' },
                  { week: 'Sem 3', rate: 28, trend: 'down' },
                  { week: 'Sem 4', rate: 42, trend: 'up' }
                ].map((week) => (
                  <div key={week.week} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-300">{week.week}</span>
                      {week.trend === 'up' ? (
                        <ArrowUpRight className="h-3 w-3 text-green-400" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            week.rate >= 40 ? 'bg-green-400' :
                            week.rate >= 25 ? 'bg-yellow-400' : 'bg-red-400'
                          }`}
                          style={{ width: `${week.rate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-bold w-10 text-right text-slate-100">{week.rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Heatmap de Atividades */}
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Zap className="h-5 w-5 text-yellow-400" />
                Heatmap de Atividades
              </CardTitle>
              <CardDescription className="text-slate-400">Intensidade de atividades por período</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-7 gap-1 text-xs text-center">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                    <div key={day} className="font-medium text-slate-400">{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: 28 }, (_, i) => {
                    const intensity = Math.random()
                    const colorClass =
                      intensity > 0.8 ? 'bg-green-400' :
                      intensity > 0.6 ? 'bg-green-500/70' :
                      intensity > 0.4 ? 'bg-green-600/50' :
                      intensity > 0.2 ? 'bg-green-700/30' :
                      'bg-slate-800'

                    return (
                      <div
                        key={i}
                        className={`h-8 rounded ${colorClass} hover:ring-2 hover:ring-green-400 cursor-pointer transition-all`}
                        title={`Dia ${i + 1}: ${Math.round(intensity * 10)} atividades`}
                      />
                    )
                  })}
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Menos</span>
                  <div className="flex gap-1">
                    <div className="w-3 h-3 bg-slate-800 rounded"></div>
                    <div className="w-3 h-3 bg-green-700/30 rounded"></div>
                    <div className="w-3 h-3 bg-green-600/50 rounded"></div>
                    <div className="w-3 h-3 bg-green-500/70 rounded"></div>
                    <div className="w-3 h-3 bg-green-400 rounded"></div>
                  </div>
                  <span>Mais</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score de Eficiência */}
          <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-100">
                <Award className="h-5 w-5 text-yellow-400" />
                Score de Eficiência
              </CardTitle>
              <CardDescription className="text-slate-400">Avaliação geral de desempenho</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-400 mb-2">78%</div>
                  <div className="text-sm text-slate-400">Score Geral de Eficiência</div>
                  <Progress value={78} className="mt-3 h-3 bg-slate-800" />
                </div>

                <div className="space-y-3">
                  {[
                    { metric: 'Cumprimento de Prazos', score: 85, color: 'bg-green-400' },
                    { metric: 'Qualidade das Entregas', score: 72, color: 'bg-blue-400' },
                    { metric: 'Gestão de Custos', score: 68, color: 'bg-yellow-400' },
                    { metric: 'Colaboração', score: 88, color: 'bg-purple-400' }
                  ].map((item) => (
                    <div key={item.metric} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-300">{item.metric}</span>
                        <span className="text-slate-400">{item.score}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${item.score}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights e Recomendações */}
        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <TrendingUp className="h-5 w-5 text-green-400" />
              Insights Estratégicos
            </CardTitle>
            <CardDescription className="text-slate-400">Análises e recomendações baseadas nos dados</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-700/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-400" />
                  <h4 className="font-medium text-blue-300">Foco em Marketing</h4>
                </div>
                <p className="text-sm text-slate-400">
                  60% das atividades estão concentradas em Marketing. Considere balancear com outras áreas.
                </p>
              </div>
              <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-700/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-yellow-400" />
                  <h4 className="font-medium text-yellow-300">Prioridades Críticas</h4>
                </div>
                <p className="text-sm text-slate-400">
                  {stats.highPriority} atividades de alta prioridade pendentes. Acelere a execução.
                </p>
              </div>
              <div className="p-4 bg-green-900/20 rounded-lg border border-green-700/30 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-400" />
                  <h4 className="font-medium text-green-300">Otimização de Custos</h4>
                </div>
                <p className="text-sm text-slate-400">
                  Custo estimado 10% abaixo do orçado. Bom controle financeiro.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
