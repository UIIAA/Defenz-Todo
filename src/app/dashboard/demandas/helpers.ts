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

export const toDateStr = (d: string | Date | null): string => {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return date.toISOString().split('T')[0]
}

export const todayStr = () => new Date().toISOString().split('T')[0]

export interface Subtask {
  id: string
  title: string
  completed: boolean
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
  previousStatus?: string | null
  dateIn: string
  deadline: string | null
  dateDone: string | null
  subtasks?: Subtask[]
}

export type DemandaForm = Omit<Demanda, 'id'> & { id?: string }

export const emptyForm = (): DemandaForm => ({
  title: '',
  description: '',
  origin: 'fernando',
  status: 'solicitada',
  priority: 'media',
  classification: null,
  assignee: null,
  previousStatus: null,
  dateIn: todayStr(),
  deadline: '',
  dateDone: null,
})
