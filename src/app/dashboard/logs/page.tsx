'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, ChevronLeft, ChevronRight, FileText, Plus, Pencil, Trash2, Upload } from 'lucide-react'

interface AuditLog {
  id: string
  action: string
  entityType: string
  entityId: string
  userId: string
  userEmail: string
  changes: string | null
  createdAt: string
  user: { name: string | null; email: string }
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

const ACTION_LABELS: Record<string, { label: string; color: string; icon: typeof Plus }> = {
  CREATE: { label: 'Criacao', color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20', icon: Plus },
  UPDATE: { label: 'Edicao', color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20', icon: Pencil },
  DELETE: { label: 'Exclusao', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20', icon: Trash2 },
  IMPORT: { label: 'Importacao', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20', icon: Upload },
}

function ChangesDisplay({ changes }: { changes: string | null }) {
  if (!changes) return <span className="text-muted-foreground text-xs">-</span>

  try {
    const parsed = JSON.parse(changes) as Record<string, { from: unknown; to: unknown }>
    return (
      <div className="space-y-1">
        {Object.entries(parsed).map(([field, { from, to }]) => (
          <div key={field} className="text-xs">
            <span className="font-medium text-foreground">{field}:</span>{' '}
            {from !== null && (
              <span className="text-red-500 line-through">{String(from)}</span>
            )}
            {from !== null && to !== null && ' → '}
            {to !== null && (
              <span className="text-green-600 dark:text-green-400">{String(to)}</span>
            )}
          </div>
        ))}
      </div>
    )
  } catch {
    return <span className="text-muted-foreground text-xs">{changes}</span>
  }
}

export default function LogsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterAction, setFilterAction] = useState('all')
  const [page, setPage] = useState(1)

  const userRole = (session?.user as { role?: string })?.role || ''
  const isAdmin = ['admin', 'gerencia'].includes(userRole)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30' })
      if (filterAction !== 'all') params.set('action', filterAction)

      const res = await fetch(`/api/audit-logs?${params}`)
      const json = await res.json()

      if (json.success) {
        setLogs(json.data.logs)
        setPagination(json.data.pagination)
      }
    } catch (err) {
      console.error('Erro ao carregar logs:', err)
    } finally {
      setLoading(false)
    }
  }, [page, filterAction])

  useEffect(() => {
    if (!isAdmin && session) {
      router.push('/dashboard')
      return
    }
    if (isAdmin) fetchLogs()
  }, [isAdmin, session, router, fetchLogs])

  if (!isAdmin) return null

  return (
    <div className="p-6 space-y-5">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Logs de Auditoria
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Historico de alteracoes do sistema
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 items-center">
        <Select value={filterAction} onValueChange={(v) => { setFilterAction(v); setPage(1) }}>
          <SelectTrigger className="w-[180px] bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/30">
            <SelectValue placeholder="Filtrar por acao" />
          </SelectTrigger>
          <SelectContent className="bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/30">
            <SelectItem value="all">Todas as acoes</SelectItem>
            <SelectItem value="CREATE">Criacao</SelectItem>
            <SelectItem value="UPDATE">Edicao</SelectItem>
            <SelectItem value="DELETE">Exclusao</SelectItem>
            <SelectItem value="IMPORT">Importacao</SelectItem>
          </SelectContent>
        </Select>

        {pagination && (
          <span className="text-sm text-muted-foreground ml-auto">
            {pagination.total} registro{pagination.total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Logs Table */}
      <Card className="bg-white dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/25 shadow-[0_1px_2px_rgba(0,0,0,0.06),0_4px_12px_rgba(0,0,0,0.04)]">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-extrabold uppercase tracking-wider">
            <FileText className="h-4 w-4" />
            Registros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum log encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700/20">
                    <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Data</th>
                    <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Acao</th>
                    <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Tipo</th>
                    <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">Usuario</th>
                    <th className="text-left py-2.5 px-3 text-xs font-bold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Alteracoes</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'text-slate-500 bg-slate-50', icon: FileText }
                    const Icon = actionInfo.icon
                    return (
                      <tr key={log.id} className="border-b border-slate-100 dark:border-blue-900/10 hover:bg-blue-50/30 dark:hover:bg-white/5 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap text-xs text-muted-foreground font-mono">
                          {new Date(log.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: '2-digit',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-semibold ${actionInfo.color}`}>
                            <Icon className="h-3 w-3" />
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs font-medium hidden sm:table-cell">{log.entityType}</td>
                        <td className="py-3 px-3 text-xs">
                          <span className="font-medium">{log.user.name || log.userEmail}</span>
                        </td>
                        <td className="py-3 px-3 max-w-[300px] hidden sm:table-cell">
                          <ChangesDisplay changes={log.changes} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="cursor-pointer"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Pagina {pagination.page} de {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="cursor-pointer"
              >
                Proxima
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
