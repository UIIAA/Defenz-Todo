'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowUpRight,
  Link2,
  MessageSquare,
  StickyNote,
  Send,
  ExternalLink,
  FolderOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { TICKET_CHANNEL_LABELS, TICKET_PRIORITY_LABELS } from './ticket-helpers'
import { STATUS_ORDER, STATUS_LABELS } from '@/lib/service-desk-config'

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
  client: string | null
  requester: string | null
  escalatedAt: string | null
  escalatedTo: string | null
  resolvedAt: string | null
  createdAt: string
  demandaId: string | null
  assignedTo: { name: string | null; email: string | null } | null
  demanda: { id: string; title: string; status: string } | null
  messages: TicketMessage[]
}

const fmtDate = (s: string | null) =>
  s
    ? new Date(s).toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

export function TicketDrawer({
  ticketId,
  open,
  onOpenChange,
  onChanged,
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
  const [openingDemanda, setOpeningDemanda] = useState(false)

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
      if (r.ok) {
        await load()
        onChanged()
        return true
      }
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: msg, kind: msgKind }),
      })
    ).then((ok) => { if (ok) setMsg('') })
  }

  const changeStatus = (status: string) =>
    act(() =>
      fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
    )

  const escalate = () => {
    if (!escalateTo.trim()) return
    act(() =>
      fetch(`/api/tickets/${ticketId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ escalatedTo: escalateTo }),
      })
    ).then((ok) => { if (ok) setEscalateTo('') })
  }

  const linkDemanda = () => {
    if (!linkId.trim()) return
    act(() =>
      fetch(`/api/tickets/${ticketId}/link-demanda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ demandaId: linkId }),
      })
    ).then((ok) => { if (ok) setLinkId('') })
  }

  const openDemanda = async () => {
    if (!ticketId) return
    setOpeningDemanda(true)
    try {
      const r = await fetch(`/api/tickets/${ticketId}/open-demanda`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const j = await r.json().catch(() => null)
      if (r.ok) {
        await load()
        onChanged()
        toast.success('Demanda criada e vinculada ao ticket')
      } else if (r.status === 409) {
        toast.error(j?.error ?? 'Ticket já possui uma demanda vinculada')
      } else {
        toast.error(j?.error ?? 'Erro ao abrir demanda')
      }
    } finally {
      setOpeningDemanda(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-start gap-2 pr-4 text-left">
            <span className="flex-1">{ticket?.subject ?? (loading ? 'Carregando…' : 'Ticket')}</span>
          </SheetTitle>
        </SheetHeader>

        {loading && (
          <p className="text-sm text-muted-foreground px-1">Carregando…</p>
        )}

        {ticket && (
          <div className="space-y-4 px-1 pb-6">
            {/* Meta */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              <MetaField label="Cliente" value={ticket.client ?? '—'} />
              <MetaField label="Solicitante" value={ticket.requester ?? '—'} />
              <MetaField
                label="Canal"
                value={ticket.channel ? (TICKET_CHANNEL_LABELS[ticket.channel] ?? ticket.channel) : '—'}
              />
              <MetaField
                label="Prioridade"
                value={TICKET_PRIORITY_LABELS[ticket.priority] ?? ticket.priority}
              />
              <MetaField
                label="Responsável"
                value={ticket.assignedTo?.name ?? ticket.assignedTo?.email ?? '—'}
              />
              <MetaField label="Aberto em" value={fmtDate(ticket.createdAt)} />
              <MetaField label="Concluído em" value={fmtDate(ticket.resolvedAt)} />
            </div>

            {ticket.description && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap border rounded-md p-3 bg-muted/30">
                {ticket.description}
              </p>
            )}

            {/* Escalado */}
            {ticket.escalatedAt && (
              <div className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-300">
                <ArrowUpRight className="h-4 w-4 shrink-0" />
                Encaminhado ao N2 (<strong>{ticket.escalatedTo}</strong>) em{' '}
                {fmtDate(ticket.escalatedAt)}
              </div>
            )}

            {/* Demanda vinculada */}
            {ticket.demanda && (
              <a
                href={`/dashboard/demandas?demandaId=${ticket.demanda.id}`}
                className="text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
              >
                <Link2 className="h-4 w-4" /> Demanda vinculada: {ticket.demanda.title}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}

            <Separator />

            {/* Thread de mensagens */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Interações ({ticket.messages.filter((m) => m.kind === 'reply').length})
              </h4>
              {ticket.messages.length === 0 && (
                <p className="text-sm text-muted-foreground">Sem mensagens ainda.</p>
              )}
              {ticket.messages.map((m) => (
                <div
                  key={m.id}
                  className={`text-sm rounded-md p-2.5 ${
                    m.kind === 'note'
                      ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20'
                      : 'bg-muted/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    {m.kind === 'note' ? (
                      <StickyNote className="h-3 w-3" />
                    ) : (
                      <MessageSquare className="h-3 w-3" />
                    )}
                    {m.kind === 'note' ? 'Nota interna' : 'Resposta'} · {fmtDate(m.createdAt)}
                  </div>
                  <p className="whitespace-pre-wrap">{m.body}</p>
                </div>
              ))}
            </div>

            {/* Adicionar mensagem */}
            <div className="space-y-2">
              <Textarea
                placeholder="Escreva uma resposta ou nota interna…"
                value={msg}
                onChange={(e) => setMsg(e.target.value)}
                rows={2}
              />
              <div className="flex items-center gap-2">
                <Select
                  value={msgKind}
                  onValueChange={(v) => setMsgKind(v as 'reply' | 'note')}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
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

            {/* Ações */}
            <div className="space-y-3">
              {/* Status */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-28 shrink-0">Status</span>
                <Select value={ticket.status} onValueChange={changeStatus} disabled={busy}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_ORDER.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Encaminhar N2 */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-28 shrink-0">Encaminhar N2</span>
                <Input
                  className="flex-1"
                  placeholder="Parceiro (ex.: SecuriSoft)"
                  value={escalateTo}
                  onChange={(e) => setEscalateTo(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={escalate}
                  disabled={busy || !escalateTo.trim()}
                >
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  Encaminhar
                </Button>
              </div>

              {/* Abrir Demanda */}
              {!ticket.demandaId ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-28 shrink-0">Abrir Demanda</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={openDemanda}
                    disabled={openingDemanda || busy}
                    className="text-blue-600 border-blue-300 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-700 dark:hover:bg-blue-900/20"
                  >
                    <FolderOpen className="h-4 w-4 mr-1" />
                    {openingDemanda ? 'Criando…' : 'Abrir Demanda'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-28 shrink-0">Demanda</span>
                  <a
                    href={`/dashboard/demandas?demandaId=${ticket.demandaId}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver demanda vinculada
                  </a>
                </div>
              )}

              {/* Vincular demanda existente */}
              {!ticket.demandaId && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-28 shrink-0">Vincular existente</span>
                  <Input
                    className="flex-1"
                    placeholder="ID da demanda"
                    value={linkId}
                    onChange={(e) => setLinkId(e.target.value)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={linkDemanda}
                    disabled={busy || !linkId.trim()}
                  >
                    <Link2 className="h-4 w-4 mr-1" />
                    Vincular
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

function MetaField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="font-medium text-sm truncate">{value}</p>
    </div>
  )
}
