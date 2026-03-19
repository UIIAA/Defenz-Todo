export type Origin = { id: string; label: string; color: string }
export type Status = { id: string; label: string; icon: string }
export type Priority = { id: string; label: string; color: string }

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
  assignee: null,
  previousStatus: null,
  dateIn: todayStr(),
  deadline: '',
  dateDone: null,
})
