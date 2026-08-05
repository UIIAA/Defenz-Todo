'use client'

import { useDraggable } from '@dnd-kit/core'
import { ArrowUpRight, MessageSquare, ExternalLink } from 'lucide-react'
import { ageColor, ageDays, STATUS_LABELS, type TicketStatus } from '@/lib/service-desk-config'

export interface TicketCardData {
  id: string
  subject: string
  status: string
  priority: string
  client: string | null
  requester: string | null
  createdAt: string
  escalatedAt: string | null
  escalatedTo: string | null
  columnChangedAt: string | null
  demandaId: string | null
  _count: { messages: number }
}

const PRIORITY_STYLES: Record<string, { label: string; cls: string }> = {
  alta: { label: 'Alta', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  media: { label: 'Média', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  baixa: { label: 'Baixa', cls: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-300' },
}

const AGE_CARD_STYLES: Record<string, string> = {
  green: '',
  amber:
    'border-amber-400 dark:border-amber-500 bg-amber-50/60 dark:bg-amber-900/10',
  black:
    'border-slate-700 dark:border-slate-400 bg-slate-100 dark:bg-slate-700/60',
}

const AGE_BADGE_STYLES: Record<string, string> = {
  green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  black: 'bg-slate-800 text-slate-100 dark:bg-slate-200 dark:text-slate-900',
}

export function TicketCard({
  ticket,
  onClick,
  onOpenDemanda,
  isDragOverlay,
}: {
  ticket: TicketCardData
  onClick: (t: TicketCardData) => void
  onOpenDemanda?: (id: string) => void
  isDragOverlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: ticket.id,
    data: { ticket },
    disabled: isDragOverlay,
  })

  const now = new Date()
  // Aging: base = quando entrou na coluna atual. Tickets nunca movidos têm columnChangedAt nulo
  // → cai pra createdAt, senão ficariam "há 0d" verde pra sempre em Solicitado (onde o backlog acumula).
  const agingFrom = ticket.columnChangedAt ?? ticket.createdAt
  const color = ageColor(ticket.status, agingFrom, now)
  const days = ageDays(agingFrom, now)
  const prio = PRIORITY_STYLES[ticket.priority]
  const isEscalated = !!ticket.escalatedAt
  const isConcluido = ticket.status === 'concluido'

  const cardCls = [
    'group rounded-xl p-3 cursor-pointer transition-all border shadow-[0_1px_3px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.06)] dark:shadow-[0_2px_6px_rgba(0,0,0,0.3)]',
    'hover:shadow-[0_2px_6px_rgba(0,0,0,0.12),0_4px_16px_rgba(0,0,0,0.1)]',
    isConcluido
      ? 'bg-white dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
      : AGE_CARD_STYLES[color] || 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700',
    isDragging ? 'opacity-50' : 'hover:-translate-y-0.5',
    isDragOverlay ? 'rotate-2 scale-105 shadow-xl' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const handleOpenDemandaClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (ticket.demandaId && onOpenDemanda) {
      onOpenDemanda(ticket.demandaId)
    }
  }

  return (
    <div
      ref={setNodeRef}
      data-ticket-id={ticket.id}
      onClick={() => { if (!isDragging) onClick(ticket) }}
      className={cardCls}
      {...listeners}
      {...attributes}
    >
      {/* Assunto */}
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 leading-tight flex-1">
          {ticket.subject}
        </span>
        {prio && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${prio.cls}`}>
            {prio.label}
          </span>
        )}
      </div>

      {/* Cliente */}
      {ticket.client && (
        <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mb-1 truncate">
          {ticket.client}
        </div>
      )}

      {/* Solicitante (fallback) */}
      {!ticket.client && ticket.requester && (
        <div className="text-[10px] text-slate-400 mb-1 truncate">
          → {ticket.requester}
        </div>
      )}

      {/* Badges + aging */}
      <div className="flex items-center gap-1.5 flex-wrap mt-1">
        {/* Escalado N2 */}
        {isEscalated && (
          <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 shrink-0">
            <ArrowUpRight className="h-2.5 w-2.5" />
            N2{ticket.escalatedTo ? `: ${ticket.escalatedTo}` : ''}
          </span>
        )}

        {/* Interações */}
        <span className="flex items-center gap-0.5 text-[9px] text-slate-400 shrink-0">
          <MessageSquare className="h-2.5 w-2.5" />
          {ticket._count.messages}
        </span>

        {/* Aging (não mostra em Concluído) */}
        {!isConcluido && (
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${AGE_BADGE_STYLES[color]}`}>
            há {days}d
          </span>
        )}

        {/* Demanda vinculada */}
        {ticket.demandaId && (
          <button
            type="button"
            onClick={handleOpenDemandaClick}
            onPointerDown={(e) => e.stopPropagation()}
            className="flex items-center gap-0.5 text-[9px] px-1 py-0.5 rounded bg-blue-50 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400 shrink-0 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:underline"
            title="Abrir demanda vinculada"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            demanda
          </button>
        )}
      </div>
    </div>
  )
}

/** Status label canônico para exibição */
export function statusLabel(status: string): string {
  return STATUS_LABELS[status as TicketStatus] ?? status
}
