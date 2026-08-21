'use client'

import { useCallback, useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PortalTabs } from '@/components/portal/portal-tabs'
import { AlertCircle, Download, FileText, Search } from 'lucide-react'
import { formatDate } from '@/lib/date'
import { TEMPLATE_VERSAO } from '@/lib/proposta/templates/endpoints-a4'

interface PropostaItem {
  id: string
  codigo: string
  clienteNome: string
  empresaNome: string
  cnpj: string | null
  quantidade: number
  planos: string[]
  ajustePercent: number
  tabelaVigencia: string
  templateVersao: string
  arquivoNome: string
  arquivado: boolean
  createdAt: string
  criadoPor: { name: string | null; email: string } | null
}

export default function LogPropostasPage() {
  const [itens, setItens] = useState<PropostaItem[]>([])
  const [busca, setBusca] = useState('')
  const [de, setDe] = useState('')
  const [ate, setAte] = useState('')
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const carregar = useCallback(async (q: string, dDe: string, dAte: string) => {
    setLoading(true)
    setErro(null)
    try {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (dDe) params.set('de', dDe)
      if (dAte) params.set('ate', dAte)

      const res = await fetch(`/api/portal/propostas?${params.toString()}`)
      const json = await res.json()

      // Sem erro silencioso: se o backend recusou, a tela diz por quê.
      if (!res.ok) {
        setErro(json?.error || 'Não foi possível carregar o log de propostas.')
        setItens([])
        return
      }
      setItens(json.data ?? [])
    } catch {
      setErro('Falha de rede ao carregar o log de propostas.')
      setItens([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => carregar(busca, de, ate), 300)
    return () => clearTimeout(t)
  }, [busca, de, ate, carregar])

  return (
    <div className="p-6 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Propostas emitidas
        </h1>
      </div>

      <PortalTabs />

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por empresa, cliente, CNPJ ou número"
            className="pl-9"
          />
        </div>
        <Input
          type="date"
          value={de}
          onChange={(e) => setDe(e.target.value)}
          className="w-[160px]"
          aria-label="De"
        />
        <Input
          type="date"
          value={ate}
          onChange={(e) => setAte(e.target.value)}
          className="w-[160px]"
          aria-label="Até"
        />
      </div>

      {erro && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Carregando…</p>
      ) : itens.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {busca || de || ate
            ? 'Nenhuma proposta encontrada para esse filtro.'
            : 'Nenhuma proposta emitida ainda.'}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2 font-medium">Número</th>
                <th className="px-4 py-2 font-medium">Empresa</th>
                <th className="px-4 py-2 font-medium">Cliente</th>
                <th className="px-4 py-2 font-medium">Licenças</th>
                <th className="px-4 py-2 font-medium">Preço</th>
                <th className="px-4 py-2 font-medium">Emitida</th>
                <th className="px-4 py-2 font-medium">Arquivo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {itens.map((p) => (
                <tr key={p.id} className="text-slate-700 dark:text-slate-200">
                  <td className="whitespace-nowrap px-4 py-2 font-mono text-xs">
                    {p.codigo}
                    {/* O preço do re-download é fiel (precoSnapshot); o texto fixo
                        vive no código. Proposta emitida com outra versão do texto
                        sai DIFERENTE do que o cliente recebeu — e isso tem que
                        aparecer, não ser descoberto pelo cliente. */}
                    {p.templateVersao !== TEMPLATE_VERSAO && (
                      <div
                        className="mt-1 font-sans text-xs font-medium text-amber-600 dark:text-amber-400"
                        title={`Emitida com o modelo de ${p.templateVersao}. O preço do re-download é o mesmo; o texto institucional é o de hoje.`}
                      >
                        modelo {p.templateVersao}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    {p.empresaNome}
                    {p.cnpj && (
                      <div className="text-xs text-slate-500 dark:text-slate-400">{p.cnpj}</div>
                    )}
                  </td>
                  <td className="px-4 py-2">{p.clienteNome}</td>
                  <td className="px-4 py-2">{p.quantidade}</td>
                  <td className="whitespace-nowrap px-4 py-2">
                    {p.ajustePercent === 0
                      ? 'Tabela'
                      : `${p.ajustePercent < 0 ? '−' : '+'}${Math.abs(p.ajustePercent)}%`}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">
                    {formatDate(p.createdAt)}
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {p.criadoPor?.name || p.criadoPor?.email || '—'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2">
                    <a href={`/api/portal/propostas/${p.id}/arquivo`}>
                      <Button variant="outline" size="sm">
                        <Download className="mr-1 h-3.5 w-3.5" />
                        Baixar
                      </Button>
                    </a>
                    {/* Falha do OneDrive não some da tela: o vendedor precisa
                        saber que o arquivo ainda não foi para a pasta. */}
                    {!p.arquivado && (
                      <div className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                        não arquivado
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
