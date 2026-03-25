'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ArrowUp, ArrowDown } from 'lucide-react'
import { StatusBadge } from '@/components/status-badge'
import { formatDateShortYear } from '@/lib/date'
import {
  ORIGINS,
  PRIORITIES,
  CLASSIFICATIONS,
  toDateStr,
  todayStr,
  type Demanda,
} from '@/app/dashboard/demandas/helpers'

export type SortableField = 'title' | 'status' | 'priority' | 'deadline' | 'origin' | 'assignee' | 'classification'

const STATUS_ORDER: Record<string, number> = {
  solicitada: 0,
  selecionada: 1,
  em_andamento: 2,
  concluida: 3,
  bloqueada: 4,
}

const PRIORITY_ORDER: Record<string, number> = {
  alta: 0,
  media: 1,
  baixa: 2,
}

function SortIcon({ field, sortField, sortDir }: { field: SortableField; sortField: SortableField; sortDir: 'asc' | 'desc' }) {
  if (field !== sortField) return <ArrowUp className="h-3 w-3 text-slate-300 dark:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
  return sortDir === 'asc'
    ? <ArrowUp className="h-3 w-3 text-blue-500" />
    : <ArrowDown className="h-3 w-3 text-blue-500" />
}

export function ListViewTable({
  demandas,
  onClickRow,
  sortField,
  sortDir,
  onSort,
}: {
  demandas: Demanda[]
  onClickRow: (d: Demanda) => void
  sortField: SortableField
  sortDir: 'asc' | 'desc'
  onSort: (field: SortableField) => void
}) {
  const sorted = [...demandas].sort((a, b) => {
    let cmp = 0
    switch (sortField) {
      case 'title':
        cmp = a.title.localeCompare(b.title, 'pt-BR')
        break
      case 'status':
        cmp = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
        break
      case 'priority':
        cmp = (PRIORITY_ORDER[a.priority] ?? 99) - (PRIORITY_ORDER[b.priority] ?? 99)
        break
      case 'deadline':
        cmp = (a.deadline || '9999').localeCompare(b.deadline || '9999')
        break
      case 'origin':
        cmp = a.origin.localeCompare(b.origin, 'pt-BR')
        break
      case 'assignee':
        cmp = (a.assignee || 'zzz').localeCompare(b.assignee || 'zzz', 'pt-BR')
        break
      case 'classification':
        cmp = (a.classification || 'zzz').localeCompare(b.classification || 'zzz', 'pt-BR')
        break
    }
    return sortDir === 'asc' ? cmp : -cmp
  })

  const originMap = Object.fromEntries(ORIGINS.map((o) => [o.id, o]))
  const prioMap = Object.fromEntries(PRIORITIES.map((p) => [p.id, p]))
  const classifMap = Object.fromEntries(CLASSIFICATIONS.map((c) => [c.id, c]))
  const today = todayStr()

  const columns: { key: SortableField; label: string }[] = [
    { key: 'title', label: 'Titulo' },
    { key: 'origin', label: 'Origem' },
    { key: 'classification', label: 'Classificacao' },
    { key: 'priority', label: 'Prioridade' },
    { key: 'status', label: 'Status' },
    { key: 'assignee', label: 'Responsavel' },
    { key: 'deadline', label: 'Prazo' },
  ]

  return (
    <Card className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800">
                {columns.map((col) => {
                  const hiddenOnMobile = ['origin', 'classification', 'priority', 'assignee'].includes(col.key)
                  return (
                    <th
                      key={col.key}
                      onClick={() => onSort(col.key)}
                      className={`group cursor-pointer px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors${hiddenOnMobile ? ' hidden sm:table-cell' : ''}`}
                    >
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                      </span>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-sm text-slate-400">
                    Nenhuma demanda encontrada
                  </td>
                </tr>
              ) : (
                sorted.map((d, i) => {
                  const origin = originMap[d.origin]
                  const prio = prioMap[d.priority]
                  const isOverdue = d.deadline && d.status !== 'concluida' && toDateStr(d.deadline) < today
                  return (
                    <tr
                      key={d.id}
                      onClick={() => onClickRow(d)}
                      className={`cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700/50 ${
                        i % 2 === 1 ? 'bg-slate-50 dark:bg-slate-800/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 max-w-[300px] truncate">
                        {d.title}
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">
                        <span className="font-semibold" style={{ color: origin?.color }}>
                          {origin?.label || d.origin}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">
                        {d.classification ? (
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: (classifMap[d.classification]?.color || '#94a3b8') + '22', color: classifMap[d.classification]?.color || '#94a3b8' }}
                          >
                            {classifMap[d.classification]?.label || d.classification}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">--</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm hidden sm:table-cell">
                        <span className="font-semibold" style={{ color: prio?.color }}>
                          {prio?.label || d.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300 hidden sm:table-cell">
                        {d.assignee || <span className="text-slate-400 italic">--</span>}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {d.deadline ? (
                          <span className={isOverdue ? 'text-red-500 font-semibold' : 'text-slate-600 dark:text-slate-300'}>
                            {isOverdue && '! '}
                            {formatDateShortYear(d.deadline)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">--</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
