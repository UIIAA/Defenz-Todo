'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { PortalTabs } from '@/components/portal/portal-tabs'
import { AnaAnswer } from '@/components/portal/ana-answer'
import { Button } from '@/components/ui/button'
import { BookOpen, Sparkles, AlertCircle, Send, Globe, Database } from 'lucide-react'

const AVISO_TEXTO: Record<string, string> = {
  fonte_fraca: 'A base tem pouca coisa sobre isso — trate a resposta com desconfiança.',
  fonte_vencida: 'Pelo menos um dos POPs citados está vencido (precisa de revisão).',
  multi_empresa: 'As fontes vêm de empresas diferentes. Confira se o processo é o da empresa certa.',
  bloqueio_seguranca: 'O filtro de segurança do modelo bloqueou esta pergunta.',
  resposta_cortada: 'A resposta bateu no limite de tamanho e foi cortada — abra o POP para o resto.',
  sem_chave: 'A IA ainda não está ligada neste ambiente.',
}

const FRESCOR_TEXTO: Record<string, string> = {
  verificado: 'verificado',
  precisa_revisao: 'precisa revisão',
  nunca_verificado: 'nunca verificado',
}

interface Citacao {
  id: string
  title: string
  companyLabel: string
  freshness: string
}

interface Resposta {
  answer: string
  citations: Citacao[]
  sources: { url: string; title: string }[]
  webEnabled: boolean
  avisos: string[]
}

const EXEMPLOS = [
  'Qual é a cadência de follow-up depois do primeiro contato?',
  'O que precisa estar preenchido no Zoho antes de mandar proposta?',
  'Como funciona o setup de um cliente novo?',
]

export default function IaPage() {
  const [pergunta, setPergunta] = useState('')
  const [modo, setModo] = useState<'interno' | 'web'>('interno')
  const [resposta, setResposta] = useState<Resposta | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [caps, setCaps] = useState<{ aiEnabled: boolean; webEnabled: boolean; maxChars: number } | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    // Env vars são server-side: a UI pergunta ao servidor o que está ligado.
    fetch('/api/portal/ask')
      .then((r) => r.json())
      .then((j) => setCaps(j?.data ?? null))
      .catch(() => setCaps(null))
  }, [])

  const maxChars = caps?.maxChars ?? 500

  async function perguntar(texto?: string) {
    const q = (texto ?? pergunta).trim()
    if (!q || carregando) return

    setCarregando(true)
    setErro(null)
    setResposta(null)
    try {
      const res = await fetch('/api/portal/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: q, mode: modo }),
      })
      const json = await res.json()

      // Sem erro silencioso (GUIA §9.3).
      if (!res.ok) {
        setErro(json?.error || 'A IA não conseguiu responder.')
        return
      }
      setResposta(json.data)
    } catch {
      setErro('Falha de rede ao falar com a IA.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex items-center gap-3">
        <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Portal Defenz</h1>
      </div>

      <PortalTabs />

      <div className="max-w-3xl space-y-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
          <div>
            <h2 className="text-lg font-medium text-slate-900 dark:text-white">Ana</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pergunte sobre os processos da Defenz. A Ana só responde com base nos POPs e
              materiais publicados aqui — quando não tem fonte, ela diz que não sabe.
            </p>
          </div>
        </div>

        {caps && !caps.aiEnabled && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              A IA ainda não está ligada neste ambiente: falta a
              {' '}<code className="font-mono text-xs">GEMINI_API_KEY</code>. As abas POPs e
              Biblioteca funcionam normalmente.
            </span>
          </div>
        )}

        {/* Seletor de modo. O modo web manda a PERGUNTA para fora — e a pergunta é o
            vazamento, não o trecho do POP. Por isso o aviso é explícito. */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setModo('interno')}
            className={
              modo === 'interno'
                ? 'inline-flex items-center gap-1.5 rounded-full border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-medium text-white'
                : 'inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 dark:border-slate-700 dark:text-slate-300'
            }
          >
            <Database className="h-3.5 w-3.5" /> Base interna
          </button>
          <button
            type="button"
            disabled={!caps?.webEnabled}
            title={
              caps?.webEnabled
                ? 'Pesquisa na web — a sua pergunta sai da Defenz'
                : 'Pesquisa na web ainda não configurada neste ambiente (falta o webhook do n8n)'
            }
            onClick={() => setModo('web')}
            className={
              modo === 'web'
                ? 'inline-flex items-center gap-1.5 rounded-full border border-blue-600 bg-blue-600 px-3 py-1 text-xs font-medium text-white'
                : 'inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300'
            }
          >
            <Globe className="h-3.5 w-3.5" /> Web
            {!caps?.webEnabled && <span className="text-[10px]">(indisponível)</span>}
          </button>
          {modo === 'web' && (
            <span className="text-xs text-amber-700 dark:text-amber-400">
              Nenhum trecho de POP sai — mas a sua pergunta sai. Não escreva nome de cliente.
            </span>
          )}
        </div>

        <div className="space-y-2">
          <textarea
            ref={inputRef}
            value={pergunta}
            maxLength={maxChars}
            rows={3}
            onChange={(e) => setPergunta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) perguntar()
            }}
            placeholder="Ex.: como funciona o setup de um cliente novo?"
            className="w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:placeholder:text-slate-500"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {pergunta.length}/{maxChars} · ⌘+Enter envia
            </span>
            <Button onClick={() => perguntar()} disabled={carregando || !pergunta.trim()}>
              <Send className="mr-1 h-4 w-4" />
              {carregando ? 'Pensando…' : 'Perguntar'}
            </Button>
          </div>
        </div>

        {!resposta && !carregando && (
          <div className="flex flex-wrap gap-2">
            {EXEMPLOS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setPergunta(ex)
                  perguntar(ex)
                }}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 transition-colors hover:border-slate-400 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500"
              >
                {ex}
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

        {resposta && (
          <div className="space-y-4">
            {resposta.avisos.length > 0 && (
              <div className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/30">
                {resposta.avisos.map((a) => (
                  <p key={a} className="flex items-start gap-2 text-sm text-amber-800 dark:text-amber-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {AVISO_TEXTO[a] ?? a}
                  </p>
                ))}
              </div>
            )}

            {/* Markdown SEM link e SEM imagem: um POP com texto injetado não vira link
                clicável na resposta da Ana (regra dura §7.2). Ver <AnaAnswer>. */}
            <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-800 dark:border-slate-700/50 dark:bg-slate-800/40 dark:text-slate-100">
              <AnaAnswer text={resposta.answer} />
            </div>

            {resposta.citations.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Fontes
                </p>
                <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-700/40 dark:border-slate-700/50">
                  {resposta.citations.map((c) => (
                    <Link
                      key={c.id}
                      href={`/dashboard/portal/pops/${c.id}`}
                      className="flex items-center justify-between gap-3 bg-white p-3 text-sm transition-colors hover:bg-slate-50 dark:bg-slate-800/40 dark:hover:bg-slate-800/70"
                    >
                      <span className="min-w-0 truncate text-slate-900 dark:text-white">{c.title}</span>
                      <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">
                        {c.companyLabel} · {FRESCOR_TEXTO[c.freshness] ?? c.freshness}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {resposta.sources.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  Links da web
                </p>
                <ul className="space-y-1">
                  {resposta.sources.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
