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
  Target,
  Briefcase,
  Phone,
  MessageCircle,
  Mail,
  FileText
} from 'lucide-react'
import { getCalendarEvents, CalendarEvent } from '@/actions/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getCalendarEvents()
        // Converter strings de data de volta para objetos Date
        const parsedEvents = data.map(event => ({
          ...event,
          date: new Date(event.date)
        }))
        setEvents(parsedEvents)
      } catch (error) {
        console.error('Error fetching calendar events:', error)
      }
    }

    fetchEvents()
  }, [])

  const getEventColor = (event: CalendarEvent) => {
    if (event.type === 'activity') {
      switch (event.priority) {
        case 0: return 'bg-primary/10 text-primary border-primary/20' // High - Red
        case 1: return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' // Medium - Orange
        case 2: return 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' // Low - Green
        default: return 'bg-muted text-muted-foreground border-border'
      }
    } else if (event.type === 'opportunity') {
      return 'bg-secondary/10 text-secondary-foreground border-secondary/20' // Navy
    } else {
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' // Interaction - Blue
    }
  }

  const getEventIcon = (event: CalendarEvent) => {
    if (event.type === 'activity') {
      return <Target className="h-3 w-3" />
    } else if (event.type === 'opportunity') {
      return <Briefcase className="h-3 w-3" />
    } else {
      switch (event.meta?.interactionType) {
        case 'call': return <Phone className="h-3 w-3" />
        case 'email': return <Mail className="h-3 w-3" />
        case 'whatsapp': return <MessageCircle className="h-3 w-3" />
        default: return <FileText className="h-3 w-3" />
      }
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

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      if (filterType !== 'all' && event.type !== filterType) return false
      return event.date.toDateString() === date.toDateString()
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

  const upcomingEvents = events
    .filter(e => e.date >= new Date())
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 5)

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendário Unificado</h1>
          <p className="text-muted-foreground mt-2">Atividades, Oportunidades e Interações</p>
        </div>
        <div className="flex gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">Todos os eventos</option>
            <option value="activity">Atividades</option>
            <option value="opportunity">Oportunidades</option>
            <option value="interaction">Interações</option>
          </select>
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            onClick={() => setViewMode('month')}
          >
            Mês
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
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
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {getDaysInMonth(currentDate).map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="h-20"></div>
                  }

                  const dayEvents = getEventsForDate(date)
                  const isToday = date.toDateString() === new Date().toDateString()
                  const isSelected = selectedDate?.toDateString() === date.toDateString()

                  return (
                    <div
                      key={date.toISOString()}
                      className={`h-24 border rounded-lg p-2 cursor-pointer transition-all overflow-hidden ${isToday
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-card border-border hover:bg-muted/50'
                        } ${isSelected
                          ? 'ring-2 ring-primary'
                          : ''
                        }`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <div className="text-sm font-medium mb-1">{date.getDate()}</div>
                      <div className="space-y-1">
                        {dayEvents.slice(0, 3).map(event => (
                          <div
                            key={event.id}
                            className={`text-[10px] p-1 rounded truncate border flex items-center gap-1 ${getEventColor(event)}`}
                          >
                            {getEventIcon(event)}
                            <span>{event.title}</span>
                          </div>
                        ))}
                        {dayEvents.length > 3 && (
                          <div className="text-xs text-muted-foreground text-center">
                            +{dayEvents.length - 3} mais
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                <CardDescription>Eventos para esta data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {getEventsForDate(selectedDate).length > 0 ? (
                    getEventsForDate(selectedDate).map(event => (
                      <div key={event.id} className="p-3 bg-muted/30 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-1 rounded-full ${getEventColor(event).split(' ')[0]}`}>
                            {getEventIcon(event)}
                          </div>
                          <h4 className="font-medium text-sm">{event.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">
                            {event.type === 'activity' ? 'Atividade' :
                              event.type === 'opportunity' ? 'Oportunidade' : 'Interação'}
                          </Badge>
                          {event.status && (
                            <Badge variant="secondary" className="text-xs">
                              {event.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Nenhum evento para esta data
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Events */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Próximos Eventos
              </CardTitle>
              <CardDescription>Agenda futura</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-center justify-between p-2 bg-muted/30 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getEventIcon(event)}
                        <h4 className="font-medium text-sm truncate">{event.title}</h4>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(event.date, "dd/MM/yyyy", { locale: ptBR })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
