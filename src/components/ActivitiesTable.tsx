'use client'

import { useState } from 'react'
import type { ReactElement } from 'react'
import { useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import ActivityComments from '@/components/ActivityComments'
import { ActivityInsightCard, InsightScoreBadge } from '@/components/activities'
import {
  Plus,
  Download,
  Upload,
  Eye,
  Edit2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
  ChevronDown,
  ChevronRight
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
  how: string
  cost: string
  description: string
  createdAt: string
  updatedAt: string
}

interface ActivitiesTableProps {
  activities: Activity[]
  onEdit: (activity: Activity) => void
  onView: (activity: Activity) => void
  onDelete: (activity: Activity) => void
  onUpload: () => void
  onDownload: () => void
  onAddNew: () => void
}

// Componente separado para cada linha (para usar hooks corretamente)
function ActivityRow({
  activity,
  onView,
  onEdit,
  onDelete,
  getPriorityBadge,
  getStatusBadge,
  currentUserEmail
}: {
  activity: Activity
  onView: (activity: Activity) => void
  onEdit: (activity: Activity) => void
  onDelete: (activity: Activity) => void
  getPriorityBadge: (priority: number) => ReactElement
  getStatusBadge: (status: string) => ReactElement
  currentUserEmail: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <div className="hover:bg-muted/50 transition-colors border-b border-border last:border-b-0">
        {/* Main Row */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 items-center py-4 px-4">
          {/* Expand Button */}
          <div className="flex items-center">
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto hover:bg-transparent"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Task - flex grow */}
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-foreground mb-1 truncate">
              {activity.title}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              Assigned to: {activity.responsible || 'Não definido'}
            </p>
          </div>

          {/* Area */}
          <div className="shrink-0">
            <Badge variant="outline" className="bg-muted text-muted-foreground border-border">
              {activity.area}
            </Badge>
          </div>

          {/* Priority */}
          <div className="shrink-0">
            {getPriorityBadge(activity.priority)}
          </div>

          {/* Status */}
          <div className="shrink-0">
            {getStatusBadge(activity.status)}
          </div>

          {/* AI Score */}
          <div className="shrink-0">
            <InsightScoreBadge activityId={activity.id} />
          </div>

          {/* Actions */}
          <div className="shrink-0 flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10 p-2 h-auto"
              onClick={() => onView(activity)}
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-green-500 hover:text-green-600 hover:bg-green-500/10 p-2 h-auto"
              onClick={() => onEdit(activity)}
              title="Edit"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 p-2 h-auto"
              onClick={() => onDelete(activity)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Expanded 5W2H Details */}
        <CollapsibleContent>
          <div className="px-4 pb-4 bg-muted/30 space-y-6">
            {/* AI Insights Section */}
            <div className="pt-4">
              <ActivityInsightCard activityId={activity.id} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {/* Por Quê? (Why) */}
              {activity.description && (
                <div className="md:col-span-2 border-l-2 border-blue-500/50 pl-3">
                  <p className="text-xs font-semibold text-blue-500 mb-1">
                    Por Quê? <span className="text-muted-foreground font-normal">(Why - Justificativa)</span>
                  </p>
                  <p className="text-foreground whitespace-pre-wrap">{activity.description}</p>
                </div>
              )}

              {/* Quando? (When) */}
              {activity.deadline && (
                <div className="border-l-2 border-purple-500/50 pl-3">
                  <p className="text-xs font-semibold text-purple-500 mb-1">
                    Quando? <span className="text-muted-foreground font-normal">(When - Prazo)</span>
                  </p>
                  <p className="text-foreground">{activity.deadline}</p>
                </div>
              )}

              {/* Onde? (Where) */}
              {activity.location && (
                <div className="border-l-2 border-green-500/50 pl-3">
                  <p className="text-xs font-semibold text-green-500 mb-1">
                    Onde? <span className="text-muted-foreground font-normal">(Where - Local)</span>
                  </p>
                  <p className="text-foreground">{activity.location}</p>
                </div>
              )}

              {/* Como? (How) */}
              {activity.how && (
                <div className="md:col-span-2 border-l-2 border-yellow-500/50 pl-3">
                  <p className="text-xs font-semibold text-yellow-500 mb-1">
                    Como? <span className="text-muted-foreground font-normal">(How - Método)</span>
                  </p>
                  <p className="text-foreground whitespace-pre-wrap">{activity.how}</p>
                </div>
              )}

              {/* Quanto? (How Much) */}
              {activity.cost && (
                <div className="border-l-2 border-orange-500/50 pl-3">
                  <p className="text-xs font-semibold text-orange-500 mb-1">
                    Quanto? <span className="text-muted-foreground font-normal">(How Much - Custo)</span>
                  </p>
                  <p className="text-foreground">{activity.cost}</p>
                </div>
              )}
            </div>

            {/* Comments Section */}
            <ActivityComments
              activityId={activity.id}
              currentUserEmail={currentUserEmail}
            />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

export default function ActivitiesTable({
  activities,
  onEdit,
  onView,
  onDelete,
  onUpload,
  onDownload,
  onAddNew
}: ActivitiesTableProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState('active')
  const [sortField, setSortField] = useState<keyof Activity | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  // Função de ordenação
  const handleSort = (field: keyof Activity) => {
    if (sortField === field) {
      // Se já está ordenando por este campo, inverte a direção
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Novo campo de ordenação
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Função para ordenar atividades
  const sortActivities = (activitiesToSort: Activity[]) => {
    if (!sortField) return activitiesToSort

    return [...activitiesToSort].sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      // Tratamento especial para números (priority)
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
      }

      // Tratamento para strings
      const aStr = String(aValue || '').toLowerCase()
      const bStr = String(bValue || '').toLowerCase()

      if (aStr < bStr) return sortDirection === 'asc' ? -1 : 1
      if (aStr > bStr) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }

  // Filtrar atividades por status
  const activeActivities = sortActivities(activities.filter(a => a.status !== 'completed'))
  const completedActivities = sortActivities(activities.filter(a => a.status === 'completed'))

  // Estatísticas
  const stats = {
    total: activities.length,
    completed: completedActivities.length,
    inProgress: activities.filter(a => a.status === 'in_progress').length,
    pending: activities.filter(a => a.status === 'pending').length
  }

  const getPriorityBadge = (priority: number) => {
    switch (priority) {
      case 0:
        return (
          <Badge className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/50 hover:bg-red-500/30">
            Alta
          </Badge>
        )
      case 1:
        return (
          <Badge className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/50 hover:bg-orange-500/30">
            Média
          </Badge>
        )
      case 2:
        return (
          <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50 hover:bg-blue-500/30">
            Baixa
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            -
          </Badge>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/50 hover:bg-blue-500/30">
            Em Andamento
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/50 hover:bg-green-500/30">
            Concluído
          </Badge>
        )
      case 'pending':
      default:
        return (
          <Badge className="bg-muted text-muted-foreground border-border hover:bg-muted/80">
            Pendente
          </Badge>
        )
    }
  }

  // Ícone de ordenação
  const getSortIcon = (field: keyof Activity) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-50" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="h-3 w-3 ml-1 inline text-primary" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline text-primary" />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-foreground text-center mb-6">
          Total Tasks Overview
        </h2>
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Total</p>
            <p className="text-4xl font-bold text-blue-500">{stats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Completed</p>
            <p className="text-4xl font-bold text-green-500">{stats.completed}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">In Progress</p>
            <p className="text-4xl font-bold text-blue-500">{stats.inProgress}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">Pending</p>
            <p className="text-4xl font-bold text-muted-foreground">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Tabs e Ações */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-border">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="bg-muted border-border">
              <TabsTrigger value="active" className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground">
                Active Tasks ({activeActivities.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-muted-foreground data-[state=active]:bg-background data-[state=active]:text-foreground">
                Completed ({completedActivities.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUpload}
              className="bg-background border-border text-muted-foreground hover:bg-muted"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="bg-background border-border text-muted-foreground hover:bg-muted"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              size="sm"
              onClick={onAddNew}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Task
            </Button>
          </div>
        </div>

        {/* Header da tabela */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 bg-muted/50 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <div></div>
          <button
            className="text-left hover:text-foreground transition-colors cursor-pointer flex items-center"
            onClick={() => handleSort('title')}
          >
            Task {getSortIcon('title')}
          </button>
          <button
            className="text-left hover:text-foreground transition-colors cursor-pointer flex items-center"
            onClick={() => handleSort('area')}
          >
            Area {getSortIcon('area')}
          </button>
          <button
            className="text-left hover:text-foreground transition-colors cursor-pointer flex items-center"
            onClick={() => handleSort('priority')}
          >
            Priority {getSortIcon('priority')}
          </button>
          <button
            className="text-left hover:text-foreground transition-colors cursor-pointer flex items-center"
            onClick={() => handleSort('status')}
          >
            Status {getSortIcon('status')}
          </button>
          <div className="text-left">AI Score</div>
          <div></div>
        </div>

        {/* Conteúdo das tabs */}
        <div className="min-h-[400px]">
          {activeTab === 'active' ? (
            <div className="divide-y divide-border">
              {activeActivities.length > 0 ? (
                activeActivities.map(activity => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    getPriorityBadge={getPriorityBadge}
                    getStatusBadge={getStatusBadge}
                    currentUserEmail={session?.user?.email || ''}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma atividade ativa</p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {completedActivities.length > 0 ? (
                completedActivities.map(activity => (
                  <ActivityRow
                    key={activity.id}
                    activity={activity}
                    onView={onView}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    getPriorityBadge={getPriorityBadge}
                    getStatusBadge={getStatusBadge}
                    currentUserEmail={session?.user?.email || ''}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma atividade concluída</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
