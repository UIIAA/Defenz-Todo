export type Origin = { id: string; label: string; color: string }
export type Status = { id: string; label: string; icon: string }
export type Priority = { id: string; label: string; color: string }
export type Classification = { id: string; label: string; color: string }

export const ORIGINS: Origin[] = [
  { id: 'fernando', label: 'Fernando', color: '#2161F2' },
  { id: 'securisoft', label: 'SecuriSoft', color: '#ffa502' },
  { id: 'autogerada', label: 'Autogerada', color: '#22c55e' },
  { id: 'outra', label: 'Outra', color: '#8899aa' },
]

export const STATUSES: Status[] = [
  { id: 'solicitada', label: 'Solicitada', icon: '📥' },
  { id: 'selecionada', label: 'Selecionada', icon: '🎯' },
  { id: 'em_andamento', label: 'Em Andamento', icon: '⚡' },
  { id: 'concluida', label: 'Concluida', icon: '✅' },
  { id: 'bloqueada', label: 'Bloqueada', icon: '🚫' },
]

export const PRIORITIES: Priority[] = [
  { id: 'alta', label: 'Alta', color: '#ef4444' },
  { id: 'media', label: 'Media', color: '#f59e0b' },
  { id: 'baixa', label: 'Baixa', color: '#3b82f6' },
]

// Departamentos (areas da empresa) — usados em User.department
export const DEPARTMENTS: Classification[] = [
  { id: 'vendas', label: 'Vendas', color: '#f59e0b' },
  { id: 'gerencia', label: 'Gerencia', color: '#8b5cf6' },
  { id: 'marketing', label: 'Marketing', color: '#ec4899' },
  { id: 'financeiro', label: 'Financeiro', color: '#10b981' },
  { id: 'operacional', label: 'Operacional', color: '#6366f1' },
  { id: 'tecnologia', label: 'Tecnologia', color: '#06b6d4' },
  { id: 'administrativo', label: 'Administrativo', color: '#64748b' },
  { id: 'rh', label: 'RH', color: '#f97316' },
  { id: 'juridico', label: 'Juridico', color: '#94a3b8' },
  { id: 'estrategico', label: 'Estrategico', color: '#ef4444' },
]

export const CLASSIFICATIONS: Classification[] = [
  { id: 'marketing', label: 'Marketing', color: '#ec4899' },
  { id: 'administrativo', label: 'Administrativo', color: '#8b5cf6' },
  { id: 'vendas', label: 'Vendas', color: '#f59e0b' },
  { id: 'financeiro', label: 'Financeiro', color: '#10b981' },
  { id: 'operacional', label: 'Operacional', color: '#6366f1' },
  { id: 'tecnologia', label: 'Tecnologia', color: '#06b6d4' },
  { id: 'juridico', label: 'Juridico', color: '#64748b' },
  { id: 'rh', label: 'RH', color: '#f97316' },
  { id: 'estrategico', label: 'Estrategico', color: '#ef4444' },
]

import { toDateStr as _toDateStr, todayStr as _todayStr, getWeekRange, getLastWeekRange, getMonthRange } from '@/lib/date'
export const toDateStr = _toDateStr
export const todayStr = _todayStr

export interface Subtask {
  id: string
  title: string
  completed: boolean
  position: number
  demandaId: string
  estimatedMinutes?: number | null
  spentMinutes?: number
}

export interface DemandaLink {
  id: string
  label: string
  url: string
  position: number
  demandaId: string
}

export interface Demanda {
  id: string
  title: string
  description: string | null
  origin: string
  status: string
  priority: string
  classification: string | null
  assignee: string | null
  assignedToId: string | null
  previousStatus?: string | null
  dateIn: string
  dateStarted: string | null
  deadline: string | null
  dateDone: string | null
  reminderDate: string | null
  reminderSent: boolean
  subtasks?: Subtask[]
  links?: DemandaLink[]
  dependsOn?: string[]
  estimatedMinutes?: number | null
  spentMinutes?: number
}

export type DemandaForm = Omit<Demanda, 'id'> & { id?: string }

/** Total de minutos gastos = horas próprias da demanda + soma das subtarefas. */
export function totalSpentMinutes(d: Pick<Demanda, 'spentMinutes' | 'subtasks'>): number {
  const own = d.spentMinutes ?? 0
  const subs = (d.subtasks ?? []).reduce((acc, s) => acc + (s.spentMinutes ?? 0), 0)
  return own + subs
}

/** Total de minutos estimados (demanda + subtarefas); null quando nada foi estimado. */
export function totalEstimatedMinutes(d: Pick<Demanda, 'estimatedMinutes' | 'subtasks'>): number | null {
  const own = d.estimatedMinutes ?? 0
  const subs = (d.subtasks ?? []).reduce((acc, s) => acc + (s.estimatedMinutes ?? 0), 0)
  const total = own + subs
  return total > 0 ? total : null
}

export function filterByAssignee(
  demandas: Demanda[],
  filterAssignee: string,
  userName: string,
  userEmail: string
): Demanda[] {
  if (filterAssignee === 'all') return demandas
  if (filterAssignee === '__mine__') {
    const nameLower = userName.toLowerCase()
    const emailLower = userEmail.toLowerCase()
    return demandas.filter((d) => {
      const assigneeLower = d.assignee?.toLowerCase() || ''
      return (
        (nameLower && assigneeLower === nameLower) ||
        (emailLower && assigneeLower === emailLower)
      )
    })
  }
  return demandas.filter(
    (d) => d.assignee?.toLowerCase() === filterAssignee.toLowerCase()
  )
}

export type PeriodFilter = 'all' | 'this_week' | 'last_week' | 'this_month' | 'custom'

export function filterByPeriod(
  demandas: Demanda[],
  period: PeriodFilter,
  customFrom?: string,
  customTo?: string
): Demanda[] {
  if (period === 'all') return demandas

  let from: string
  let to: string

  if (period === 'custom') {
    from = customFrom || ''
    to = customTo || ''
  } else if (period === 'this_week') {
    const range = getWeekRange()
    from = range.from
    to = range.to
  } else if (period === 'last_week') {
    const range = getLastWeekRange()
    from = range.from
    to = range.to
  } else {
    const range = getMonthRange()
    from = range.from
    to = range.to
  }

  return demandas.filter((d) => {
    const isConcluida = d.status === 'concluida'
    const dateField = isConcluida ? d.dateDone : d.dateIn
    if (!dateField) return false
    const dateStr = dateField.slice(0, 10) // YYYY-MM-DD
    return dateStr >= from && dateStr <= to
  })
}

export const emptyForm = (): DemandaForm => ({
  title: '',
  description: '',
  origin: 'fernando',
  status: 'solicitada',
  priority: 'media',
  classification: null,
  assignee: null,
  assignedToId: null,
  previousStatus: null,
  dateIn: todayStr(),
  dateStarted: null,
  deadline: '',
  dateDone: null,
  reminderDate: null,
  reminderSent: false,
  estimatedMinutes: null,
  spentMinutes: 0,
  dependsOn: [],
})
