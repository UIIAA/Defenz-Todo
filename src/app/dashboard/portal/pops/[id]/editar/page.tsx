'use client'

import { useState, useEffect, useCallback, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { PortalMarkdown } from '@/components/portal/portal-markdown'
import { ArrowLeft, AlertCircle, Save } from 'lucide-react'

export default function EditarPopPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const criando = id === 'novo'

  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tagsTexto, setTagsTexto] = useState('')
  const [intervalo, setIntervalo] = useState('90')
  const [evergreen, setEvergreen] = useState(false)
  const [loading, setLoading] = useState(!criando)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    try {
      const res = await fetch(`/api/portal/playbooks/${id}`)
      const json = await res.json()
      if (!res.ok) {
        setErro(json?.error || 'POP não encontrado ou fora do seu acesso.')
        return
      }
      setTitle(json.data.title)
      setBody(json.data.body)
      setTagsTexto((json.data.tags ?? []).join(', '))
      if (json.data.reviewIntervalDays == null) setEvergreen(true)
      else setIntervalo(String(json.data.reviewIntervalDays))
    } catch {
      setErro('Falha de rede ao carregar o POP.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (!criando) carregar()
  }, [criando, carregar])

  async function salvar() {
    setSalvando(true)
    setErro(null)

    const payload = {
      title,
      body,
      tags: tagsTexto.split(',').map((t) => t.trim()).filter(Boolean),
      reviewIntervalDays: evergreen ? null : Number(intervalo),
    }

    try {
      const res = await fetch(
        criando ? '/api/portal/playbooks' : `/api/portal/playbooks/${id}`,
        {
          method: criando ? 'POST' : 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json()

      if (!res.ok) {
        const detalhe = json?.details?.[0]?.message
        setErro(detalhe ? `${json.error}: ${detalhe}` : json?.error || 'Não foi possível salvar.')
        return
      }
      router.push(`/dashboard/portal/pops/${json.data.id}`)
    } catch {
      setErro('Falha de rede ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500 dark:text-slate-400">Carregando…</p>

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <Link href="/dashboard/portal" className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Voltar ao Portal
      </Link>

      <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
        {criando ? 'Novo POP' : 'Editar POP'}
      </h1>

      {erro && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Onboarding de cliente novo"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="body">Conteúdo (markdown)</Label>
          <Textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={18}
            className="font-mono text-xs"
            placeholder={'1. Quem faz, quando faz e o que precisa ter em mãos antes de começar.\n\n![print da tela](https://…)'}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Para imagem, cole o link do OneDrive no formato{' '}
            <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">![descrição](https://…)</code>. Só links https
            são aceitos.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Prévia</Label>
          <div className="min-h-[18rem] rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700/50 dark:bg-slate-800/40">
            {body ? (
              <PortalMarkdown body={body} />
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">A prévia aparece aqui conforme você escreve.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
          <Input
            id="tags"
            value={tagsTexto}
            onChange={(e) => setTagsTexto(e.target.value)}
            placeholder="meta, onboarding"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="intervalo">Revisar a cada (dias)</Label>
          <div className="flex items-center gap-3">
            <Input
              id="intervalo"
              type="number"
              min={1}
              value={intervalo}
              onChange={(e) => setIntervalo(e.target.value)}
              disabled={evergreen}
              className="w-28"
            />
            <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={evergreen}
                onChange={(e) => setEvergreen(e.target.checked)}
              />
              Evergreen (nunca expira)
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={salvar} disabled={salvando}>
          <Save className="mr-1 h-4 w-4" />
          {salvando ? 'Salvando…' : 'Salvar'}
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard/portal">Cancelar</Link>
        </Button>
      </div>
    </div>
  )
}
