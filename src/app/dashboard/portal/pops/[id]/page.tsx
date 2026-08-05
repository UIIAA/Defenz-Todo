'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { PortalMarkdown } from '@/components/portal/portal-markdown'
import { FreshnessBadge } from '@/components/portal/freshness-badge'
import { freshnessOf } from '@/lib/playbook-freshness'
import { formatDate } from '@/lib/date'
import { ArrowLeft, Check, Pencil, AlertCircle } from 'lucide-react'

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

  if (loading) return <p className="text-sm text-slate-500">Carregando…</p>

  if (erro && !playbook) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/portal" className="inline-flex items-center gap-1 text-sm text-slate-600">
          <ArrowLeft className="h-4 w-4" /> Voltar ao Portal
        </Link>
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
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

  return (
    <div className="max-w-3xl space-y-5">
      <Link href="/dashboard/portal" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" /> Voltar ao Portal
      </Link>

      <div className="flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">{playbook.title}</h1>
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
        <span className="text-sm text-slate-500">
          {estado === 'nunca_verificado'
            ? 'Este procedimento ainda não foi verificado por ninguém.'
            : estado === 'precisa_revisao'
              ? `Passou da data de revisão — última verificação em ${formatDate(playbook.verifiedAt)}.`
              : `Verificado em ${formatDate(playbook.verifiedAt)}.`}
        </span>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <PortalMarkdown body={playbook.body} />
      </div>

      {playbook.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {playbook.tags.map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
