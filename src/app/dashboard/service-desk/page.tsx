'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LifeBuoy, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { TicketBoard } from '@/components/service-desk/ticket-board'
import { TicketDrawer } from '@/components/service-desk/ticket-drawer'
import { NewTicketDialog } from '@/components/service-desk/new-ticket-dialog'
import type { TicketCardData } from '@/components/service-desk/ticket-card'
import { usePolling } from '@/hooks/use-polling'
import { contarNovos } from '@/lib/service-desk-badge'

const LS_KEY = 'sd:lastSeen'

export default function ServiceDeskPage() {
  const [tickets, setTickets] = useState<TicketCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTicket, setSelectedTicket] = useState<TicketCardData | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [newTicketOpen, setNewTicketOpen] = useState(false)
  const [lastSeen, setLastSeen] = useState<string | null>(null)

  // Lê lastSeen do localStorage apenas no cliente
  const lastSeenInitialized = useRef(false)
  useEffect(() => {
    if (lastSeenInitialized.current) return
    lastSeenInitialized.current = true
    const stored = localStorage.getItem(LS_KEY)
    setLastSeen(stored)
  }, [])

  /** Marca "visto agora" — zera badge e persiste */
  const markSeen = useCallback(() => {
    const now = new Date().toISOString()
    localStorage.setItem(LS_KEY, now)
    setLastSeen(now)
  }, [])

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/tickets')
      const j = await r.json().catch(() => null)
      if (r.ok && j?.success) {
        setTickets(j.data)
      } else {
        toast.error(j?.error ?? 'Erro ao carregar tickets')
      }
    } catch (err) {
      console.error('Erro ao carregar tickets:', err)
      toast.error('Erro ao carregar tickets')
    } finally {
      setLoading(false)
    }
  }, [])

  // Polling a cada 20s (o hook já trata visibilitychange + fetch imediato no mount)
  usePolling({ fetchFn: load, intervalMs: 20_000 })

  // Ao focar a aba (visibilitychange para visible), marca visto
  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') markSeen()
    }
    document.addEventListener('visibilitychange', handleFocus)
    return () => document.removeEventListener('visibilitychange', handleFocus)
  }, [markSeen])

  // Badge: tickets com createdAt depois do lastSeen
  const novos = contarNovos(tickets, lastSeen)

  const handleTicketClick = (t: TicketCardData) => {
    markSeen()
    setSelectedTicket(t)
    setDrawerOpen(true)
  }

  const handleOpenDemandaInDemandas = (demandaId: string) => {
    window.location.href = `/dashboard/demandas?demandaId=${demandaId}`
  }

  if (loading) {
    return (
      <div className="p-6 space-y-5 max-w-full overflow-hidden">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-32 rounded-md" />
        </div>
        <div className="flex gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-1 space-y-3">
              <Skeleton className="h-6 w-32 rounded-full" />
              <Skeleton className="h-24 rounded-xl" />
              <Skeleton className="h-24 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <LifeBuoy className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Service Desk
              </h1>
              {novos > 0 && (
                <button
                  type="button"
                  onClick={markSeen}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors cursor-pointer"
                  title="Clique para marcar como visto"
                >
                  {novos} novo{novos !== 1 ? 's' : ''}
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} · Kanban de atendimento
            </p>
          </div>
        </div>

        <Button
          onClick={() => setNewTicketOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Novo ticket
        </Button>
      </div>

      {/* Board Kanban */}
      <Card className="bg-slate-50 dark:bg-slate-800/40 rounded-xl shadow-sm border border-slate-200/80 dark:border-slate-700/25">
        <CardContent className="p-4">
          {tickets.length === 0 ? (
            <div className="text-center py-12">
              <LifeBuoy className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Nenhum ticket ainda.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setNewTicketOpen(true)}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Criar primeiro ticket
              </Button>
            </div>
          ) : (
            <TicketBoard
              tickets={tickets}
              onTicketClick={handleTicketClick}
              onTicketsChanged={load}
              onOpenDemandaInDemandas={handleOpenDemandaInDemandas}
            />
          )}
        </CardContent>
      </Card>

      {/* Drawer de detalhe (Sheet lateral — não usa modal para evitar bug menu some) */}
      <TicketDrawer
        ticketId={selectedTicket?.id ?? null}
        open={drawerOpen}
        onOpenChange={(o) => {
          setDrawerOpen(o)
          if (!o) setSelectedTicket(null)
        }}
        onChanged={load}
      />

      {/* Dialog de novo ticket */}
      <NewTicketDialog
        open={newTicketOpen}
        onOpenChange={setNewTicketOpen}
        onCreated={load}
      />
    </div>
  )
}
