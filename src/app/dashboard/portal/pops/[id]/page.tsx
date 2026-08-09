'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PortalMarkdown } from '@/components/portal/portal-markdown'
import { FreshnessBadge } from '@/components/portal/freshness-badge'
import { freshnessOf } from '@/lib/playbook-freshness'
import { formatDate } from '@/lib/date'
import { ArrowLeft, Check, Pencil, AlertCircle, ExternalLink } from 'lucide-react'

interface Playbook {
  id: string
  kind: 'POP' | 'BIBLIOTECA'
  title: string
  body: string
  externalUrl: string | null
  tags: string[]
  companyId: string | null
  ownerId: string | null
  verifiedAt: string | null
  reviewDueAt: string | null
  updatedAt: string
}

export default function PopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: session } = useSession()
  const role = session?.user?.role || ''

  const [playbook, setPlaybook] = useState<Playbook | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [verificando, setVerificando] = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    try {
      const res = await fetch(`/api/portal/playbooks/${id}`)
      const json = await res.json()
      if (!res.ok) {
        setErro(json?.error || 'POP não encontrado ou fora do seu acesso.')
        setPlaybook(null)
        return
      }
      setPlaybook(json.data)
    } catch {
      setErro('Falha de rede ao carregar o POP.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    carregar()
  }, [carregar])

  async function verificar() {
    setVerificando(true)
    setErro(null)
    try {
      const res = await fetch(`/api/portal/playbooks/${id}/verify`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setErro(json?.error || 'Não foi possível verificar.')
        return
      }
      await carregar()
    } catch {
      setErro('Falha de rede ao verificar.')
    } finally {
      setVerificando(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Carregando…</p>

  if (erro && !playbook) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/portal" className="inline-flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Portal
        </Link>
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      </div>
    )
  }

  if (!playbook) return null

  const verifiedAt = playbook.verifiedAt ? new Date(playbook.verifiedAt) : null
  const reviewDueAt = playbook.reviewDueAt ? new Date(playbook.reviewDueAt) : null
  const estado = freshnessOf({ verifiedAt, reviewDueAt })
  const podeEditar =
    role === 'admin' || (role === 'gerencia' && playbook.companyId !== null)
  const ehBiblioteca = playbook.kind === 'BIBLIOTECA'
  const voltarPara = ehBiblioteca ? '/dashboard/portal/biblioteca' : '/dashboard/portal'

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <Link href={voltarPara} className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> {ehBiblioteca ? 'Voltar à Biblioteca' : 'Voltar ao Portal'}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">{playbook.title}</h1>
        <div className="flex shrink-0 gap-2">
          {podeEditar && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/portal/pops/${playbook.id}/editar`}>
                <Pencil className="mr-1 h-4 w-4" /> Editar
              </Link>
            </Button>
          )}
          <Button onClick={verificar} disabled={verificando}>
            <Check className="mr-1 h-4 w-4" />
            {verificando ? 'Verificando…' : 'Verificar'}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <FreshnessBadge verifiedAt={verifiedAt} reviewDueAt={reviewDueAt} />
        <span className="text-sm text-slate-500 dark:text-slate-400">
          {estado === 'nunca_verificado'
            ? 'Este procedimento ainda não foi verificado por ninguém.'
            : estado === 'precisa_revisao'
              ? `Passou da data de revisão — última verificação em ${formatDate(playbook.verifiedAt)}.`
              : `Verificado em ${formatDate(playbook.verifiedAt)}.`}
        </span>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {/* Item de Biblioteca: a ficha vive aqui, o arquivo vive no OneDrive.
          `noopener noreferrer` é invariante da spec-mãe §5. */}
      {ehBiblioteca && playbook.externalUrl && (
        <a
          href={playbook.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300 dark:hover:bg-blue-950/60"
        >
          Abrir arquivo no OneDrive <ExternalLink className="h-4 w-4" />
        </a>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700/50 dark:bg-slate-800/40">
        <PortalMarkdown body={playbook.body} />
      </div>

      {playbook.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {playbook.tags.map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
