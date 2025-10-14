'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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

export default function ActivitiesTable({
  activities,
  onEdit,
  onView,
  onDelete,
  onUpload,
  onDownload,
  onAddNew
}: ActivitiesTableProps) {
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
          <Badge className="bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30">
            Alta
          </Badge>
        )
      case 1:
        return (
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500/30">
            Média
          </Badge>
        )
      case 2:
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30">
            Baixa
          </Badge>
        )
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50">
            -
          </Badge>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_progress':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30">
            Em Andamento
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30">
            Concluído
          </Badge>
        )
      case 'pending':
      default:
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50 hover:bg-gray-500/30">
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
      <ArrowUp className="h-3 w-3 ml-1 inline text-blue-400" />
    ) : (
      <ArrowDown className="h-3 w-3 ml-1 inline text-blue-400" />
    )
  }

  const renderActivityRow = (activity: Activity) => {
    const [isExpanded, setIsExpanded] = useState(false)

    return (
      <Collapsible key={activity.id} open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="hover:bg-slate-800/30 transition-colors border-b border-slate-800/50 last:border-b-0">
          {/* Main Row */}
          <div className="grid grid-cols-12 gap-4 items-center py-4 px-4">
            {/* Task - 5 cols */}
            <div className="col-span-5 flex items-center gap-2">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-auto hover:bg-transparent"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <div>
                <h3 className="text-sm font-medium text-slate-100 mb-1">
                  {activity.title}
                </h3>
                <p className="text-xs text-slate-400">
                  Assigned to: {activity.responsible || 'Não definido'}
                </p>
              </div>
            </div>

            {/* Area - 2 cols */}
            <div className="col-span-2">
              <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700">
                {activity.area}
              </Badge>
            </div>

            {/* Priority - 2 cols */}
            <div className="col-span-2">
              {getPriorityBadge(activity.priority)}
            </div>

            {/* Status - 2 cols */}
            <div className="col-span-2">
              {getStatusBadge(activity.status)}
            </div>

            {/* Actions - 1 col */}
            <div className="col-span-1 flex justify-end gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 p-2 h-auto"
                onClick={() => onView(activity)}
                title="View"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-green-300 hover:bg-green-500/10 p-2 h-auto"
                onClick={() => onEdit(activity)}
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 h-auto"
                onClick={() => onDelete(activity)}
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Expanded 5W2H Details */}
          <CollapsibleContent>
            <div className="px-4 pb-4 bg-slate-800/20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {/* Por Quê? (Why) */}
                {activity.description && (
                  <div className="md:col-span-2 border-l-2 border-blue-500/50 pl-3">
                    <p className="text-xs font-semibold text-blue-400 mb-1">
                      Por Quê? <span className="text-slate-500 font-normal">(Why - Justificativa)</span>
                    </p>
                    <p className="text-slate-300 whitespace-pre-wrap">{activity.description}</p>
                  </div>
                )}

                {/* Quando? (When) */}
                {activity.deadline && (
                  <div className="border-l-2 border-purple-500/50 pl-3">
                    <p className="text-xs font-semibold text-purple-400 mb-1">
                      Quando? <span className="text-slate-500 font-normal">(When - Prazo)</span>
                    </p>
                    <p className="text-slate-300">{activity.deadline}</p>
                  </div>
                )}

                {/* Onde? (Where) */}
                {activity.location && (
                  <div className="border-l-2 border-green-500/50 pl-3">
                    <p className="text-xs font-semibold text-green-400 mb-1">
                      Onde? <span className="text-slate-500 font-normal">(Where - Local)</span>
                    </p>
                    <p className="text-slate-300">{activity.location}</p>
                  </div>
                )}

                {/* Como? (How) */}
                {activity.how && (
                  <div className="md:col-span-2 border-l-2 border-yellow-500/50 pl-3">
                    <p className="text-xs font-semibold text-yellow-400 mb-1">
                      Como? <span className="text-slate-500 font-normal">(How - Método)</span>
                    </p>
                    <p className="text-slate-300 whitespace-pre-wrap">{activity.how}</p>
                  </div>
                )}

                {/* Quanto? (How Much) */}
                {activity.cost && (
                  <div className="border-l-2 border-orange-500/50 pl-3">
                    <p className="text-xs font-semibold text-orange-400 mb-1">
                      Quanto? <span className="text-slate-500 font-normal">(How Much - Custo)</span>
                    </p>
                    <p className="text-slate-300">{activity.cost}</p>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-slate-100 text-center mb-6">
          Total Tasks Overview
        </h2>
        <div className="grid grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-2">Total</p>
            <p className="text-4xl font-bold text-blue-400">{stats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-2">Completed</p>
            <p className="text-4xl font-bold text-green-400">{stats.completed}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-2">In Progress</p>
            <p className="text-4xl font-bold text-blue-500">{stats.inProgress}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-slate-400 mb-2">Pending</p>
            <p className="text-4xl font-bold text-slate-400">{stats.pending}</p>
          </div>
        </div>
      </div>

      {/* Tabs e Ações */}
      <div className="bg-slate-900/50 border border-slate-800/50 rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-800/50">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="bg-slate-800/30 border-slate-700">
              <TabsTrigger value="active" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100">
                Active Tasks ({activeActivities.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-slate-300 data-[state=active]:bg-slate-700 data-[state=active]:text-slate-100">
                Completed ({completedActivities.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onUpload}
              className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload}
              className="bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
            <Button
              size="sm"
              onClick={onAddNew}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Task
            </Button>
          </div>
        </div>

        {/* Header da tabela */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-slate-800/30 border-b border-slate-800/50 text-xs font-medium text-slate-400 uppercase tracking-wider">
          <button
            className="col-span-5 text-left hover:text-slate-200 transition-colors cursor-pointer flex items-center"
            onClick={() => handleSort('title')}
          >
            Task {getSortIcon('title')}
          </button>
          <button
            className="col-span-2 text-left hover:text-slate-200 transition-colors cursor-pointer flex items-center"
            onClick={() => handleSort('area')}
          >
            Area {getSortIcon('area')}
          </button>
          <button
            className="col-span-2 text-left hover:text-slate-200 transition-colors cursor-pointer flex items-center"
            onClick={() => handleSort('priority')}
          >
            Priority {getSortIcon('priority')}
          </button>
          <button
            className="col-span-2 text-left hover:text-slate-200 transition-colors cursor-pointer flex items-center"
            onClick={() => handleSort('status')}
          >
            Status {getSortIcon('status')}
          </button>
          <div className="col-span-1"></div>
        </div>

        {/* Conteúdo das tabs */}
        <div className="min-h-[400px]">
          {activeTab === 'active' ? (
            <div className="divide-y divide-slate-800/50">
              {activeActivities.length > 0 ? (
                activeActivities.map(renderActivityRow)
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">Nenhuma atividade ativa</p>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-800/50">
              {completedActivities.length > 0 ? (
                completedActivities.map(renderActivityRow)
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">Nenhuma atividade concluída</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
