'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  BarChart3, 
  Target, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp,
  Activity,
  DollarSign,
  MapPin
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
}

export default function DashboardPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  })

  useEffect(() => {
    // Fetch activities from database
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/activities')
        if (response.ok) {
          const data = await response.json()
          setActivities(data)

          // Calculate statistics
          const total = data.length
          const pending = data.filter((a: Activity) => a.status === 'pending').length
          const inProgress = data.filter((a: Activity) => a.status === 'in_progress').length
          const completed = data.filter((a: Activity) => a.status === 'completed').length
          const highPriority = data.filter((a: Activity) => a.priority === 0).length
          const mediumPriority = data.filter((a: Activity) => a.priority === 1).length
          const lowPriority = data.filter((a: Activity) => a.priority === 2).length

          setStats({
            total,
            pending,
            inProgress,
            completed,
            highPriority,
            mediumPriority,
            lowPriority
          })
        }
      } catch (error) {
        console.error('Error fetching activities:', error)
      }
    }

    fetchActivities()
  }, [])

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 0: return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 1: return 'bg-orange-500/20 text-orange-400 border-orange-500/50'
      case 2: return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 0: return 'Alta'
      case 1: return 'Média'
      case 2: return 'Baixa'
      default: return 'Não definida'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
      case 'in_progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/50'
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/50'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'in_progress': return 'Em Andamento'
      case 'completed': return 'Concluído'
      default: return status
    }
  }

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-100">Dashboard Estratégico</h1>
        <p className="text-slate-300 mt-2">Visão geral das atividades do projeto Defenz</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-slate-800/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-100">Total de Atividades</CardTitle>
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.total}</div>
            <p className="text-xs text-slate-300 mt-1">Atividades cadastradas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border-slate-800/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-100">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.inProgress}</div>
            <p className="text-xs text-slate-300 mt-1">Atividades em progresso</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-slate-800/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-100">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{stats.completed}</div>
            <p className="text-xs text-slate-300 mt-1">Atividades finalizadas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-slate-800/50 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-100">Taxa de Conclusão</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-100">{completionRate.toFixed(0)}%</div>
            <Progress value={completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Priority Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <AlertCircle className="h-5 w-5 text-red-400" />
              Distribuição por Prioridade
            </CardTitle>
            <CardDescription className="text-slate-400">Visão geral das prioridades das atividades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-300">Alta Prioridade</span>
              </div>
              <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/50">
                {stats.highPriority}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-300">Média Prioridade</span>
              </div>
              <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/50">
                {stats.mediumPriority}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-slate-300">Baixa Prioridade</span>
              </div>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/50">
                {stats.lowPriority}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <Activity className="h-5 w-5 text-blue-400" />
              Status das Atividades
            </CardTitle>
            <CardDescription className="text-slate-400">Progresso geral das atividades</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Pendentes</span>
                <span className="font-medium text-slate-100">{stats.pending}</span>
              </div>
              <Progress value={(stats.pending / stats.total) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Em Andamento</span>
                <span className="font-medium text-slate-100">{stats.inProgress}</span>
              </div>
              <Progress value={(stats.inProgress / stats.total) * 100} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-300">Concluídas</span>
                <span className="font-medium text-slate-100">{stats.completed}</span>
              </div>
              <Progress value={(stats.completed / stats.total) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <BarChart3 className="h-5 w-5 text-green-400" />
              Áreas de Atuação
            </CardTitle>
            <CardDescription className="text-slate-400">Distribuição por áreas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(
              activities.reduce((acc, activity) => {
                acc[activity.area] = (acc[activity.area] || 0) + 1
                return acc
              }, {} as Record<string, number>)
            ).map(([area, count]) => (
              <div key={area} className="flex justify-between items-center">
                <span className="text-sm text-slate-300">{area}</span>
                <Badge variant="outline" className="border-slate-700 text-slate-300">{count}</Badge>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-2">
                <span className="text-sm text-slate-400">Nenhuma atividade cadastrada</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activities */}
      <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-slate-100">Atividades Recentes</CardTitle>
          <CardDescription className="text-slate-400">Últimas atividades cadastradas no sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity: any) => (
              <div key={activity.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg hover:bg-slate-800/50 transition-colors border border-slate-800/50">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium text-slate-100">{activity.title}</h3>
                    <Badge className={getPriorityColor(activity.priority)}>
                      {getPriorityLabel(activity.priority)}
                    </Badge>
                    <Badge className={getStatusColor(activity.status)}>
                      {getStatusLabel(activity.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{activity.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {activity.responsible}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {activity.deadline}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {activity.cost}
                    </div>
                  </div>
                </div>
                <div className="ml-4">
                  <Badge variant="outline" className="bg-slate-900/50 border-slate-700 text-slate-300">
                    {activity.area}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}