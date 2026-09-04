'use client'

// ─────────────────────────────────────────────────────────────────────────────
// TELA DE REVISÃO DOS CASOS — feature-portal-apresentacao.md §6.6
//
// ⚠️ O caso barrado chega DESMARCADO, com o motivo à vista e o botão de liberar
// ao lado. Nunca descartado em silêncio: descarte silencioso some com conteúdo
// bom e ninguém percebe (§6.4 camada 3).
//
// ⚠️ O aceite nunca nasce marcado. É ele que declara que um humano leu o que vai
// ao cliente — e depois do A13b um número PODE ter passado pelo LLM, desde que
// seja cópia da matéria. Quem garante que ele está grudado no fato certo é a
// leitura, não o código.
// ─────────────────────────────────────────────────────────────────────────────

import { AlertTriangle, Trash2 } from 'lucide-react'
import { COMPARATIVO, type FuncionalidadeId } from '@/lib/apresentacao/comparativo'
import { TEXTO_ACEITE } from '@/lib/apresentacao/pesquisa/revisao'

export interface Bandeira {
  tipo: string
  detalhe: string
}

export interface CasoEmRevisao {
  oQueAconteceu: string
  entidadesRemovidas: string[]
  necessidade: string
  funcionalidade: FuncionalidadeId
  veiculo: string
  ano: number
  fonteIdx: number[]
  bandeiras: Bandeira[]
  liberado: boolean
  incluido: boolean
}

const ROTULO_BANDEIRA: Record<string, string> = {
  texto_truncado: 'Texto cortado para caber na página',
  entidade_vazou: 'Nome que deveria ter sido removido continua no texto',
  nome_proprio: 'Possível nome próprio no texto',
  numero_proibido: 'Número que não pode sair de IA',
  numero_nao_conferido: 'Número que não aparece na matéria pesquisada',
  fonte_invalida: 'Fonte inválida',
  funcionalidade_invalida: 'Funcionalidade fora da lista',
}

export function RevisaoCasos({
  casos,
  fontes,
  aceite,
  descartados = [],
  onChange,
  onAceite,
}: {
  casos: CasoEmRevisao[]
  fontes: { titulo: string; dominio: string }[]
  aceite: boolean
  /** Casos que a pesquisa não conseguiu aproveitar. A tela DIZ — não some. */
  descartados?: { indice: number; motivo: string }[]
  onChange: (casos: CasoEmRevisao[]) => void
  onAceite: (v: boolean) => void
}) {
  const atualizar = (i: number, patch: Partial<CasoEmRevisao>) =>
    onChange(casos.map((c, j) => (j === i ? { ...c, ...patch } : c)))

  if (casos.length === 0) {
    return (
      <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
        Não encontrei incidentes documentados neste setor. O documento sai
        institucional — e você pode escrever os casos à mão depois, se quiser.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {descartados.length > 0 && (
        <div className="rounded-md border border-slate-300 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
          {descartados.length} caso(s) vieram fora do formato e não puderam ser
          aproveitados ({descartados.map((d) => d.motivo).join('; ')}). Os demais estão
          abaixo — se precisar de mais, pesquise de novo.
        </div>
      )}
      {casos.map((c, i) => (
        <div
          key={i}
          className={`rounded-lg border p-4 ${
            c.bandeiras.length > 0
              ? 'border-amber-300 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20'
              : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
          }`}
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <input
                type="checkbox"
                checked={c.incluido}
                onChange={(e) => atualizar(i, { incluido: e.target.checked })}
                className="h-4 w-4 rounded border-slate-300"
              />
              Caso {i + 1}
            </label>
            <button
              type="button"
              onClick={() => onChange(casos.filter((_, j) => j !== i))}
              className="text-slate-400 hover:text-red-600"
              aria-label="Remover caso"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {c.bandeiras.length > 0 && (
            <div className="mb-3 rounded-md border border-amber-300 bg-amber-100/60 p-3 text-xs dark:border-amber-800 dark:bg-amber-950/40">
              <div className="mb-1 flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-200">
                <AlertTriangle className="h-3.5 w-3.5" />
                Barrado pelas guardas — não entra sem sua liberação
              </div>
              <ul className="ml-5 list-disc space-y-0.5 text-amber-900/90 dark:text-amber-200/90">
                {c.bandeiras.map((b, k) => (
                  <li key={k}>
                    <strong>{ROTULO_BANDEIRA[b.tipo] ?? b.tipo}</strong> — {b.detalhe}
                  </li>
                ))}
              </ul>
              <label className="mt-2 flex items-center gap-2 font-medium text-amber-900 dark:text-amber-200">
                <input
                  type="checkbox"
                  checked={c.liberado}
                  onChange={(e) => atualizar(i, { liberado: e.target.checked })}
                  className="h-3.5 w-3.5 rounded border-amber-400"
                />
                Conferi e libero mesmo assim
              </label>
            </div>
          )}

          <div className="space-y-2.5">
            <Campo rotulo="O que aconteceu">
              <textarea
                value={c.oQueAconteceu}
                onChange={(e) => atualizar(i, { oQueAconteceu: e.target.value })}
                maxLength={400}
                rows={3}
                className="w-full rounded-md border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
            </Campo>
            <Campo rotulo="A necessidade que isso expõe">
              <textarea
                value={c.necessidade}
                onChange={(e) => atualizar(i, { necessidade: e.target.value })}
                maxLength={300}
                rows={2}
                className="w-full rounded-md border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-800"
              />
            </Campo>
            <div className="grid gap-2.5 sm:grid-cols-3">
              <Campo rotulo="Responde por isso">
                <select
                  value={c.funcionalidade}
                  onChange={(e) =>
                    atualizar(i, { funcionalidade: e.target.value as FuncionalidadeId })
                  }
                  className="w-full rounded-md border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                >
                  {COMPARATIVO.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo rotulo="Veículo">
                <input
                  value={c.veiculo}
                  onChange={(e) => atualizar(i, { veiculo: e.target.value })}
                  maxLength={80}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
              </Campo>
              <Campo rotulo="Ano">
                <input
                  type="number"
                  value={c.ano}
                  onChange={(e) => atualizar(i, { ano: Number(e.target.value) })}
                  className="w-full rounded-md border border-slate-300 p-2 text-sm dark:border-slate-600 dark:bg-slate-800"
                />
              </Campo>
            </div>
          </div>
        </div>
      ))}

      {fontes.length > 0 && (
        <div className="rounded-md border border-slate-200 p-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
          <div className="mb-1 font-semibold uppercase tracking-wider">Fontes da pesquisa</div>
          <ol className="ml-4 list-decimal space-y-0.5">
            {fontes.map((f, i) => (
              <li key={i}>
                {f.titulo} · {f.dominio}
              </li>
            ))}
          </ol>
        </div>
      )}

      <label className="flex items-start gap-2 rounded-md border border-slate-300 bg-white p-3 text-sm font-medium text-slate-800 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100">
        <input
          type="checkbox"
          checked={aceite}
          onChange={(e) => onAceite(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-slate-300"
        />
        {TEXTO_ACEITE}
      </label>
    </div>
  )
}

function Campo({ rotulo, children }: { rotulo: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        {rotulo}
      </span>
      {children}
    </div>
  )
}
