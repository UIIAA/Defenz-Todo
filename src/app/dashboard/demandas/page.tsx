'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Upload, ChevronDown, LayoutGrid, List, ClipboardList, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/empty-state'
import { toast } from 'sonner'
import { DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent } from '@dnd-kit/core'
import {
  ORIGINS,
  CLASSIFICATIONS,
  STATUSES,
  toDateStr,
  todayStr,
  filterByAssignee,
  filterByPeriod,
  type Demanda,
  type DemandaForm,
  type PeriodFilter,
} from './helpers'

import { ImportModal } from '@/components/demandas/import-modal'
import { DemandaModal } from '@/components/demandas/demanda-modal'
import { KanbanCard } from '@/components/demandas/kanban-card'
import { KanbanColumn } from '@/components/demandas/kanban-column'
import { GanttChart, TIME_RANGE_CONFIG, type TimeRange } from '@/components/demandas/gantt-chart'
import { ListViewTable, type SortableField } from '@/components/demandas/list-view-table'
import { useWipLimits } from '@/hooks/use-wip-limits'
import { WipSettingsPopover } from '@/components/demandas/wip-settings-popover'
import { BlockedLane } from '@/components/demandas/blocked-lane'
import { TeamSelector } from '@/components/team-selector'
import { CompanySelector } from '@/components/company-selector'

export default function DemandasPage() {
  const { data: session } = useSession()
  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [editingDemanda, setEditingDemanda] = useState<Demanda | null>(null)
  const [filterOrigin, setFilterOrigin] = useState('all')
  const [filterClassification, setFilterClassification] = useState('all')
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [timeRange, setTimeRange] = useState<TimeRange>('weeks')
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [kanbanOpen, setKanbanOpen] = useState(true)
  const [timelineOpen, setTimelineOpen] = useState(true)
  const [sortField, setSortField] = useState<SortableField>('title')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>('all')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [filterCompany, setFilterCompany] = useState('all')
  const [filterTeam, setFilterTeam] = useState('all')
  const [highlightedCardId, setHighlightedCardId] = useState<string | null>(null)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  const { limits: wipLimits, setLimit: setWipLimit, getLimit: getWipLimit, userLimits: wipUserLimits, setUserLimit: setWipUserLimit, getUserLimit: getWipUserLimit } = useWipLimits()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  )

  const userRole = session?.user?.role || ''
  const isAdmin = userRole === 'admin'
  const isGerencia = userRole === 'gerencia'
  const isAdminOrGerencia = isAdmin || isGerencia

  // Active team: used when creating demandas
  const userTeamIds = (session?.user as { teamIds?: string[] })?.teamIds || []
  const activeTeamId = filterTeam !== 'all' ? filterTeam : (userTeamIds.length === 1 ? userTeamIds[0] : undefined)

  const fetchDemandas = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (isAdmin && filterCompany !== 'all') {
        params.set('companyId', filterCompany)
      }
      if (filterTeam !== 'all') {
        params.set('teamId', filterTeam)
      }
      const url = `/api/demandas${params.toString() ? `?${params}` : ''}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.success) {
        setDemandas(json.data)
      }
    } catch (err) {
      console.error('Erro ao carregar demandas:', err)
    } finally {
      setLoading(false)
    }
  }, [isAdmin, filterCompany, filterTeam])

  useEffect(() => {
    fetchDemandas()
    const interval = setInterval(fetchDemandas, 30000)
    return () => clearInterval(interval)
  }, [fetchDemandas])

  // Clear highlight after 2s
  useEffect(() => {
    if (highlightedCardId) {
      const timer = setTimeout(() => setHighlightedCardId(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [highlightedCardId])

  const handleSave = async (form: DemandaForm) => {
    try {
      const method = form.id ? 'PUT' : 'POST'
      // For new demandas, attach the active team
      const payload = form.id ? form : { ...form, teamId: activeTeamId }
      const res = await fetch('/api/demandas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (json.success) {
        await fetchDemandas()
        setModalOpen(false)
        setEditingDemanda(null)
      } else {
        toast.error(json.error || 'Erro ao salvar demanda')
      }
    } catch (err) {
      console.error('Erro ao salvar demanda:', err)
      toast.error('Erro ao salvar demanda')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/demandas?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        await fetchDemandas()
        setModalOpen(false)
        setEditingDemanda(null)
      }
    } catch (err) {
      console.error('Erro ao excluir demanda:', err)
    }
  }

  const openNew = () => {
    setEditingDemanda(null)
    setModalOpen(true)
  }

  const openEdit = (d: Demanda) => {
    setEditingDemanda(d)
    setModalOpen(true)
  }

  const handleBarClick = (demandaId: string) => {
    setViewMode('kanban')
    setHighlightedCardId(demandaId)
    // Scroll to card after view switches
    setTimeout(() => {
      const el = document.querySelector(`[data-demanda-id="${demandaId}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 100)
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const demandaId = active.id as string
    const overId = over.id as string
    const demanda = demandas.find((d) => d.id === demandaId)
    if (!demanda) return

    // Determine target status — blocked-* zones mean "bloqueada" with previousStatus
    const isBlockedZone = overId.startsWith('blocked-')
    const newStatus = isBlockedZone ? 'bloqueada' : overId
    const previousStatus = isBlockedZone ? overId.replace('blocked-', '') : null

    if (demanda.status === newStatus && !isBlockedZone) return

    // Check WIP limit per column (advisory — warn but allow)
    if (!isBlockedZone) {
      const wipLimit = getWipLimit(newStatus)
      const currentCount = demandas.filter((d) => d.status === newStatus).length
      if (wipLimit && currentCount >= wipLimit) {
        toast.warning(`Coluna "${STATUSES.find((s) => s.id === newStatus)?.label}" esta no limite WIP (${currentCount}/${wipLimit})`)
      }
    }

    // Check WIP limit per user (advisory — warn but allow)
    if (demanda.assignee && newStatus !== 'concluida' && newStatus !== 'bloqueada') {
      const userWipLimit = getWipUserLimit(demanda.assignee)
      const userActiveCount = demandas.filter(
        (d) => d.assignee === demanda.assignee && d.status !== 'concluida' && d.status !== 'bloqueada' && d.id !== demandaId
      ).length
      if (userWipLimit && userActiveCount >= userWipLimit) {
        toast.warning(`${demanda.assignee} esta no limite WIP pessoal (${userActiveCount}/${userWipLimit})`)
      }
    }

    // Detect reopen (concluida -> any other status)
    const isReopen = demanda.status === 'concluida' && newStatus !== 'concluida'

    // Optimistic update
    const updatedDemandas = demandas.map((d) => {
      if (d.id !== demandaId) return d
      return {
        ...d,
        status: newStatus,
        previousStatus: isBlockedZone ? previousStatus : (newStatus !== 'bloqueada' ? null : d.previousStatus),
        dateStarted: (newStatus === 'em_andamento' && !d.dateStarted) ? todayStr() : d.dateStarted,
        dateDone: newStatus === 'concluida' ? todayStr() : (isReopen ? null : d.dateDone),
      }
    })
    setDemandas(updatedDemandas)

    if (isReopen) {
      toast.info('Demanda reaberta — registrado no historico')
    }

    // Persist to API
    try {
      const res = await fetch('/api/demandas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: demandaId,
          status: newStatus,
          dateDone: newStatus === 'concluida' ? todayStr() : null,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setDemandas(demandas)
        toast.error('Erro ao mover demanda')
      } else if (isReopen) {
        // Re-fetch to sync server-side description changes
        fetchDemandas()
      }
    } catch {
      setDemandas(demandas)
      toast.error('Erro ao mover demanda')
    }
  }

  const activeDemanda = activeDragId ? demandas.find((d) => d.id === activeDragId) : null

  // Lista unica de responsaveis
  const assignees = useMemo(() => {
    const set = new Set<string>()
    demandas.forEach((d) => { if (d.assignee) set.add(d.assignee) })
    return Array.from(set).sort()
  }, [demandas])

  const userName = session?.user?.name || ''
  const userEmail = session?.user?.email || ''

  const filtered = filterByPeriod(
    filterByAssignee(
      demandas
        .filter((d) => filterOrigin === 'all' || d.origin === filterOrigin)
        .filter((d) => filterClassification === 'all' || d.classification === filterClassification),
      filterAssignee,
      userName,
      userEmail
    ),
    filterPeriod,
    customFrom,
    customTo
  )

  // Bloqueada lane: separate blocked from normal columns
  const KANBAN_STATUSES = STATUSES.filter((s) => s.id !== 'bloqueada')
  const blockedDemandas = filtered.filter((d) => d.status === 'bloqueada')

  const stats = {
    total: filtered.length,
    ativas: filtered.filter((d) => d.status === 'em_andamento').length,
    selecionadas: filtered.filter((d) => d.status === 'selecionada').length,
    pendentes: filtered.filter((d) => d.status === 'solicitada').length,
    atrasadas: filtered.filter(
      (d) => d.deadline && toDateStr(d.deadline) < todayStr() && d.status !== 'concluida'
    ).length,
    concluidas: filtered.filter((d) => d.status === 'concluida').length,
  }

  const activeFilterCount = [
    filterOrigin !== 'all',
    filterAssignee !== 'all',
    filterClassification !== 'all',
    filterPeriod !== 'all',
    filterCompany !== 'all',
    filterTeam !== 'all',
  ].filter(Boolean).length

  const clearAllFilters = () => {
    setFilterOrigin('all')
    setFilterAssignee('all')
    setFilterClassification('all')
    setFilterPeriod('all')
    setFilterCompany('all')
    setFilterTeam('all')
    setCustomFrom('')
    setCustomTo('')
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (modalOpen || importModalOpen) return
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if (e.key === 'n') { e.preventDefault(); openNew() }
      if (e.key === 'i') { e.preventDefault(); setImportModalOpen(true) }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [modalOpen, importModalOpen])

  if (loading) {
    return (
      <div className="p-6 space-y-5 max-w-full overflow-hidden">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-7 w-40 mb-2" />
            <Skeleton className="h-4 w-56" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (demandas.length === 0) {
    return (
      <div className="p-6 max-w-full overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Demandas</h1>
            <p className="text-sm text-slate-600 dark:text-slate-200 mt-0.5 dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">Kanban e timeline de demandas</p>
          </div>
        </div>
        <Card className="bg-white dark:bg-slate-800 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)] border border-slate-200 dark:border-slate-700">
          <CardContent>
            <EmptyState
              icon={<ClipboardList />}
              title="Nenhuma demanda ainda"
              description="Crie sua primeira demanda ou importe de uma planilha"
              action={{ label: 'Nova Demanda', onClick: openNew }}
              secondaryAction={{ label: 'Importar', onClick: () => setImportModalOpen(true) }}
            />
          </CardContent>
        </Card>
        <DemandaModal demanda={editingDemanda} open={modalOpen} onOpenChange={(open) => { setModalOpen(open); if (!open) setEditingDemanda(null) }} onSave={handleSave} onDelete={handleDelete} onSubtaskChange={fetchDemandas} />
        <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} onImported={fetchDemandas} />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
            Demandas
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-200 mt-0.5 dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]">
            Kanban e timeline de demandas
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {/* View Toggle */}
          <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title="Kanban"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 transition-colors ${
                viewMode === 'list'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-500 border-l border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
              title="Lista"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button
            variant="outline"
            onClick={() => setImportModalOpen(true)}
            className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Upload className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Importar</span>
            <kbd className="ml-1.5 text-[10px] bg-slate-200 dark:bg-slate-600 px-1 py-0.5 rounded text-slate-500 dark:text-slate-300 hidden sm:inline">I</kbd>
          </Button>
          <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Nova Demanda</span>
            <kbd className="ml-1.5 text-[10px] bg-white/20 px-1 py-0.5 rounded hidden sm:inline">N</kbd>
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: '#94a3b8' },
          { label: 'Solicitadas', value: stats.pendentes, color: '#f59e0b' },
          { label: 'Selecionadas', value: stats.selecionadas, color: '#8b5cf6' },
          { label: 'Em Andamento', value: stats.ativas, color: '#3b82f6' },
          { label: 'Atrasadas', value: stats.atrasadas, color: '#ef4444' },
          { label: 'Concluidas', value: stats.concluidas, color: '#22c55e' },
        ].map((s) => (
          <Card
            key={s.label}
            className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700"
            style={{ borderTopWidth: 3, borderTopColor: s.color }}
          >
            <CardContent className="p-3">
              <div className="text-2xl font-bold" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mt-0.5">
                {s.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Empresa (admin only) */}
        {isAdmin && (
          <CompanySelector value={filterCompany} onChange={(v) => { setFilterCompany(v); setFilterTeam('all') }} />
        )}

        {/* Equipe (admin/gerencia — scoped by company) */}
        {isAdminOrGerencia && (
          <TeamSelector value={filterTeam} onChange={setFilterTeam} companyId={isAdmin ? filterCompany : undefined} />
        )}

        {/* Equipe (user com múltiplas equipes) */}
        {!isAdminOrGerencia && userTeamIds.length > 1 && (
          <TeamSelector value={filterTeam} onChange={setFilterTeam} />
        )}

        {/* Origem */}
        <Select value={filterOrigin} onValueChange={setFilterOrigin}>
          <SelectTrigger className="w-[140px] h-9 text-xs">
            <SelectValue placeholder="Origem" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas origens</SelectItem>
            {ORIGINS.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: o.color }} />
                  {o.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Responsavel */}
        <Select value={filterAssignee} onValueChange={setFilterAssignee}>
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue placeholder="Responsavel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="__mine__">Minhas</SelectItem>
            {assignees.map((name) => (
              <SelectItem key={name} value={name}>{name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Classificacao */}
        <Select value={filterClassification} onValueChange={setFilterClassification}>
          <SelectTrigger className="w-[170px] h-9 text-xs">
            <SelectValue placeholder="Classificacao" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas classificacoes</SelectItem>
            {CLASSIFICATIONS.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
                  {c.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Periodo */}
        <Select value={filterPeriod} onValueChange={(v) => setFilterPeriod(v as PeriodFilter)}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todo periodo</SelectItem>
            <SelectItem value="this_week">Esta semana</SelectItem>
            <SelectItem value="last_week">Semana passada</SelectItem>
            <SelectItem value="this_month">Este mes</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {/* Date inputs for custom period */}
        {filterPeriod === 'custom' && (
          <>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs px-2 py-1.5 h-9"
            />
            <span className="text-xs text-slate-500">ate</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs px-2 py-1.5 h-9"
            />
          </>
        )}

        {/* Active filters indicator + Clear */}
        {activeFilterCount > 0 && (
          <>
            <Badge variant="secondary" className="text-xs h-7">
              {activeFilterCount} filtro{activeFilterCount > 1 ? 's' : ''}
            </Badge>
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
            >
              <X className="h-3 w-3" />
              Limpar
            </button>
          </>
        )}
      </div>

      {/* Kanban / List View */}
      {viewMode === 'kanban' ? (
        <Card className="bg-slate-50 dark:bg-slate-800/40 rounded-xl shadow-sm shadow-slate-900/[0.04] border border-slate-200/80 dark:border-slate-700/25">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setKanbanOpen(!kanbanOpen)}
                className="flex items-center gap-2 cursor-pointer group"
              >
                <ChevronDown className={`h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 ${kanbanOpen ? '' : '-rotate-90'}`} />
                <span className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Kanban
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {filtered.length} demanda{filtered.length !== 1 ? 's' : ''}
                </span>
              </button>
              {kanbanOpen && (
                <WipSettingsPopover limits={wipLimits} onSetLimit={setWipLimit} userLimits={wipUserLimits} onSetUserLimit={setWipUserLimit} assignees={assignees} />
              )}
            </div>
            {kanbanOpen && (
              <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex gap-3 overflow-x-auto">
                  {KANBAN_STATUSES.map((s, index) => (
                    <KanbanColumn
                      key={s.id}
                      status={s}
                      items={filtered.filter((d) => d.status === s.id)}
                      onClickCard={openEdit}
                      isLast={index === KANBAN_STATUSES.length - 1}
                      highlightedCardId={highlightedCardId}
                      wipLimit={getWipLimit(s.id)}
                    />
                  ))}
                </div>

                {/* Bloqueada Lane — always visible as drop target */}
                <BlockedLane
                  demandas={blockedDemandas}
                  kanbanStatuses={KANBAN_STATUSES}
                  onClickCard={openEdit}
                  highlightedCardId={highlightedCardId}
                />

                <DragOverlay>
                  {activeDemanda ? (
                    <KanbanCard d={activeDemanda} onClick={() => {}} isDragOverlay />
                  ) : null}
                </DragOverlay>
              </DndContext>
            )}
          </CardContent>
        </Card>
      ) : (
        <ListViewTable
          demandas={filtered}
          onClickRow={openEdit}
          sortField={sortField}
          sortDir={sortDir}
          onSort={(field) => {
            if (field === sortField) {
              setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
            } else {
              setSortField(field)
              setSortDir('asc')
            }
          }}
        />
      )}

      {/* Gantt */}
      <Card className="bg-blue-50 dark:bg-slate-800/40 rounded-xl shadow-sm shadow-slate-900/[0.04] border border-slate-200/80 dark:border-slate-700/25">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setTimelineOpen(!timelineOpen)}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <ChevronDown className={`h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 ${timelineOpen ? '' : '-rotate-90'}`} />
              <span className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                Timeline
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">— demandas ativas</span>
            </button>
            {timelineOpen && (
              <div className="flex gap-1 flex-wrap">
                {(['hours', 'days', 'weeks', 'months'] as TimeRange[]).map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      timeRange === range
                        ? 'bg-white/80 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30'
                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {TIME_RANGE_CONFIG[range].label}
                  </button>
                ))}
              </div>
            )}
          </div>
          {timelineOpen && (
            <div className="max-h-[50vh] overflow-y-auto">
              <GanttChart demandas={filtered} timeRange={timeRange} onBarClick={handleBarClick} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <DemandaModal
        demanda={editingDemanda}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setEditingDemanda(null)
        }}
        onSave={handleSave}
        onDelete={handleDelete}
        onSubtaskChange={fetchDemandas}
      />

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImported={fetchDemandas}
      />
    </div>
  )
}
