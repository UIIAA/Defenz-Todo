'use client'

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { useState } from 'react'
import { toast } from 'sonner'
import { TicketColumn } from './ticket-column'
import { TicketCard, type TicketCardData } from './ticket-card'
import { STATUS_ORDER, STATUS_LABELS, WIP_LIMITS, type TicketStatus } from '@/lib/service-desk-config'

interface TicketBoardProps {
  tickets: TicketCardData[]
  onTicketClick: (t: TicketCardData) => void
  onTicketsChanged: () => void | Promise<void>
  onOpenDemandaInDemandas?: (demandaId: string) => void
}

export function TicketBoard({
  tickets,
  onTicketClick,
  onTicketsChanged,
  onOpenDemandaInDemandas,
}: TicketBoardProps) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null)
  // Estado otimista local: cópia dos tickets com status atualizado antes de confirmar na API
  const [optimisticTickets, setOptimisticTickets] = useState<TicketCardData[] | null>(null)

  const displayTickets = optimisticTickets ?? tickets

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over) return

    const ticketId = active.id as string
    const newStatus = over.id as string

    const ticket = tickets.find((t) => t.id === ticketId)
    if (!ticket) return
    if (ticket.status === newStatus) return

    // Verifica se newStatus é um status válido
    if (!STATUS_ORDER.includes(newStatus as TicketStatus)) return

    // Verifica WIP antes do drop — avisa mas não bloqueia (soft).
    // Dispara só no estouro real (pós-drop > limite), alinhado ao destaque vermelho da coluna;
    // "no limite" (=) fica âmbar sem toast. colCount exclui o card arrastado → +1 = total pós-drop.
    const wipLimit = WIP_LIMITS[newStatus as TicketStatus]
    if (wipLimit !== null) {
      const afterDrop = displayTickets.filter((t) => t.status === newStatus && t.id !== ticketId).length + 1
      if (afterDrop > wipLimit) {
        toast.warning(
          `Coluna "${STATUS_LABELS[newStatus as TicketStatus] ?? newStatus}" acima do limite WIP (${afterDrop}/${wipLimit})`
        )
        // Não bloqueia — deixa mover
      }
    }

    // Atualização otimista
    const updated = displayTickets.map((t) =>
      t.id === ticketId ? { ...t, status: newStatus } : t
    )
    setOptimisticTickets(updated)

    try {
      const r = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const j = await r.json().catch(() => null)
      if (!r.ok) {
        // Rollback otimista
        setOptimisticTickets(null)
        toast.error(j?.error ?? 'Erro ao mover ticket')
      } else {
        // Confirma — mantém o otimista ATÉ o refetch concluir (evita flicker de volta à coluna antiga)
        await onTicketsChanged()
        setOptimisticTickets(null)
      }
    } catch {
      setOptimisticTickets(null)
      toast.error('Erro ao mover ticket')
    }
  }

  const activeDrag = activeDragId
    ? displayTickets.find((t) => t.id === activeDragId)
    : null

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto">
        {STATUS_ORDER.map((status) => (
          <TicketColumn
            key={status}
            status={status}
            items={displayTickets.filter((t) => t.status === status)}
            wipLimit={WIP_LIMITS[status]}
            onClickCard={onTicketClick}
            onOpenDemanda={onOpenDemandaInDemandas}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDrag ? (
          <TicketCard
            ticket={activeDrag}
            onClick={() => {}}
            isDragOverlay
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
