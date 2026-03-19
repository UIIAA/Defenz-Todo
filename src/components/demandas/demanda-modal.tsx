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
import { Trash2, Plus, Check } from 'lucide-react'
import { toast } from 'sonner'
import {
  ORIGINS,
  STATUSES,
  PRIORITIES,
  toDateStr,
  todayStr,
  emptyForm,
  type Demanda,
  type DemandaForm,
  type Subtask,
} from '@/app/dashboard/demandas/helpers'

export function DemandaModal({
  demanda,
  open,
  onOpenChange,
  onSave,
  onDelete,
  onSubtaskChange,
}: {
  demanda: Demanda | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (d: DemandaForm) => void
  onDelete: (id: string) => void
  onSubtaskChange?: () => void
}) {
  const [form, setForm] = useState<DemandaForm>(emptyForm())
  const [modalUsers, setModalUsers] = useState<{ id: string; name: string | null; email: string }[]>([])
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('')
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
        assignee: demanda.assignee || '',
        dateIn: toDateStr(demanda.dateIn),
        deadline: toDateStr(demanda.deadline),
        dateDone: demanda.dateDone ? toDateStr(demanda.dateDone) : null,
      })
      setSubtasks(demanda.subtasks || [])
    } else {
      setForm(emptyForm())
      setSubtasks([])
    }
    setNewSubtaskTitle('')
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border-white/50 dark:border-slate-700/30 text-slate-800 dark:text-slate-100">
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

          <div className="grid grid-cols-2 gap-3">
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
              Responsavel
            </label>
            <Select value={form.assignee || '__none__'} onValueChange={(v) => upd('assignee', v === '__none__' ? null : v)}>
              <SelectTrigger className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100">
                <SelectValue placeholder="Sem responsavel" />
              </SelectTrigger>
              <SelectContent className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border-white/50 dark:border-slate-700/30">
                <SelectItem value="__none__" className="text-slate-500 dark:text-slate-400">
                  Sem responsavel
                </SelectItem>
                {modalUsers.map((u) => (
                  <SelectItem key={u.id} value={u.name || u.email} className="text-slate-800 dark:text-slate-200">
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
            <div className="flex gap-1 mt-1.5">
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

          <div className="grid grid-cols-2 gap-3">
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
                    <button
                      onClick={() => deleteSubtask(st.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all cursor-pointer"
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
            onClick={() => form.title.trim() && onSave(form)}
            disabled={!form.title.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isNew ? 'Criar' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
