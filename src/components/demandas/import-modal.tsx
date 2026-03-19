'use client'

import { useState, useRef } from 'react'
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
import { Loader2, Upload, FileSpreadsheet, ListPlus } from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { ORIGINS, PRIORITIES } from '@/app/dashboard/demandas/helpers'

export function ImportModal({
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
                  <SelectItem key={o.id} value={o.id} className="text-slate-800 dark:text-slate-200">
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
                  <SelectItem key={p.id} value={p.id} className="text-slate-800 dark:text-slate-200">
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
