'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  MapPin,
  DollarSign,
  Filter
} from 'lucide-react'

interface Activity {
  id: string
  title: string
  area: string
  priority: number
  status: string
  responsible: string
  deadline: string
  location: string
  cost: string
  description: string
  createdAt: string
  updatedAt: string
}

export default function CalendarPage() {
  const [activities, setActivities] = useState<Activity[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [filterArea, setFilterArea] = useState('all')

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

  // Cores dark theme para prioridade
  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 0: return 'bg-red-500/20 text-red-400 border-red-500/50'
      case 1: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
      case 2: return 'bg-green-500/20 text-green-400 border-green-500/50'
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/50'
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

  // Ícones de status com cores dark theme
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-3 w-3 text-green-400" />
      case 'in_progress': return <Clock className="h-3 w-3 text-blue-400" />
      case 'pending': return <AlertCircle className="h-3 w-3 text-yellow-400" />
      default: return <AlertCircle className="h-3 w-3 text-slate-400" />
    }
  }

  const getDaysInMonth = (date: Date): (Date | null)[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days: (Date | null)[] = []
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }

    return days
  }

  const getActivitiesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return activities.filter(activity => {
      if (filterArea !== 'all' && activity.area !== filterArea) return false
      return activity.deadline === dateStr
    })
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  const areas = ['Marketing', 'Vendas', 'Gestão', 'Estratégico', 'Back office']

  const filteredActivities = filterArea === 'all'
    ? activities
    : activities.filter(a => a.area === filterArea)

  const upcomingDeadlines = activities
    .filter(a => a.status !== 'completed')
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-100">Calendário de Atividades</h1>
            <p className="text-slate-400 mt-2">Visualize e gerencie os prazos das atividades estratégicas</p>
          </div>
          <div className="flex gap-2">
            <select
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
              className="px-3 py-2 bg-slate-900/50 border border-slate-800/50 rounded-lg text-sm text-slate-100 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">Todas as áreas</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              onClick={() => setViewMode('month')}
              className={viewMode === 'month'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-900/50 border-slate-800/50 text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
              }
            >
              Mês
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              onClick={() => setViewMode('week')}
              className={viewMode === 'week'
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-900/50 border-slate-800/50 text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
              }
            >
              Semana
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <CalendarIcon className="h-5 w-5 text-blue-400" />
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('prev')}
                      className="bg-slate-900/50 border-slate-800/50 text-slate-300 hover:bg-slate-800/50 hover:text-slate-100"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigateMonth('next')}
                      className="bg-slate-900/50 border-slate-800/50 text-slate-300 hover:bg-slate-800/50 hover:text-slate-100"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {/* Week days */}
                  {weekDays.map(day => (
                    <div key={day} className="text-center text-sm font-medium text-slate-400 py-2">
                      {day}
                    </div>
                  ))}

                  {/* Calendar days */}
                  {getDaysInMonth(currentDate).map((date, index) => {
                    if (!date) {
                      return <div key={`empty-${index}`} className="h-20"></div>
                    }

                    const dayActivities = getActivitiesForDate(date)
                    const isToday = date.toDateString() === new Date().toDateString()
                    const isSelected = selectedDate?.toDateString() === date.toDateString()

                    return (
                      <div
                        key={date.toISOString()}
                        className={`h-20 border rounded-lg p-2 cursor-pointer transition-all ${
                          isToday
                            ? 'bg-blue-500/10 border-blue-500/50'
                            : 'bg-slate-800/30 border-slate-800/50'
                        } ${
                          isSelected
                            ? 'ring-2 ring-blue-500/50'
                            : ''
                        } hover:bg-slate-700/30 hover:border-slate-700/50`}
                        onClick={() => setSelectedDate(date)}
                      >
                        <div className="text-sm font-medium mb-1 text-slate-100">{date.getDate()}</div>
                        <div className="space-y-1">
                          {dayActivities.slice(0, 2).map(activity => (
                            <div
                              key={activity.id}
                              className={`text-xs p-1 rounded truncate border ${getPriorityColor(activity.priority)}`}
                            >
                              {activity.title}
                            </div>
                          ))}
                          {dayActivities.length > 2 && (
                            <div className="text-xs text-slate-400">
                              +{dayActivities.length - 2} mais
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Date Details */}
            {selectedDate && (
              <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-slate-100">
                    {selectedDate.toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </CardTitle>
                  <CardDescription className="text-slate-400">Atividades para esta data</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {getActivitiesForDate(selectedDate).length > 0 ? (
                      getActivitiesForDate(selectedDate).map(activity => (
                        <div key={activity.id} className="p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(activity.status)}
                            <h4 className="font-medium text-sm text-slate-100">{activity.title}</h4>
                          </div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <Badge className={getPriorityColor(activity.priority)}>
                              {getPriorityLabel(activity.priority)}
                            </Badge>
                            <Badge className="bg-slate-700/50 text-slate-300 border-slate-600/50">
                              {activity.area}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-400 space-y-1">
                            <div className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {activity.responsible}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {activity.location}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              {activity.cost}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 text-center py-4">
                        Nenhuma atividade para esta data
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Deadlines */}
            <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Clock className="h-5 w-5 text-orange-400" />
                  Próximos Prazos
                </CardTitle>
                <CardDescription className="text-slate-400">Atividades com vencimento em breve</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingDeadlines.map(activity => (
                    <div key={activity.id} className="flex items-center justify-between p-2 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(activity.status)}
                          <h4 className="font-medium text-sm text-slate-100 truncate">{activity.title}</h4>
                        </div>
                        <div className="text-xs text-slate-400">
                          {new Date(activity.deadline).toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <Badge className={`${getPriorityColor(activity.priority)} ml-2 shrink-0`}>
                        {getPriorityLabel(activity.priority)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-100">
                  <Target className="h-5 w-5 text-blue-400" />
                  Estatísticas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Total de Atividades</span>
                    <span className="font-medium text-slate-100">{filteredActivities.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Pendentes</span>
                    <span className="font-medium text-yellow-400">
                      {filteredActivities.filter(a => a.status === 'pending').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Em Andamento</span>
                    <span className="font-medium text-blue-400">
                      {filteredActivities.filter(a => a.status === 'in_progress').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Concluídas</span>
                    <span className="font-medium text-green-400">
                      {filteredActivities.filter(a => a.status === 'completed').length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
