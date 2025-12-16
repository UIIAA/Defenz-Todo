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
          const result = await response.json()
          // A API retorna { success: true, data: activities[], count: number }
          const data = result.data || []
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
    { name: 'Marketing', value: activities.filter(a => a.area === 'Marketing').length, color: 'bg-blue-500' },
    { name: 'Vendas', value: activities.filter(a => a.area === 'Vendas').length, color: 'bg-green-500' },
    { name: 'Gestão', value: activities.filter(a => a.area === 'Gestão').length, color: 'bg-yellow-500' },
    { name: 'Estratégico', value: activities.filter(a => a.area === 'Estratégico').length, color: 'bg-purple-500' },
    { name: 'Back office', value: activities.filter(a => a.area === 'Back office').length, color: 'bg-red-500' }
  ]

  const priorityData = [
    { name: 'Alta', value: stats.highPriority, color: 'bg-red-500' },
    { name: 'Média', value: stats.mediumPriority, color: 'bg-yellow-500' },
    { name: 'Baixa', value: stats.lowPriority, color: 'bg-green-500' }
  ]

  const statusData = [
    { name: 'Pendente', value: stats.pending, color: 'bg-muted-foreground' },
    { name: 'Em Andamento', value: stats.inProgress, color: 'bg-blue-500' },
    { name: 'Concluído', value: stats.completed, color: 'bg-green-500' }
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
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Análise Estratégica</h1>
          <p className="text-muted-foreground mt-2">Visualizações detalhadas do progresso do projeto Defenz</p>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'quarter'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${timeRange === range
                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 border border-border'
                }`}
            >
              {range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Trimestre'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completionRate.toFixed(1)}%</div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">+5% vs mês anterior</span>
            </div>
            <Progress value={completionRate} className="mt-3 h-2" />
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Atividades Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3 text-green-500" />
              <span className="text-xs text-green-500">+2 este mês</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Total de {stats.total} atividades</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Custo Estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {estimatedCosts.toFixed(0)}</div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowDownRight className="h-3 w-3 text-red-500" />
              <span className="text-xs text-red-500">-10% vs orçado</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Investimento total projetado</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Prioridades Críticas</CardTitle>
            <AlertCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.highPriority}</div>
            <div className="flex items-center gap-1 mt-2">
              <Clock className="h-3 w-3 text-orange-500" />
              <span className="text-xs text-orange-500">{stats.highPriority - stats.completed} pendentes</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Atividades de alta prioridade</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Área */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-500" />
              Distribuição por Área
            </CardTitle>
            <CardDescription>Visualização das atividades por departamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {areaData.map((area) => (
                <div key={area.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${area.color}`}></div>
                    <span className="text-sm font-medium">{area.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${area.color}`}
                        style={{ width: `${(area.value / stats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{area.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Prioridade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-red-500" />
              Distribuição por Prioridade
            </CardTitle>
            <CardDescription>Análise das prioridades das atividades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorityData.map((priority) => (
                <div key={priority.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${priority.color}`}></div>
                    <span className="text-sm font-medium">{priority.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${priority.color}`}
                        style={{ width: `${(priority.value / stats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{priority.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status das Atividades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              Status das Atividades
            </CardTitle>
            <CardDescription>Progresso geral das atividades</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {statusData.map((status) => (
                <div key={status.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded-full ${status.color}`}></div>
                    <span className="text-sm font-medium">{status.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${status.color}`}
                        style={{ width: `${(status.value / stats.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold w-8 text-right">{status.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Timeline de Progresso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              Timeline de Progresso
            </CardTitle>
            <CardDescription>Comparação entre planejado e concluído</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timelineData.map((month) => (
                <div key={month.month} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{month.month}</span>
                    <span className="text-muted-foreground">{month.completed}/{month.planned}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${(month.planned / 8) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-green-500"
                        style={{ width: `${(month.completed / 8) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-muted-foreground">Planejado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Concluído</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* New Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance por Responsável */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Performance por Responsável
            </CardTitle>
            <CardDescription>Produtividade por membro da equipe</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Marcos', completed: 3, total: 8, color: 'bg-blue-500' },
                { name: 'Fernando', completed: 1, total: 3, color: 'bg-green-500' },
                { name: 'Design', completed: 0, total: 2, color: 'bg-purple-500' }
              ].map((person) => (
                <div key={person.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{person.name}</span>
                    <span className="text-muted-foreground">{person.completed}/{person.total}</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Custo vs Benefício
            </CardTitle>
            <CardDescription>Análise de investimento por área</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { area: 'Marketing', cost: 5000, benefit: 85, color: 'bg-blue-500' },
                { area: 'Vendas', cost: 3000, benefit: 70, color: 'bg-green-500' },
                { area: 'Gestão', cost: 1500, benefit: 60, color: 'bg-yellow-500' }
              ].map((item) => (
                <div key={item.area} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.area}</span>
                    <span className="text-muted-foreground">{item.benefit}% ROI</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${item.benefit}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Custo: R$ {item.cost.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Taxa de Conclusão Semanal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingIcon className="h-5 w-5 text-purple-500" />
              Taxa de Conclusão Semanal
            </CardTitle>
            <CardDescription>Evolução da produtividade</CardDescription>
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
                    <span className="text-sm font-medium">{week.week}</span>
                    {week.trend === 'up' ? (
                      <ArrowUpRight className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${week.rate >= 40 ? 'bg-green-500' :
                          week.rate >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                        style={{ width: `${week.rate}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold w-10 text-right">{week.rate}%</span>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Heatmap de Atividades
            </CardTitle>
            <CardDescription>Intensidade de atividades por período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-7 gap-1 text-xs text-center">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map(day => (
                  <div key={day} className="font-medium text-muted-foreground">{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 28 }, (_, i) => {
                  const intensity = Math.random()
                  const colorClass =
                    intensity > 0.8 ? 'bg-green-500' :
                      intensity > 0.6 ? 'bg-green-500/70' :
                        intensity > 0.4 ? 'bg-green-500/50' :
                          intensity > 0.2 ? 'bg-green-500/30' :
                            'bg-muted'

                  return (
                    <div
                      key={i}
                      className={`h-8 rounded ${colorClass} hover:ring-2 hover:ring-green-500 cursor-pointer transition-all`}
                      title={`Dia ${i + 1}: ${Math.round(intensity * 10)} atividades`}
                    />
                  )
                })}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Menos</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-muted rounded"></div>
                  <div className="w-3 h-3 bg-green-500/30 rounded"></div>
                  <div className="w-3 h-3 bg-green-500/50 rounded"></div>
                  <div className="w-3 h-3 bg-green-500/70 rounded"></div>
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                </div>
                <span>Mais</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score de Eficiência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Score de Eficiência
            </CardTitle>
            <CardDescription>Avaliação geral de desempenho</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-500 mb-2">78%</div>
                <div className="text-sm text-muted-foreground">Score Geral de Eficiência</div>
                <Progress value={78} className="mt-3 h-3" />
              </div>

              <div className="space-y-3">
                {[
                  { metric: 'Cumprimento de Prazos', score: 85, color: 'bg-green-500' },
                  { metric: 'Qualidade das Entregas', score: 72, color: 'bg-blue-500' },
                  { metric: 'Gestão de Custos', score: 68, color: 'bg-yellow-500' },
                  { metric: 'Colaboração', score: 88, color: 'bg-purple-500' }
                ].map((item) => (
                  <div key={item.metric} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{item.metric}</span>
                      <span className="text-muted-foreground">{item.score}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Insights Estratégicos
          </CardTitle>
          <CardDescription>Análises e recomendações baseadas nos dados</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Target className="h-4 w-4 text-blue-500" />
                <h4 className="font-medium text-blue-600 dark:text-blue-400">Foco em Marketing</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                60% das atividades estão concentradas em Marketing. Considere balancear com outras áreas.
              </p>
            </div>
            <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <h4 className="font-medium text-yellow-600 dark:text-yellow-400">Prioridades Críticas</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.highPriority} atividades de alta prioridade pendentes. Acelere a execução.
              </p>
            </div>
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <h4 className="font-medium text-green-600 dark:text-green-400">Otimização de Custos</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                Custo estimado 10% abaixo do orçado. Bom controle financeiro.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
