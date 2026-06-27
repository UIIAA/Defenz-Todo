'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { TICKET_CHANNEL_LABELS } from './ticket-helpers'

interface NewTicketDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  onCreated: () => void
}

const emptyForm = {
  subject: '',
  description: '',
  client: '',
  requester: '',
  channel: 'email',
  priority: 'media',
}

export function NewTicketDialog({ open, onOpenChange, onCreated }: NewTicketDialogProps) {
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [clientSuggestions, setClientSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const clientRef = useRef<HTMLDivElement>(null)

  // Busca autocomplete de clientes
  useEffect(() => {
    if (!open) return
    fetch('/api/tickets/clients')
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data?.clients && Array.isArray(j.data.clients)) {
          setClientSuggestions(j.data.clients)
        }
      })
      .catch(() => {})
  }, [open])

  // Fecha dropdown ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filteredClients =
    form.client.trim().length > 0
      ? clientSuggestions.filter((c) =>
          c.toLowerCase().includes(form.client.toLowerCase())
        )
      : clientSuggestions

  const handleCreate = async () => {
    if (!form.subject.trim()) {
      toast.error('Assunto é obrigatório')
      return
    }
    setSaving(true)
    try {
      const r = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject.trim(),
          description: form.description.trim() || undefined,
          client: form.client.trim() || undefined,
          requester: form.requester.trim() || undefined,
          channel: form.channel,
          priority: form.priority,
          // companyId NÃO é enviado — Defenz-only, resolvido server-side
        }),
      })
      const j = await r.json().catch(() => null)
      if (r.ok) {
        setForm(emptyForm)
        onOpenChange(false)
        onCreated()
        toast.success('Ticket criado')
      } else {
        toast.error(j?.error ?? 'Falha ao criar ticket')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo ticket</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Assunto */}
          <Input
            placeholder="Assunto *"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            autoFocus
          />

          {/* Descrição */}
          <Textarea
            placeholder="Descrição (opcional)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />

          {/* Cliente — autocomplete */}
          <div ref={clientRef} className="relative">
            <Input
              placeholder="Cliente (empresa atendida)"
              value={form.client}
              onChange={(e) => {
                setForm({ ...form, client: e.target.value })
                setShowSuggestions(true)
              }}
              onFocus={() => setShowSuggestions(true)}
              autoComplete="off"
            />
            {showSuggestions && filteredClients.length > 0 && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-48 overflow-y-auto">
                {filteredClients.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      setForm({ ...form, client: c })
                      setShowSuggestions(false)
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Solicitante */}
          <Input
            placeholder="Solicitante (nome de quem pediu)"
            value={form.requester}
            onChange={(e) => setForm({ ...form, requester: e.target.value })}
          />

          {/* Canal + Prioridade */}
          <div className="grid grid-cols-2 gap-3">
            <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TICKET_CHANNEL_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={saving || !form.subject.trim()}>
            {saving ? 'Criando…' : 'Criar ticket'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
