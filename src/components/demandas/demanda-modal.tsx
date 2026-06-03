'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Trash2, Plus, Check, ExternalLink, Pencil, Link as LinkIcon, Bell, Clock } from 'lucide-react'
import { toast } from 'sonner'
import {
  ORIGINS,
  STATUSES,
  PRIORITIES,
  CLASSIFICATIONS,
  toDateStr,
  todayStr,
  emptyForm,
  totalSpentMinutes,
  type Demanda,
  type DemandaForm,
  type Subtask,
  type DemandaLink,
} from '@/app/dashboard/demandas/helpers'
import { formatDate } from '@/lib/date'
import { parseHoursToMinutes, minutesToHoursInput, minutesToHoursLabel } from '@/lib/duration'
import { DemandaDependsOnCombobox } from './demanda-depends-on-combobox'

export function DemandaModal({
  demanda,
  open,
  onOpenChange,
  onSave,
  onDelete,
  onSubtaskChange,
  onNavigate,
}: {
  demanda: Demanda | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (d: DemandaForm) => void
  onDelete: (id: string) => void
  onSubtaskChange?: () => void
  onNavigate?: (id: string) => void
}) {
  const [form, setForm] = useState<DemandaForm>(emptyForm())
  const [modalUsers, setModalUsers] = useState<{ id: string; name: string | null; email: string }[]>([])
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
  const [links, setLinks] = useState<DemandaLink[]>([])
  const [newLinkLabel, setNewLinkLabel] = useState('')
  const [newLinkUrl, setNewLinkUrl] = useState('')
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null)
  const [editLinkLabel, setEditLinkLabel] = useState('')
  const [editLinkUrl, setEditLinkUrl] = useState('')
  const [spentHoursStr, setSpentHoursStr] = useState('')
  const [estHoursStr, setEstHoursStr] = useState('')
  const [subtaskHours, setSubtaskHours] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const isNew = !demanda

  useEffect(() => {
    if (open) {
      fetch('/api/users')
        .then((r) => r.json())
        .then((d) => { if (d.success) setModalUsers(d.data) })
        .catch(() => {})
    }
  }, [open])

  useEffect(() => {
    if (demanda) {
      setForm({
        id: demanda.id,
        title: demanda.title,
        description: demanda.description || '',
        origin: demanda.origin,
        status: demanda.status,
        priority: demanda.priority,
        classification: demanda.classification || null,
        assignee: demanda.assignee || '',
        assignedToId: demanda.assignedToId || null,
        dateIn: toDateStr(demanda.dateIn),
        dateStarted: demanda.dateStarted || null,
        deadline: toDateStr(demanda.deadline),
        dateDone: demanda.dateDone ? toDateStr(demanda.dateDone) : null,
        reminderDate: demanda.reminderDate ? toDateStr(demanda.reminderDate) : null,
        reminderSent: demanda.reminderSent ?? false,
        estimatedMinutes: demanda.estimatedMinutes ?? null,
        spentMinutes: demanda.spentMinutes ?? 0,
        dependsOn: demanda.dependsOn ?? [],
      })
      const sub = demanda.subtasks || []
      setSubtasks(sub)
      setLinks(demanda.links || [])
      setSpentHoursStr(minutesToHoursInput(demanda.spentMinutes))
      setEstHoursStr(minutesToHoursInput(demanda.estimatedMinutes))
      setSubtaskHours(Object.fromEntries(sub.map((s) => [s.id, minutesToHoursInput(s.spentMinutes)])))
    } else {
      setForm(emptyForm())
      setSubtasks([])
      setLinks([])
      setSpentHoursStr('')
      setEstHoursStr('')
      setSubtaskHours({})
    }
    setNewSubtaskTitle('')
    setNewLinkLabel('')
    setNewLinkUrl('')
    setEditingLinkId(null)
  }, [demanda])

  const upd = (k: keyof DemandaForm, v: string | null) =>
    setForm((p) => ({ ...p, [k]: v }))

  const addSubtask = async () => {
    if (!newSubtaskTitle.trim() || !demanda?.id) return
    try {
      const res = await fetch(`/api/demandas/${demanda.id}/subtasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newSubtaskTitle.trim() }),
      })
      const json = await res.json()
      if (json.success) {
        setSubtasks((prev) => [...prev, json.data])
        setSubtaskHours((prev) => ({ ...prev, [json.data.id]: '' }))
        setNewSubtaskTitle('')
        onSubtaskChange?.()
      } else {
        toast.error(json.error || 'Erro ao criar subtask')
      }
    } catch {
      toast.error('Erro ao criar subtask')
    }
  }

  const toggleSubtask = async (subtask: Subtask) => {
    if (!demanda?.id) return
    // Optimistic update
    setSubtasks((prev) => prev.map((s) => s.id === subtask.id ? { ...s, completed: !s.completed } : s))
    try {
      const res = await fetch(`/api/demandas/${demanda.id}/subtasks/${subtask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !subtask.completed }),
      })
      const json = await res.json()
      if (!json.success) {
        // Revert
        setSubtasks((prev) => prev.map((s) => s.id === subtask.id ? subtask : s))
        toast.error('Erro ao atualizar subtask')
      } else {
        onSubtaskChange?.()
      }
    } catch {
      setSubtasks((prev) => prev.map((s) => s.id === subtask.id ? subtask : s))
      toast.error('Erro ao atualizar subtask')
    }
  }

  const deleteSubtask = async (subtaskId: string) => {
    if (!demanda?.id) return
    const prev = subtasks
    setSubtasks((s) => s.filter((st) => st.id !== subtaskId))
    try {
      const res = await fetch(`/api/demandas/${demanda.id}/subtasks/${subtaskId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!json.success) {
        setSubtasks(prev)
        toast.error('Erro ao excluir subtask')
      } else {
        onSubtaskChange?.()
      }
    } catch {
      setSubtasks(prev)
      toast.error('Erro ao excluir subtask')
    }
  }

  const commitSubtaskHours = async (st: Subtask) => {
    if (!demanda?.id) return
    const raw = subtaskHours[st.id] ?? ''
    const minutes = parseHoursToMinutes(raw)
    if (minutes === (st.spentMinutes ?? 0)) return // sem mudanca
    setSubtasks((prev) => prev.map((s) => s.id === st.id ? { ...s, spentMinutes: minutes } : s))
    try {
      const res = await fetch(`/api/demandas/${demanda.id}/subtasks/${st.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spentMinutes: minutes }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error('Erro ao salvar horas')
      } else {
        onSubtaskChange?.()
      }
    } catch {
      toast.error('Erro ao salvar horas')
    }
  }

  const normalizeUrl = (url: string) => {
    const trimmed = url.trim()
    if (!trimmed) return trimmed
    if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`
    return trimmed
  }

  const addLink = async () => {
    if (!newLinkLabel.trim() || !newLinkUrl.trim() || !demanda?.id) return
    const url = normalizeUrl(newLinkUrl)
    try {
      const res = await fetch(`/api/demandas/${demanda.id}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: newLinkLabel.trim(), url }),
      })
      const json = await res.json()
      if (json.success) {
        setLinks((prev) => [...prev, json.data])
        setNewLinkLabel('')
        setNewLinkUrl('')
      } else {
        toast.error(json.error || 'Erro ao criar link')
      }
    } catch {
      toast.error('Erro ao criar link')
    }
  }

  const updateLink = async (linkId: string) => {
    if (!demanda?.id || !editLinkLabel.trim() || !editLinkUrl.trim()) return
    const url = normalizeUrl(editLinkUrl)
    try {
      const res = await fetch(`/api/demandas/${demanda.id}/links/${linkId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: editLinkLabel.trim(), url }),
      })
      const json = await res.json()
      if (json.success) {
        setLinks((prev) => prev.map((l) => l.id === linkId ? json.data : l))
        setEditingLinkId(null)
      } else {
        toast.error(json.error || 'Erro ao atualizar link')
      }
    } catch {
      toast.error('Erro ao atualizar link')
    }
  }

  const deleteLink = async (linkId: string) => {
    if (!demanda?.id) return
    const prev = links
    setLinks((l) => l.filter((lk) => lk.id !== linkId))
    try {
      const res = await fetch(`/api/demandas/${demanda.id}/links/${linkId}`, {
        method: 'DELETE',
      })
      const json = await res.json()
      if (!json.success) {
        setLinks(prev)
        toast.error('Erro ao excluir link')
      }
    } catch {
      setLinks(prev)
      toast.error('Erro ao excluir link')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border-white/50 dark:border-slate-700/30 text-slate-800 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-blue-600 dark:text-blue-400 text-lg font-bold">
            {isNew ? 'Nova Demanda' : 'Editar Demanda'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Titulo
            </label>
            <Input
              value={form.title}
              onChange={(e) => upd('title', e.target.value)}
              placeholder="Ex: Proposta cliente X"
              className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Origem
              </label>
              <Select value={form.origin} onValueChange={(v) => upd('origin', v)}>
                <SelectTrigger className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border-white/50 dark:border-slate-700/30">
                  {ORIGINS.map((o) => (
                    <SelectItem key={o.id} value={o.id} className="text-slate-800 dark:text-slate-200">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Prioridade
              </label>
              <Select value={form.priority} onValueChange={(v) => upd('priority', v)}>
                <SelectTrigger className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border-white/50 dark:border-slate-700/30">
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.id} value={p.id} className="text-slate-800 dark:text-slate-200">
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Classificacao
            </label>
            <Select value={form.classification || '__none__'} onValueChange={(v) => upd('classification', v === '__none__' ? null : v)}>
              <SelectTrigger className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100">
                <SelectValue placeholder="Sem classificacao" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border-white/50 dark:border-slate-700/30">
                <SelectItem value="__none__" className="text-slate-500 dark:text-slate-400">
                  Sem classificacao
                </SelectItem>
                {CLASSIFICATIONS.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-slate-800 dark:text-slate-200">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                      {c.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Responsavel
            </label>
            <Select value={form.assignedToId || '__none__'} onValueChange={(v) => upd('assignedToId', v === '__none__' ? null : v)}>
              <SelectTrigger className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100">
                <SelectValue placeholder="Sem responsavel" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border-white/50 dark:border-slate-700/30">
                <SelectItem value="__none__" className="text-slate-500 dark:text-slate-400">
                  Sem responsavel
                </SelectItem>
                {modalUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-slate-800 dark:text-slate-200">
                    {u.name || u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Status
            </label>
            <div className="grid grid-cols-3 sm:flex gap-1.5 mt-1.5">
              {STATUSES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    upd('status', s.id)
                    if (s.id === 'concluida') upd('dateDone', todayStr())
                    else upd('dateDone', null)
                  }}
                  className={`flex-1 py-2 px-0.5 rounded-md border text-[10px] font-medium transition-colors ${
                    form.status === s.id
                      ? 'border-blue-500 bg-blue-500/10 text-blue-500 dark:text-blue-400'
                      : 'border-slate-200/60 dark:border-slate-700/30 bg-white/60 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-600/40'
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Data Entrada
              </label>
              <Input
                type="date"
                value={form.dateIn}
                onChange={(e) => upd('dateIn', e.target.value)}
                className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Prazo
              </label>
              <Input
                type="date"
                value={form.deadline || ''}
                onChange={(e) => upd('deadline', e.target.value || null)}
                className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Horas (controle de tempo) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Horas gastas
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={spentHoursStr}
                onChange={(e) => {
                  const v = e.target.value
                  setSpentHoursStr(v)
                  setForm((p) => ({ ...p, spentMinutes: parseHoursToMinutes(v) }))
                }}
                placeholder="Ex: 1,5"
                className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Horas estimadas <span className="normal-case text-slate-300 dark:text-slate-500">(opcional)</span>
              </label>
              <Input
                type="text"
                inputMode="decimal"
                value={estHoursStr}
                onChange={(e) => {
                  const v = e.target.value
                  setEstHoursStr(v)
                  setForm((p) => ({ ...p, estimatedMinutes: v.trim() === '' ? null : parseHoursToMinutes(v) }))
                }}
                placeholder="Ex: 8"
                className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-500"
              />
            </div>
            {!isNew && subtasks.some((s) => (s.spentMinutes ?? 0) > 0) && (
              <p className="sm:col-span-2 text-[10px] text-slate-400 -mt-1">
                Total gasto (card + subtarefas): {minutesToHoursLabel(totalSpentMinutes({ spentMinutes: form.spentMinutes, subtasks }))}
              </p>
            )}
          </div>

          {/* Lembrete */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Bell className="h-3 w-3" />
              Lembrete
              {form.reminderDate && form.reminderSent && (
                <span className="text-emerald-500 font-normal normal-case ml-1">(enviado)</span>
              )}
            </label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                type="date"
                value={form.reminderDate || ''}
                onChange={(e) => upd('reminderDate', e.target.value || null)}
                className="bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100 flex-1"
              />
              {form.reminderDate && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => upd('reminderDate', null)}
                  className="text-slate-400 hover:text-red-500 h-8 px-2"
                  title="Remover lembrete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>

          {/* Lifecycle dates */}
          {!isNew && (demanda?.dateIn || demanda?.dateStarted || demanda?.dateDone) && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mt-1">
              {demanda?.dateIn && (
                <span>📥 Criada: {formatDate(demanda.dateIn)}</span>
              )}
              {demanda?.dateStarted && (
                <span>⚡ Iniciada: {formatDate(demanda.dateStarted)}</span>
              )}
              {demanda?.dateDone && (
                <span>✅ Concluida: {formatDate(demanda.dateDone)}</span>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Descricao
            </label>
            <Textarea
              value={form.description || ''}
              onChange={(e) => upd('description', e.target.value)}
              placeholder="Detalhes, contexto, proximo passo..."
              rows={3}
              className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-500 resize-y"
            />
          </div>

          {/* Dependências */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Depende de
            </label>
            <div className="mt-1.5">
              <DemandaDependsOnCombobox
                demandaId={form.id}
                value={form.dependsOn ?? []}
                onChange={(ids) => setForm((p) => ({ ...p, dependsOn: ids }))}
                onOpen={onNavigate}
              />
            </div>
          </div>

          {/* Subtasks section - only for existing demandas */}
          {!isNew && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Subtarefas
                {subtasks.length > 0 && (
                  <span className="ml-1 text-slate-300 dark:text-slate-500">
                    ({subtasks.filter((s) => s.completed).length}/{subtasks.length})
                  </span>
                )}
              </label>
              <div className="mt-1.5 space-y-1">
                {subtasks.map((st) => (
                  <div key={st.id} className="flex items-center gap-2 group">
                    <button
                      onClick={() => toggleSubtask(st)}
                      className={`shrink-0 h-4 w-4 rounded border transition-colors flex items-center justify-center cursor-pointer ${
                        st.completed
                          ? 'bg-blue-500 border-blue-500 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
                      }`}
                    >
                      {st.completed && <Check className="h-3 w-3" />}
                    </button>
                    <span className={`flex-1 text-sm ${st.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {st.title}
                    </span>
                    <div className="flex items-center gap-0.5 shrink-0" title="Horas gastas na subtarefa">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={subtaskHours[st.id] ?? ''}
                        onChange={(e) => setSubtaskHours((prev) => ({ ...prev, [st.id]: e.target.value }))}
                        onBlur={() => commitSubtaskHours(st)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitSubtaskHours(st) } }}
                        placeholder="0"
                        className="h-6 w-12 px-1 text-[11px] text-center bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-700 dark:text-slate-200"
                      />
                    </div>
                    <button
                      onClick={() => deleteSubtask(st.id)}
                      className="sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  placeholder="Nova subtarefa..."
                  className="text-sm bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask() } }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="shrink-0 border-slate-200 dark:border-slate-700"
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Links section - only for existing demandas */}
          {!isNew && (
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                <LinkIcon className="inline h-3 w-3 mr-1" />
                Links Uteis
                {links.length > 0 && (
                  <span className="ml-1 text-slate-300 dark:text-slate-500">
                    ({links.length}/10)
                  </span>
                )}
              </label>
              <div className="mt-1.5 space-y-1.5">
                {links.map((lk) => (
                  <div key={lk.id} className="group">
                    {editingLinkId === lk.id ? (
                      <div className="flex flex-col gap-1.5">
                        <Input
                          value={editLinkLabel}
                          onChange={(e) => setEditLinkLabel(e.target.value)}
                          placeholder="Rotulo"
                          className="text-sm bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100"
                        />
                        <div className="flex gap-2">
                          <Input
                            value={editLinkUrl}
                            onChange={(e) => setEditLinkUrl(e.target.value)}
                            placeholder="https://..."
                            className="text-sm bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100"
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); updateLink(lk.id) } }}
                          />
                          <Button variant="outline" size="sm" onClick={() => updateLink(lk.id)} disabled={!editLinkLabel.trim() || !editLinkUrl.trim()} className="shrink-0 border-slate-200 dark:border-slate-700">
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setEditingLinkId(null)} className="shrink-0 border-slate-200 dark:border-slate-700 text-slate-400">
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                        <a
                          href={lk.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 text-sm text-blue-500 dark:text-blue-400 hover:underline truncate"
                          title={lk.url}
                        >
                          {lk.label}
                        </a>
                        <button
                          onClick={() => { setEditingLinkId(lk.id); setEditLinkLabel(lk.label); setEditLinkUrl(lk.url) }}
                          className="sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:text-blue-500 transition-all cursor-pointer"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => deleteLink(lk.id)}
                          className="sm:opacity-0 sm:group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {links.length < 10 && (
                <div className="flex flex-col gap-1.5 mt-2">
                  <Input
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                    placeholder="Rotulo do link (ex: Documento, Referencia...)"
                    className="text-sm bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                  />
                  <div className="flex gap-2">
                    <Input
                      value={newLinkUrl}
                      onChange={(e) => setNewLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="text-sm bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink() } }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addLink}
                      disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
                      className="shrink-0 border-slate-200 dark:border-slate-700"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4 justify-end">
          {!isNew && (
            <Button
              variant="outline"
              onClick={() => {
                if (form.id) onDelete(form.id)
              }}
              className="mr-auto border-red-300 dark:border-red-800 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-300"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-slate-700 text-slate-400 hover:bg-slate-800"
          >
            Cancelar
          </Button>
          <Button
            onClick={async () => {
              if (!form.title.trim() || saving) return
              setSaving(true)
              try {
                await onSave(form)
              } finally {
                setSaving(false)
              }
            }}
            disabled={!form.title.trim() || saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? 'Salvando...' : isNew ? 'Criar' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
