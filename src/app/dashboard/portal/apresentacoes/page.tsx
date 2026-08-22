'use client'

import { useCallback, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PortalTabs } from '@/components/portal/portal-tabs'
import { AlertCircle, Download, Loader2, Search } from 'lucide-react'
import { formatDate } from '@/lib/date'
import { NIVEL_NOME, type NivelId } from '@/lib/apresentacao/comparativo'
import { TEMPLATE_VERSAO } from '@/lib/apresentacao/templates/institucional-a4'

interface Item {
  id: string
  clienteNome: string
  empresaNome: string
  setor: string | null
  nivelDestaque: string
  templateVersao: string
  arquivoNome: string
  createdAt: string
  criadoPor: { name: string | null; email: string } | null
}

export default function LogApresentacoesPage() {
  const [itens, setItens] = useState<Item[]>([])
  const [busca, setBusca] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const p = new URLSearchParams()
      if (busca.trim()) p.set('q', busca.trim())
      if (de) p.set('de', de)
      if (ate) p.set('ate', ate)
      const res = await fetch(`/api/portal/apresentacoes?${p}`)
      if (!res.ok) throw new Error(`Falha ao carregar (HTTP ${res.status})`)
      const j = await res.json()
      setItens(j.data ?? [])
    } catch (e) {
      // Sem erro silencioso (I4).
      setErro(e instanceof Error ? e.message : 'Falha ao carregar')
    } finally {
      setCarregando(false)
    }
  }, [busca, de, ate])

  useEffect(() => {
    carregar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6">
      <PortalTabs />

      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Apresentações emitidas
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          O que já foi enviado, para quem, e com quais números. O re-download reimprime a
          partir do que foi afirmado na época, não do catálogo de hoje.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Empresa, pessoa ou setor
          </span>
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && carregar()}
            placeholder="Buscar…"
            className="w-64"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            De
          </span>
          <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
            Até
          </span>
          <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
        </label>
        <Button variant="outline" onClick={carregar} disabled={carregando}>
          {carregando ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Search className="mr-2 h-4 w-4" />
          )}
          Buscar
        </Button>
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2">Empresa</th>
              <th className="px-4 py-2">A/C</th>
              <th className="px-4 py-2">Setor</th>
              <th className="px-4 py-2">Nível</th>
              <th className="px-4 py-2">Emitida</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {itens.map((a) => (
              <tr key={a.id} className="text-slate-700 dark:text-slate-200">
                <td className="px-4 py-2 font-medium">
                  {a.empresaNome}
                  {/* O texto institucional vive no código: documento emitido com
                      outra versão sai DIFERENTE do que o cliente recebeu, e isso
                      tem que aparecer, não ser descoberto pelo cliente. */}
                  {a.templateVersao !== TEMPLATE_VERSAO && (
                    <div
                      className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400"
                      title={`Emitida com o modelo de ${a.templateVersao}. Os números são os da época; o texto institucional é o de hoje.`}
                    >
                      modelo {a.templateVersao}
                    </div>
                  )}
                </td>
                <td className="px-4 py-2">{a.clienteNome}</td>
                <td className="px-4 py-2">
                  {a.setor || <span className="text-slate-400">institucional</span>}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  {NIVEL_NOME[a.nivelDestaque as NivelId] ?? a.nivelDestaque}
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  {formatDate(a.createdAt)}
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {a.criadoPor?.name || a.criadoPor?.email || '—'}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-2">
                  <a href={`/api/portal/apresentacoes/${a.id}/arquivo`}>
                    <Button variant="outline" size="sm">
                      <Download className="mr-1 h-3.5 w-3.5" />
                      Baixar
                    </Button>
                  </a>
                </td>
              </tr>
            ))}
            {!carregando && itens.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                  Nenhuma apresentação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
