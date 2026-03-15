'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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
import { Plus, Trash2, Loader2, Upload, FileSpreadsheet, ListPlus } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

import {
  ORIGINS,
  STATUSES,
  PRIORITIES,
  toDateStr,
  todayStr,
  emptyForm,
  type Demanda,
  type DemandaForm,
  type Origin,
  type Status,
  type Priority,
} from './helpers'

// ─── Import Modal ────────────────────────────────────────────

function ImportModal({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}) {
  const [mode, setMode] = useState<'text' | 'excel'>('text')
  const [textInput, setTextInput] = useState('')
  const [importing, setImporting] = useState(false)
  const [selectedOrigin, setSelectedOrigin] = useState('outra')
  const [selectedPriority, setSelectedPriority] = useState('media')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleTextImport = async () => {
    const lines = textInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    if (lines.length === 0) {
      toast.error('Nenhum item para importar')
      return
    }

    setImporting(true)
    try {
      const items = lines.map((line) => ({
        title: line,
        origin: selectedOrigin,
        priority: selectedPriority,
      }))

      const res = await fetch('/api/demandas/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`${json.data.count} demandas importadas na coluna Solicitada`)
        setTextInput('')
        onImported()
        onOpenChange(false)
      } else {
        toast.error(json.error || 'Erro na importacao')
      }
    } catch {
      toast.error('Erro ao importar')
    } finally {
      setImporting(false)
    }
  }

  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    try {
      const reader = new FileReader()
      reader.onload = async (evt) => {
        try {
          const bstr = evt.target?.result
          const wb = XLSX.read(bstr, { type: 'binary' })
          const ws = wb.Sheets[wb.SheetNames[0]]
          const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws)

          if (rows.length === 0) {
            toast.error('Planilha vazia')
            setImporting(false)
            return
          }

          // Tenta mapear colunas inteligentemente
          const items = rows.map((row) => {
            const title =
              (row['titulo'] as string) ||
              (row['Titulo'] as string) ||
              (row['title'] as string) ||
              (row['Title'] as string) ||
              (row['demanda'] as string) ||
              (row['Demanda'] as string) ||
              (row['descricao'] as string) ||
              (row['Descricao'] as string) ||
              (row['atividade'] as string) ||
              (row['Atividade'] as string) ||
              (row['tarefa'] as string) ||
              (row['Tarefa'] as string) ||
              // Pega a primeira coluna como fallback
              String(Object.values(row)[0] || '')

            const description =
              (row['descricao'] as string) ||
              (row['Descricao'] as string) ||
              (row['description'] as string) ||
              (row['Description'] as string) ||
              (row['detalhe'] as string) ||
              (row['Detalhe'] as string) ||
              ''

            const rawOrigin = (
              (row['origem'] as string) ||
              (row['Origem'] as string) ||
              (row['origin'] as string) ||
              ''
            ).toLowerCase()
            const origin = ['fernando', 'securisoft', 'autogerada'].includes(rawOrigin)
              ? rawOrigin
              : selectedOrigin

            const rawPriority = (
              (row['prioridade'] as string) ||
              (row['Prioridade'] as string) ||
              (row['priority'] as string) ||
              ''
            ).toLowerCase()
            const priority = ['alta', 'media', 'baixa'].includes(rawPriority)
              ? rawPriority
              : selectedPriority

            const assignee =
              (row['responsavel'] as string) ||
              (row['Responsavel'] as string) ||
              (row['Responsável'] as string) ||
              (row['assignee'] as string) ||
              (row['pessoa'] as string) ||
              (row['Pessoa'] as string) ||
              undefined

            const deadline =
              (row['prazo'] as string) ||
              (row['Prazo'] as string) ||
              (row['deadline'] as string) ||
              (row['Deadline'] as string) ||
              undefined

            return { title, description, origin, priority, assignee, deadline }
          }).filter((item) => item.title.trim().length > 0)

          if (items.length === 0) {
            toast.error('Nenhum item valido encontrado na planilha')
            setImporting(false)
            return
          }

          const res = await fetch('/api/demandas/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items }),
          })
          const json = await res.json()
          if (json.success) {
            toast.success(`${json.data.count} demandas importadas da planilha`)
            onImported()
            onOpenChange(false)
          } else {
            toast.error(json.error || 'Erro na importacao')
          }
        } catch (err) {
          console.error('Erro ao processar planilha:', err)
          toast.error('Erro ao processar a planilha')
        } finally {
          setImporting(false)
        }
      }
      reader.readAsBinaryString(file)
    } catch {
      toast.error('Erro ao ler arquivo')
      setImporting(false)
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border-white/50 dark:border-slate-700/30 text-slate-800 dark:text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-blue-600 dark:text-blue-400 text-lg font-bold">
            Importar Demandas
          </DialogTitle>
        </DialogHeader>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setMode('text')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              mode === 'text'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500'
                : 'bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/30'
            }`}
          >
            <ListPlus className="h-4 w-4" />
            Lista de Texto
          </button>
          <button
            onClick={() => setMode('excel')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              mode === 'excel'
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500'
                : 'bg-slate-100 dark:bg-slate-700/40 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/30'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Planilha Excel
          </button>
        </div>

        {/* Default origin/priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Origem padrao
            </label>
            <Select value={selectedOrigin} onValueChange={setSelectedOrigin}>
              <SelectTrigger className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border-white/50 dark:border-slate-700/30">
                {ORIGINS.map((o) => (
                  <SelectItem key={o.id} value={o.id} className="text-slate-100">
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Prioridade padrao
            </label>
            <Select value={selectedPriority} onValueChange={setSelectedPriority}>
              <SelectTrigger className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border-white/50 dark:border-slate-700/30">
                {PRIORITIES.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-slate-100">
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {mode === 'text' ? (
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cole a lista (uma demanda por linha)
            </label>
            <Textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={`Proposta cliente XPTO\nRevisao contrato ABC\nDashboard metricas\nRelatorio semanal`}
              rows={8}
              className="mt-1.5 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-600 resize-y font-mono text-sm"
            />
            <p className="text-[11px] text-slate-500 mt-1.5">
              {textInput.split('\n').filter((l) => l.trim()).length} itens detectados — serao criados na coluna <strong>Solicitada</strong>
            </p>
            <Button
              onClick={handleTextImport}
              disabled={importing || !textInput.trim()}
              className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {importing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              Importar {textInput.split('\n').filter((l) => l.trim()).length} demandas
            </Button>
          </div>
        ) : (
          <div>
            <div
              className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-blue-500/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 text-slate-500 mx-auto mb-3" />
              <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                Clique ou arraste um arquivo .xlsx / .csv
              </p>
              <p className="text-xs text-slate-500 mt-1.5">
                Colunas reconhecidas: titulo, descricao, origem, prioridade, prazo
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelUpload}
                className="hidden"
              />
            </div>
            {importing && (
              <div className="flex items-center justify-center gap-2 mt-3 text-blue-500 dark:text-blue-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Processando planilha...</span>
              </div>
            )}
            <p className="text-[11px] text-slate-500 mt-2">
              Se a planilha nao tiver coluna "titulo", a primeira coluna sera usada como titulo.
              Demandas serao criadas na coluna <strong>Solicitada</strong>.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Demanda Modal ───────────────────────────────────────────

function DemandaModal({
  demanda,
  open,
  onOpenChange,
  onSave,
  onDelete,
}: {
  demanda: Demanda | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (d: DemandaForm) => void
  onDelete: (id: string) => void
}) {
  const [form, setForm] = useState<DemandaForm>(emptyForm())
  const isNew = !demanda

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
    } else {
      setForm(emptyForm())
    }
  }, [demanda])

  const upd = (k: keyof DemandaForm, v: string | null) =>
    setForm((p) => ({ ...p, [k]: v }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-white/90 dark:bg-slate-800/80 backdrop-blur-xl border-white/50 dark:border-slate-700/30 text-slate-800 dark:text-slate-100">
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
                    <SelectItem key={o.id} value={o.id} className="text-slate-100">
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
                    <SelectItem key={p.id} value={p.id} className="text-slate-100">
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
            <Input
              value={form.assignee || ''}
              onChange={(e) => upd('assignee', e.target.value || null)}
              placeholder="Nome da pessoa responsavel"
              className="mt-1 bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-500"
            />
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

// ─── Kanban Card ─────────────────────────────────────────────

function KanbanCard({ d, onClick }: { d: Demanda; onClick: (d: Demanda) => void }) {
  const origin = ORIGINS.find((o) => o.id === d.origin)
  const prio = PRIORITIES.find((p) => p.id === d.priority)
  const isOverdue = d.deadline && d.status !== 'concluida' && toDateStr(d.deadline) < todayStr()

  return (
    <div
      onClick={() => onClick(d)}
      className={`group bg-white dark:bg-slate-800/40 rounded-xl p-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md hover:shadow-slate-900/[0.06] border ${
        isOverdue ? 'border-red-400/40 dark:border-red-500/40' : 'border-slate-200/80 dark:border-slate-700/25 hover:border-blue-300 dark:hover:border-slate-600/40'
      }`}
      style={{ borderLeftWidth: 3, borderLeftColor: origin?.color || '#8899aa' }}
    >
      <div className="flex justify-between items-start gap-2 mb-1.5">
        <span className="text-[13px] font-semibold text-slate-800 dark:text-slate-100 leading-tight flex-1">
          {d.title}
        </span>
        {prio && (
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0"
            style={{ background: prio.color + '22', color: prio.color }}
          >
            {prio.label}
          </span>
        )}
      </div>
      {d.assignee && (
        <div className="text-[10px] text-slate-400 mb-1 truncate">
          → {d.assignee}
        </div>
      )}
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-semibold" style={{ color: origin?.color }}>
          {origin?.label}
        </span>
        {d.deadline && (
          <span className={`text-[10px] ${isOverdue ? 'text-blue-500 dark:text-blue-400' : 'text-slate-500'}`}>
            {isOverdue ? '⚠ ' : ''}
            {new Date(d.deadline).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Kanban Column ───────────────────────────────────────────

function KanbanColumn({
  status,
  items,
  onClickCard,
}: {
  status: Status
  items: Demanda[]
  onClickCard: (d: Demanda) => void
}) {
  return (
    <div className="flex-1 min-w-[180px]">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className="text-base">{status.icon}</span>
        <span className="text-[12px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-100">
          {status.label}
        </span>
        <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[11px] font-bold px-2 py-0.5 rounded-full">
          {items.length}
        </span>
      </div>
      <div className="flex flex-col gap-2 min-h-[60px]">
        {items.map((d) => (
          <KanbanCard key={d.id} d={d} onClick={onClickCard} />
        ))}
      </div>
    </div>
  )
}

// ─── Gantt Chart ─────────────────────────────────────────────

type TimeRange = 'hours' | 'days' | 'weeks' | 'months'

const TIME_RANGE_CONFIG: Record<TimeRange, { label: string; daysSpan: number; tickHours: number; tickFormat: Intl.DateTimeFormatOptions }> = {
  hours: { label: 'Horas', daysSpan: 1, tickHours: 3, tickFormat: { hour: '2-digit', minute: '2-digit' } },
  days: { label: 'Dias', daysSpan: 14, tickHours: 24, tickFormat: { day: '2-digit', month: 'short' } },
  weeks: { label: 'Semanas', daysSpan: 60, tickHours: 24 * 7, tickFormat: { day: '2-digit', month: 'short' } },
  months: { label: 'Meses', daysSpan: 180, tickHours: 24 * 30, tickFormat: { month: 'short', year: '2-digit' } },
}

function GanttChart({ demandas, timeRange }: { demandas: Demanda[]; timeRange: TimeRange }) {
  const activeDemandas = demandas.filter((d) => d.status !== 'concluida')

  if (activeDemandas.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center py-5">
        Nenhuma demanda ativa para exibir no Gantt
      </div>
    )
  }

  const config = TIME_RANGE_CONFIG[timeRange]
  const DAY_MS = 86400000
  const now = Date.now()

  // Window: center on today, span based on timeRange
  const halfSpan = (config.daysSpan / 2) * DAY_MS
  const minDate = new Date(now - halfSpan)
  const maxDate = new Date(now + halfSpan)
  const totalMs = maxDate.getTime() - minDate.getTime()

  const todayPos = ((now - minDate.getTime()) / totalMs) * 100

  // Generate tick marks
  const ticks: Date[] = []
  const tickMs = config.tickHours * 3600000
  const firstTick = new Date(minDate)

  // Align first tick to clean boundary
  if (timeRange === 'hours') {
    const h = firstTick.getHours()
    firstTick.setHours(h - (h % config.tickHours) + config.tickHours, 0, 0, 0)
  } else if (timeRange === 'months') {
    firstTick.setDate(1)
    firstTick.setHours(0, 0, 0, 0)
  } else if (timeRange === 'weeks') {
    const day = firstTick.getDay()
    const diff = day === 0 ? -6 : 1 - day
    firstTick.setDate(firstTick.getDate() + diff)
    firstTick.setHours(0, 0, 0, 0)
  } else {
    firstTick.setHours(0, 0, 0, 0)
  }

  const cursor = new Date(firstTick)
  while (cursor <= maxDate) {
    if (cursor >= minDate) {
      ticks.push(new Date(cursor))
    }
    if (timeRange === 'months') {
      cursor.setMonth(cursor.getMonth() + 1)
    } else {
      cursor.setTime(cursor.getTime() + tickMs)
    }
  }

  // Filter demandas that overlap with visible window
  const visibleDemandas = activeDemandas.filter((dem) => {
    const start = new Date(dem.dateIn).getTime()
    const end = dem.deadline ? new Date(dem.deadline).getTime() : start + DAY_MS * 7
    return end >= minDate.getTime() && start <= maxDate.getTime()
  })

  if (visibleDemandas.length === 0) {
    return (
      <div className="text-slate-500 text-sm text-center py-5">
        Nenhuma demanda neste periodo
      </div>
    )
  }

  const rowCount = visibleDemandas.length

  return (
    <div className="overflow-x-auto relative w-full">
      <div className="relative min-w-[500px]">
        {/* Tick headers */}
        <div className="flex border-b border-slate-300/60 dark:border-slate-700/40 mb-1">
          <div className="w-[200px] shrink-0 p-1.5" />
          <div className="flex-1 relative h-7">
            {ticks.map((t, i) => {
              const pos = ((t.getTime() - minDate.getTime()) / totalMs) * 100
              return (
                <span
                  key={i}
                  className="absolute text-[10px] text-slate-600 dark:text-slate-400 font-semibold whitespace-nowrap"
                  style={{ left: `${pos}%`, top: 6 }}
                >
                  {t.toLocaleDateString('pt-BR', config.tickFormat)}
                </span>
              )
            })}
          </div>
        </div>

        {/* Vertical grid lines at each tick */}
        {ticks.map((t, i) => {
          const pos = ((t.getTime() - minDate.getTime()) / totalMs) * 100
          return (
            <div
              key={`grid-${i}`}
              className="absolute top-8 bottom-0 w-px bg-slate-200/60 dark:bg-slate-700/25 pointer-events-none"
              style={{ left: `calc(200px + (100% - 200px) * ${pos} / 100)` }}
            />
          )
        })}

        {/* Today line */}
        {todayPos >= 0 && todayPos <= 100 && (
          <div
            className="absolute top-8 bottom-0 w-0.5 bg-blue-500 opacity-60 z-10"
            style={{ left: `calc(200px + (100% - 200px) * ${todayPos} / 100)` }}
          />
        )}

        {/* Rows */}
        {visibleDemandas.map((dem) => {
          const origin = ORIGINS.find((o) => o.id === dem.origin)
          const startDate = new Date(dem.dateIn)
          const endDate = dem.deadline
            ? new Date(dem.deadline)
            : new Date(startDate.getTime() + DAY_MS * 7)

          // Clamp to visible range
          const clampedStart = Math.max(startDate.getTime(), minDate.getTime())
          const clampedEnd = Math.min(endDate.getTime(), maxDate.getTime())

          const startPos = ((clampedStart - minDate.getTime()) / totalMs) * 100
          const width = Math.max(((clampedEnd - clampedStart) / totalMs) * 100, 1)
          const isOverdue = dem.deadline && toDateStr(dem.deadline) < todayStr()
          const isBlocked = dem.status === 'bloqueada'
          const barColor = origin?.color || '#8899aa'

          return (
            <div key={dem.id} className="flex items-center h-9 border-b border-slate-200/40 dark:border-slate-700/15">
              <div
                className="w-[200px] shrink-0 px-2 text-[13px] text-slate-800 dark:text-slate-200 font-medium overflow-hidden text-ellipsis whitespace-nowrap"
                title={dem.title}
              >
                {dem.title}
              </div>
              <div className="flex-1 relative h-full">
                <div
                  className="absolute top-1.5 h-6 rounded transition-all"
                  style={{
                    left: `${startPos}%`,
                    width: `${width}%`,
                    background: isBlocked
                      ? `repeating-linear-gradient(45deg, ${barColor}33, ${barColor}33 4px, transparent 4px, transparent 8px)`
                      : `${barColor}44`,
                    border: `1px solid ${isOverdue ? '#ef4444' : barColor}88`,
                  }}
                >
                  <div
                    className="h-full rounded-sm transition-all duration-300"
                    style={{
                      background: isOverdue
                        ? `linear-gradient(90deg, ${barColor}88, #ef444466)`
                        : `${barColor}66`,
                      width:
                        dem.status === 'em_andamento'
                          ? '60%'
                          : dem.status === 'selecionada'
                          ? '10%'
                          : dem.status === 'concluida'
                          ? '100%'
                          : '5%',
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────

export default function DemandasPage() {
  const [demandas, setDemandas] = useState<Demanda[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [editingDemanda, setEditingDemanda] = useState<Demanda | null>(null)
  const [filterOrigin, setFilterOrigin] = useState('all')
  const [timeRange, setTimeRange] = useState<TimeRange>('weeks')

  const fetchDemandas = useCallback(async () => {
    try {
      const res = await fetch('/api/demandas')
      const json = await res.json()
      if (json.success) {
        setDemandas(json.data)
      }
    } catch (err) {
      console.error('Erro ao carregar demandas:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDemandas()
  }, [fetchDemandas])

  const handleSave = async (form: DemandaForm) => {
    try {
      const method = form.id ? 'PUT' : 'POST'
      const res = await fetch('/api/demandas', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        await fetchDemandas()
        setModalOpen(false)
        setEditingDemanda(null)
      }
    } catch (err) {
      console.error('Erro ao salvar demanda:', err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/demandas?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        await fetchDemandas()
        setModalOpen(false)
        setEditingDemanda(null)
      }
    } catch (err) {
      console.error('Erro ao excluir demanda:', err)
    }
  }

  const openNew = () => {
    setEditingDemanda(null)
    setModalOpen(true)
  }

  const openEdit = (d: Demanda) => {
    setEditingDemanda(d)
    setModalOpen(true)
  }

  const filtered =
    filterOrigin === 'all' ? demandas : demandas.filter((d) => d.origin === filterOrigin)

  const stats = {
    total: demandas.length,
    ativas: demandas.filter((d) => d.status === 'em_andamento').length,
    selecionadas: demandas.filter((d) => d.status === 'selecionada').length,
    pendentes: demandas.filter((d) => d.status === 'solicitada').length,
    atrasadas: demandas.filter(
      (d) => d.deadline && toDateStr(d.deadline) < todayStr() && d.status !== 'concluida'
    ).length,
    concluidas: demandas.filter((d) => d.status === 'concluida').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 dark:text-blue-400" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-5 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Demandas
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Kanban e timeline de demandas
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setImportModalOpen(true)}
            className="border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Upload className="h-4 w-4 mr-1.5" />
            Importar
          </Button>
          <Button onClick={openNew} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Demanda
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: '#94a3b8' },
          { label: 'Solicitadas', value: stats.pendentes, color: '#f59e0b' },
          { label: 'Selecionadas', value: stats.selecionadas, color: '#8b5cf6' },
          { label: 'Em Andamento', value: stats.ativas, color: '#3b82f6' },
          { label: 'Atrasadas', value: stats.atrasadas, color: '#ef4444' },
          { label: 'Concluidas', value: stats.concluidas, color: '#22c55e' },
        ].map((s) => (
          <Card
            key={s.label}
            className="bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/25 shadow-sm shadow-slate-900/[0.04]"
            style={{ borderLeftWidth: 3, borderLeftColor: s.color }}
          >
            <CardContent className="p-3">
              <div className="text-2xl font-extrabold tracking-tight" style={{ color: s.color }}>
                {s.value}
              </div>
              <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                {s.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex gap-1.5">
        <button
          onClick={() => setFilterOrigin('all')}
          className={`px-3.5 py-1.5 rounded-md border text-xs font-semibold transition-colors ${
            filterOrigin === 'all'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
              : 'border-slate-200 dark:border-slate-700/20 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Todas
        </button>
        {ORIGINS.map((o) => (
          <button
            key={o.id}
            onClick={() => setFilterOrigin(o.id)}
            className="px-3.5 py-1.5 rounded-md border text-xs font-semibold transition-colors"
            style={{
              borderColor: filterOrigin === o.id ? o.color : undefined,
              background: filterOrigin === o.id ? o.color + '15' : undefined,
              color: filterOrigin === o.id ? o.color : undefined,
            }}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Kanban */}
      <Card className="bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/25 shadow-sm shadow-slate-900/[0.04]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-blue-600 dark:text-blue-400 text-sm font-extrabold uppercase tracking-wider">
              Kanban
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto">
            {STATUSES.map((s) => (
              <KanbanColumn
                key={s.id}
                status={s}
                items={filtered.filter((d) => d.status === s.id)}
                onClickCard={openEdit}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gantt */}
      <Card className="bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/25 shadow-sm shadow-slate-900/[0.04]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 dark:text-blue-400 text-sm font-extrabold uppercase tracking-wider">
                Timeline
              </span>
              <span className="text-[11px] text-slate-500">— demandas ativas</span>
            </div>
            <div className="flex gap-1">
              {(['hours', 'days', 'weeks', 'months'] as TimeRange[]).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    timeRange === range
                      ? 'bg-blue-50 dark:bg-blue-600/15 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                  }`}
                >
                  {TIME_RANGE_CONFIG[range].label}
                </button>
              ))}
            </div>
          </div>
          <GanttChart demandas={filtered} timeRange={timeRange} />
        </CardContent>
      </Card>

      {/* Modals */}
      <DemandaModal
        demanda={editingDemanda}
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open)
          if (!open) setEditingDemanda(null)
        }}
        onSave={handleSave}
        onDelete={handleDelete}
      />

      <ImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImported={fetchDemandas}
      />
    </div>
  )
}
