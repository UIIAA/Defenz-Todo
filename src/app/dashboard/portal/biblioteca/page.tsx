'use client'

import { useState, useEffect, useCallback } from 'react'
import { PortalTabs } from '@/components/portal/portal-tabs'
import { Input } from '@/components/ui/input'
import { BookOpen, Search, AlertCircle, ExternalLink, FileText } from 'lucide-react'
import { formatDate } from '@/lib/date'

interface FichaListItem {
  id: string
  kind: 'POP' | 'BIBLIOTECA'
  title: string
  tags: string[]
  companyId: string | null
  externalUrl: string | null
  updatedAt: string
  owner: { name: string | null; email: string } | null
}

export default function BibliotecaPage() {
  const [fichas, setFichas] = useState<FichaListItem[]>([])
  const [busca, setBusca] = useState('')
  const [tagAtiva, setTagAtiva] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async (q: string, tag: string | null) => {
    setLoading(true)
    setErro(null)
    try {
      const params = new URLSearchParams({ kind: 'BIBLIOTECA' })
      if (q.trim()) params.set('q', q.trim())
      if (tag) params.set('tag', tag)

      const res = await fetch(`/api/portal/playbooks?${params.toString()}`)
      const json = await res.json()

      // Sem erro silencioso (GUIA §9.3): se o backend recusou, a tela diz o motivo.
      if (!res.ok) {
        setErro(json?.error || 'Não foi possível carregar a Biblioteca.')
        setFichas([])
        return
      }
      setFichas(json.data ?? [])
    } catch {
      setErro('Falha de rede ao carregar a Biblioteca.')
      setFichas([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => carregar(busca, tagAtiva), 300)
    return () => clearTimeout(t)
  }, [busca, tagAtiva, carregar])

  // Tags das fichas carregadas, para o filtro rápido. Quando há tag ativa, a lista
  // já vem filtrada — então preservamos a tag ativa na barra para poder desligá-la.
  const tags = Array.from(
    new Set([...(tagAtiva ? [tagAtiva] : []), ...fichas.flatMap((f) => f.tags)])
  ).slice(0, 14)

  return (
    <div className="p-6 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Portal Defenz</h1>
      </div>

      <PortalTabs />

      <p className="text-sm text-slate-500 dark:text-slate-400">
        Materiais de apoio comercial e técnico. A ficha fica aqui e é pesquisável; o arquivo
        abre no OneDrive.
      </p>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
        <Input
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar no título ou no conteúdo da ficha"
          className="pl-9"
        />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagAtiva(tagAtiva === tag ? null : tag)}
              className={
                tagAtiva === tag
                  ? 'rounded-full border border-blue-600 bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white dark:border-blue-500 dark:bg-blue-600'
                  : 'rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600 transition-colors hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500'
              }
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Carregando…</p>
      ) : fichas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {busca || tagAtiva ? 'Nenhum material encontrado.' : 'A Biblioteca está vazia.'}
          </p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {busca || tagAtiva
              ? 'Tente outra palavra — a busca olha o título e o conteúdo da ficha.'
              : 'Os materiais aparecem aqui conforme forem publicados.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {fichas.map((f) => (
            <div
              key={f.id}
              className="flex flex-col rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/40"
            >
              <div className="flex items-start gap-2">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <h2 className="text-sm font-medium leading-snug text-slate-900 dark:text-white">
                  {f.title}
                </h2>
              </div>

              {f.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {f.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded border border-slate-200 px-1.5 py-0.5 text-[11px] text-slate-500 dark:border-slate-700 dark:text-slate-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                atualizado em {formatDate(f.updatedAt)}
                {f.companyId === null ? ' · global' : ''}
              </p>

              <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 dark:border-slate-700/40">
                <a
                  href={`/dashboard/portal/pops/${f.id}`}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  Ver ficha
                </a>
                {f.externalUrl && (
                  <a
                    href={f.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Abrir no OneDrive <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
