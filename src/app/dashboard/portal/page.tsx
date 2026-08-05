'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FreshnessBadge } from '@/components/portal/freshness-badge'
import { BookOpen, Plus, Search, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/date'

interface PlaybookListItem {
  id: string
  kind: 'POP' | 'BIBLIOTECA'
  title: string
  tags: string[]
  companyId: string | null
  verifiedAt: string | null
  reviewDueAt: string | null
  updatedAt: string
  owner: { name: string | null; email: string } | null
}

export default function PortalPage() {
  const { data: session } = useSession()
  const role = session?.user?.role || ''
  const podeEscrever = role === 'admin' || role === 'gerencia'

  const [playbooks, setPlaybooks] = useState<PlaybookListItem[]>([])
  const [busca, setBusca] = useState('')
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async (q: string) => {
    setLoading(true)
    setErro(null)
    try {
      const params = new URLSearchParams({ kind: 'POP' })
      if (q.trim()) params.set('q', q.trim())

      const res = await fetch(`/api/portal/playbooks?${params.toString()}`)
      const json = await res.json()

      // Sem erro silencioso: se o backend recusou, a tela diz o motivo.
      if (!res.ok) {
        setErro(json?.error || 'Não foi possível carregar os POPs.')
        setPlaybooks([])
        return
      }
      setPlaybooks(json.data ?? [])
    } catch {
      setErro('Falha de rede ao carregar os POPs.')
      setPlaybooks([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => carregar(busca), 300)
    return () => clearTimeout(t)
  }, [busca, carregar])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-semibold text-slate-900">Portal Defenz</h1>
      </div>

      {/* Abas: só POPs está viva na F1. Aba morta é promessa quebrada — as outras
          aparecem com a fase em que entram. */}
      <div className="flex gap-6 border-b border-slate-200">
        <span className="-mb-px border-b-2 border-blue-600 pb-2 text-sm font-medium text-slate-900">
          POPs
        </span>
        <span className="pb-2 text-sm text-slate-400">
          Biblioteca <span className="ml-1 rounded border border-slate-200 px-1.5 py-0.5 text-[11px]">em breve</span>
        </span>
        <span className="pb-2 text-sm text-slate-400">
          IA Defenz <span className="ml-1 rounded border border-slate-200 px-1.5 py-0.5 text-[11px]">em breve</span>
        </span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar no título ou no conteúdo do procedimento"
            className="pl-9"
          />
        </div>
        {podeEscrever && (
          <Button asChild>
            <Link href="/dashboard/portal/pops/novo/editar">
              <Plus className="mr-1 h-4 w-4" /> Novo POP
            </Link>
          </Button>
        )}
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Carregando…</p>
      ) : playbooks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center">
          <p className="text-sm font-medium text-slate-700">
            {busca ? 'Nenhum POP encontrado para essa busca.' : 'Nenhum POP ainda.'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {busca
              ? 'Tente outra palavra — a busca olha o título e o conteúdo.'
              : 'Comece escrevendo o primeiro procedimento da equipe.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 bg-white">
          {playbooks.map((p) => (
            <Link
              key={p.id}
              href={`/dashboard/portal/pops/${p.id}`}
              className="flex items-start justify-between gap-3 p-4 transition-colors hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900">{p.title}</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {p.owner?.name || p.owner?.email || 'sem dono'}
                  {p.verifiedAt
                    ? ` · verificado em ${formatDate(p.verifiedAt)}`
                    : ` · atualizado em ${formatDate(p.updatedAt)}`}
                  {p.companyId === null ? ' · global' : ''}
                </p>
              </div>
              <FreshnessBadge
                verifiedAt={p.verifiedAt ? new Date(p.verifiedAt) : null}
                reviewDueAt={p.reviewDueAt ? new Date(p.reviewDueAt) : null}
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
