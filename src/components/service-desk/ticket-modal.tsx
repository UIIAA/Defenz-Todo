'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ArrowUpRight, Link2, MessageSquare, StickyNote, Send } from 'lucide-react'
import { toast } from 'sonner'
import { TICKET_STATUS_META, TICKET_CHANNEL_LABELS, TICKET_PRIORITY_LABELS } from './ticket-helpers'

interface TicketMessage {
  id: string
  kind: string
  body: string
  createdAt: string
}
interface TicketDetail {
  id: string
  subject: string
  description: string | null
  status: string
  priority: string
  channel: string | null
  requester: string | null
  escalatedAt: string | null
  escalatedTo: string | null
  resolvedAt: string | null
  createdAt: string
  assignedTo: { name: string | null; email: string | null } | null
  demanda: { id: string; title: string; status: string } | null
  messages: TicketMessage[]
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'

export function TicketModal({
  ticketId, open, onOpenChange, onChanged,
}: {
  ticketId: string | null
  open: boolean
  onOpenChange: (o: boolean) => void
  onChanged: () => void
}) {
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [msgKind, setMsgKind] = useState<'reply' | 'note'>('reply')
  const [escalateTo, setEscalateTo] = useState('')
  const [linkId, setLinkId] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!ticketId) return
    setLoading(true)
    try {
      const r = await fetch(`/api/tickets/${ticketId}`)
      const j = await r.json()
      if (j.success) setTicket(j.data)
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    if (open && ticketId) load()
    else setTicket(null)
  }, [open, ticketId, load])

  const act = async (fn: () => Promise<Response>): Promise<boolean> => {
    setBusy(true)
    try {
      const r = await fn()
      const j = await r.json().catch(() => null)
      if (r.ok) { await load(); onChanged(); return true }
      toast.error(j?.error ?? 'Ação falhou')
      return false
    } finally {
      setBusy(false)
    }
  }

  const sendMessage = () => {
    if (!msg.trim()) return
    act(() =>
      fetch(`/api/tickets/${ticketId}/messages`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: msg, kind: msgKind }),
      })
    ).then((ok) => { if (ok) setMsg('') })
  }

  const changeStatus = (status: string) =>
    act(() =>
      fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    )

  const escalate = () => {
    if (!escalateTo.trim()) return
    act(() =>
      fetch(`/api/tickets/${ticketId}/escalate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalatedTo: escalateTo }),
      })
    ).then((ok) => { if (ok) setEscalateTo('') })
  }

  const linkDemanda = () => {
    if (!linkId.trim()) return
    act(() =>
      fetch(`/api/tickets/${ticketId}/link-demanda`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandaId: linkId }),
      })
    ).then((ok) => { if (ok) setLinkId('') })
  }

  const sm = ticket ? TICKET_STATUS_META[ticket.status] : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 pr-6">
            {ticket?.subject ?? (loading ? 'Carregando…' : 'Ticket')}
            {sm && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${sm.cls}`}>{sm.label}</span>}
          </DialogTitle>
        </DialogHeader>

        {ticket && (
          <div className="space-y-4">
            {/* meta */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Meta label="Solicitante" value={ticket.requester ?? '—'} />
              <Meta label="Canal" value={ticket.channel ? TICKET_CHANNEL_LABELS[ticket.channel] ?? ticket.channel : '—'} />
              <Meta label="Prioridade" value={TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority} />
              <Meta label="Responsável" value={ticket.assignedTo?.name ?? ticket.assignedTo?.email ?? '—'} />
              <Meta label="Aberto em" value={fmtDate(ticket.createdAt)} />
              <Meta label="Resolvido em" value={fmtDate(ticket.resolvedAt)} />
            </div>

            {ticket.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap border rounded-md p-3 bg-muted/30">
                {ticket.description}
              </p>
            )}

            {ticket.escalatedAt && (
              <div className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <ArrowUpRight className="h-4 w-4" />
                Encaminhado ao N2 (<strong>{ticket.escalatedTo}</strong>) em {fmtDate(ticket.escalatedAt)}
              </div>
            )}
            {ticket.demanda && (
              <a
                href={`/dashboard/demandas?demandaId=${ticket.demanda.id}`}
                className="text-sm flex items-center gap-2 text-blue-600 hover:underline"
              >
                <Link2 className="h-4 w-4" /> Demanda vinculada: {ticket.demanda.title}
              </a>
            )}

            <Separator />

            {/* thread */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Interações ({ticket.messages.filter((m) => m.kind === 'reply').length})</h4>
              {ticket.messages.length === 0 && <p className="text-sm text-muted-foreground">Sem mensagens ainda.</p>}
              {ticket.messages.map((m) => (
                <div key={m.id} className={`text-sm rounded-md p-2.5 ${m.kind === 'note' ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20' : 'bg-muted/40'}`}>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    {m.kind === 'note' ? <StickyNote className="h-3 w-3" /> : <MessageSquare className="h-3 w-3" />}
                    {m.kind === 'note' ? 'Nota interna' : 'Resposta'} · {fmtDate(m.createdAt)}
                  </div>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
              ))}
            </div>

            {/* add message */}
            <div className="space-y-2">
              <Textarea placeholder="Escreva uma resposta ou nota interna…" value={msg} onChange={(e) => setMsg(e.target.value)} rows={2} />
              <div className="flex items-center gap-2">
                <Select value={msgKind} onValueChange={(v) => setMsgKind(v as 'reply' | 'note')}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reply">Resposta</SelectItem>
                    <SelectItem value="note">Nota interna</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={sendMessage} disabled={busy || !msg.trim()}>
                  <Send className="h-4 w-4 mr-1" /> Enviar
                </Button>
              </div>
            </div>

            <Separator />

            {/* actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-24">Status</span>
                <Select value={ticket.status} onValueChange={changeStatus}>
                  <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Aberto</SelectItem>
                    <SelectItem value="paused">Pausado</SelectItem>
                    <SelectItem value="resolved">Resolvido</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-24">Encaminhar N2</span>
                <Input className="w-44" placeholder="Parceiro (ex.: SecuriSoft)" value={escalateTo} onChange={(e) => setEscalateTo(e.target.value)} />
                <Button size="sm" variant="outline" onClick={escalate} disabled={busy || !escalateTo.trim()}>
                  <ArrowUpRight className="h-4 w-4 mr-1" /> Encaminhar
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-24">Vincular Demanda</span>
                <Input className="w-44" placeholder="ID da demanda" value={linkId} onChange={(e) => setLinkId(e.target.value)} />
                <Button size="sm" variant="outline" onClick={linkDemanda} disabled={busy || !linkId.trim()}>
                  <Link2 className="h-4 w-4 mr-1" /> Vincular
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium truncate">{value}</p>
    </div>
  )
}
