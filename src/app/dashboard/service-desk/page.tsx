'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { LifeBuoy, Plus, ArrowUpRight, MessageSquare, Link2 } from 'lucide-react'
import { TICKET_STATUS_META, TICKET_CHANNEL_LABELS } from '@/components/service-desk/ticket-helpers'
import { TicketModal } from '@/components/service-desk/ticket-modal'

interface TicketRow {
  id: string
  subject: string
  status: string
  priority: string
  channel: string | null
  requester: string | null
  escalatedAt: string | null
  escalatedTo: string | null
  createdAt: string
  assignedTo: { name: string | null; email: string | null } | null
  demanda: { id: string } | null
  _count: { messages: number }
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })

const emptyForm = { subject: '', description: '', requester: '', channel: 'email', priority: 'media' }

export default function ServiceDeskPage() {
  const [tickets, setTickets] = useState<TicketRow[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [escalatedOnly, setEscalatedOnly] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (statusFilter !== 'all') qs.set('status', statusFilter)
      if (escalatedOnly) qs.set('escalated', 'true')
      const r = await fetch(`/api/tickets${qs.toString() ? `?${qs}` : ''}`)
      const j = await r.json()
      if (j.success) setTickets(j.data)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, escalatedOnly])

  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!form.subject.trim()) return
    setSaving(true)
    try {
      const r = await fetch('/api/tickets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject,
          description: form.description || undefined,
          requester: form.requester || undefined,
          channel: form.channel,
          priority: form.priority,
        }),
      })
      if (r.ok) { setCreateOpen(false); setForm(emptyForm); load() }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <LifeBuoy className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Service Desk</h1>
            <p className="text-sm text-muted-foreground">Tickets de atendimento</p>
          </div>
        </div>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Novo ticket</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo ticket</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Assunto *" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              <Textarea placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
              <Input placeholder="Solicitante" value={form.requester} onChange={(e) => setForm({ ...form, requester: e.target.value })} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
                  <SelectTrigger><SelectValue placeholder="Canal" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TICKET_CHANNEL_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue placeholder="Prioridade" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={saving || !form.subject.trim()}>Criar ticket</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="open">Aberto</SelectItem>
            <SelectItem value="paused">Pausado</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={escalatedOnly ? 'default' : 'outline'} size="sm" onClick={() => setEscalatedOnly((v) => !v)}>
          <ArrowUpRight className="h-4 w-4 mr-1" /> Só escalados ao N2
        </Button>
      </div>

      {/* list */}
      <Card>
        <CardContent className="p-0">
          {loading && <p className="p-6 text-sm text-muted-foreground">Carregando…</p>}
          {!loading && tickets.length === 0 && <p className="p-6 text-sm text-muted-foreground">Nenhum ticket.</p>}
          {!loading && tickets.length > 0 && (
            <div className="divide-y">
              {tickets.map((t) => {
                const sm = TICKET_STATUS_META[t.status]
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className="w-full text-left px-4 py-3 hover:bg-muted/40 transition-colors flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{t.subject}</span>
                        {sm && <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-medium shrink-0 ${sm.cls}`}>{sm.label}</span>}
                        {t.escalatedAt && (
                          <span className="text-[11px] px-1.5 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 shrink-0 flex items-center gap-0.5">
                            <ArrowUpRight className="h-3 w-3" />N2{t.escalatedTo ? `: ${t.escalatedTo}` : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 mt-0.5">
                        {t.requester && <span>{t.requester}</span>}
                        {t.channel && <span>{TICKET_CHANNEL_LABELS[t.channel] ?? t.channel}</span>}
                        <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{t._count.messages}</span>
                        {t.demanda && <span className="flex items-center gap-1"><Link2 className="h-3 w-3" />demanda</span>}
                        <span>{fmtDate(t.createdAt)}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{t.assignedTo?.name ?? ''}</span>
                  </button>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <TicketModal
        ticketId={selectedId}
        open={selectedId !== null}
        onOpenChange={(o) => { if (!o) setSelectedId(null) }}
        onChanged={load}
      />
    </div>
  )
}
