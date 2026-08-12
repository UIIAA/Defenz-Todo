'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PortalTabs } from '@/components/portal/portal-tabs'
import { AlertCircle, ArrowLeft, CheckCircle2, FileText, Loader2 } from 'lucide-react'
import { calcularInvestimento, formatarBRL, type Investimento } from '@/lib/proposta/calculo'
import { PLANOS, PLANO_LABEL, QUANTIDADE_MAX, QUANTIDADE_MIN, type PlanoId } from '@/lib/proposta/tabela-precos'
import { AJUSTE_MAX_PERCENT, type BasePreco } from '@/lib/validations/proposta'

type Etapa = 'formulario' | 'confirmacao' | 'pronto'

interface Formulario {
  clienteNome: string
  empresaNome: string
  cnpj: string
  oQueFaz: string
  quantidade: string
  planos: PlanoId[]
  basePreco: BasePreco
  percentual: string
}

const INICIAL: Formulario = {
  clienteNome: '',
  empresaNome: '',
  cnpj: '',
  oQueFaz: '',
  quantidade: '',
  // Os três marcados por padrão (decisão P7): o cliente compara lado a lado,
  // e o vendedor desmarca o que não fizer sentido.
  planos: [...PLANOS],
  basePreco: 'tabela',
  percentual: '',
}

export default function NovaPropostaPage() {
  const [form, setForm] = useState<Formulario>(INICIAL)
  const [etapa, setEtapa] = useState<Etapa>('formulario')
  const [erro, setErro] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [emitida, setEmitida] = useState<{ codigo: string; id: string } | null>(null)

  const ajuste = useMemo(() => {
    if (form.basePreco === 'tabela') return 0
    const p = Number(form.percentual.replace(',', '.'))
    if (!Number.isFinite(p)) return 0
    return form.basePreco === 'abaixo' ? -p : p
  }, [form.basePreco, form.percentual])

  /**
   * Prévia calculada NO CLIENTE só para a tela de confirmação.
   * A conta que vale é a do servidor — esta é a mesma função pura, então as
   * duas não podem divergir; se a entrada for inválida, mostramos o erro em
   * vez de um preço inventado.
   */
  const previa = useMemo((): { investimento: Investimento } | { erro: string } => {
    const qtd = Number(form.quantidade)
    try {
      return {
        investimento: calcularInvestimento({
          quantidade: qtd,
          planos: form.planos,
          ajustePercent: ajuste,
        }),
      }
    } catch (e) {
      return { erro: e instanceof Error ? e.message : 'Dados inválidos' }
    }
  }, [form.quantidade, form.planos, ajuste])

  function validarEAvancar() {
    setErro(null)
    if (!form.clienteNome.trim()) return setErro('Informe o nome do cliente.')
    if (!form.empresaNome.trim()) return setErro('Informe o nome da empresa.')
    if (form.planos.length === 0) return setErro('Marque ao menos um plano.')

    const qtd = Number(form.quantidade)
    if (!Number.isInteger(qtd)) return setErro('Informe a quantidade de licenças.')
    if (qtd < QUANTIDADE_MIN || qtd > QUANTIDADE_MAX) {
      return setErro(
        `A tabela pública cobre de ${QUANTIDADE_MIN} a ${QUANTIDADE_MAX} licenças. Fora dessa faixa não dá para propor preço sem consultar a SecuriSoft.`
      )
    }
    if (form.basePreco !== 'tabela') {
      const p = Number(form.percentual.replace(',', '.'))
      if (!Number.isFinite(p) || p <= 0 || p > AJUSTE_MAX_PERCENT) {
        return setErro(`Informe um percentual entre 0 e ${AJUSTE_MAX_PERCENT}.`)
      }
    }
    if ('erro' in previa) return setErro(previa.erro)

    setEtapa('confirmacao')
  }

  async function gerar() {
    setGerando(true)
    setErro(null)
    try {
      const res = await fetch('/api/portal/propostas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'ENDPOINTS',
          clienteNome: form.clienteNome.trim(),
          empresaNome: form.empresaNome.trim(),
          cnpj: form.cnpj.trim() || null,
          oQueFaz: form.oQueFaz.trim() || null,
          quantidade: Number(form.quantidade),
          planos: form.planos,
          basePreco: form.basePreco,
          percentual:
            form.basePreco === 'tabela'
              ? null
              : Number(form.percentual.replace(',', '.')),
        }),
      })

      // Sem erro silencioso na UI: o servidor pode responder JSON de erro
      // mesmo quando o caminho feliz devolve um PDF.
      if (!res.ok) {
        const tipo = res.headers.get('Content-Type') || ''
        let msg = 'Não foi possível gerar a proposta.'
        if (tipo.includes('application/json')) {
          const json = await res.json().catch(() => null)
          msg = json?.error || msg
          if (json?.details?.[0]?.message) msg = json.details[0].message
        }
        setErro(msg)
        return
      }

      const codigo = res.headers.get('X-Proposta-Codigo') || ''
      const id = res.headers.get('X-Proposta-Id') || ''
      const blob = await res.blob()

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Proposta Defenz ${codigo}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)

      setEmitida({ codigo, id })
      setEtapa('pronto')
    } catch {
      setErro('Falha de rede ao gerar a proposta.')
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-full overflow-x-hidden">
      <div className="flex items-center gap-3">
        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Nova proposta</h1>
      </div>

      <PortalTabs />

      {erro && (
        <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {etapa === 'formulario' && (
        <div className="max-w-3xl space-y-5">
          <Campo label="Tipo de documento">
            <select
              value="ENDPOINTS"
              disabled
              className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              <option value="ENDPOINTS">Bitdefender · Proteção de Endpoints</option>
            </select>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Proposta de MDR entra quando o modelo existir.
            </p>
          </Campo>

          <div className="grid gap-5 sm:grid-cols-2">
            <Campo label="Nome da empresa *">
              <Input
                value={form.empresaNome}
                onChange={(e) => setForm({ ...form, empresaNome: e.target.value })}
                placeholder="Acme Indústria Ltda"
              />
            </Campo>
            <Campo label="Nome do cliente *">
              <Input
                value={form.clienteNome}
                onChange={(e) => setForm({ ...form, clienteNome: e.target.value })}
                placeholder="Maria Souza"
              />
            </Campo>
            <Campo label="CNPJ">
              <Input
                value={form.cnpj}
                onChange={(e) => setForm({ ...form, cnpj: e.target.value })}
                placeholder="00.000.000/0001-00"
              />
            </Campo>
            <Campo label="Quantidade de licenças *">
              <Input
                type="number"
                min={QUANTIDADE_MIN}
                max={QUANTIDADE_MAX}
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
                placeholder="30"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                De {QUANTIDADE_MIN} a {QUANTIDADE_MAX}, faixa coberta pela tabela pública.
              </p>
            </Campo>
          </div>

          <Campo label="O que a empresa faz">
            <textarea
              value={form.oQueFaz}
              onChange={(e) => setForm({ ...form, oQueFaz: e.target.value })}
              rows={3}
              placeholder="Distribuidora de autopeças com 3 filiais e operação 24/7."
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Fica guardado para quando a Ana escrever o contexto sob medida. Não entra
              neste documento.
            </p>
          </Campo>

          <Campo label="Quais planos entram na proposta? *">
            <div className="space-y-2">
              {PLANOS.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={form.planos.includes(p)}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        planos: e.target.checked
                          ? [...form.planos, p]
                          : form.planos.filter((x) => x !== p),
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {PLANO_LABEL[p]}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              O cliente vê os planos lado a lado para comparar. Desmarque os que não
              fizerem sentido para essa oportunidade.
            </p>
          </Campo>

          <Campo label="Valor de tabela? *">
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ['tabela', 'Preço de tabela'],
                  ['abaixo', 'Abaixo da tabela'],
                  ['acima', 'Acima da tabela'],
                ] as const
              ).map(([valor, rotulo]) => (
                <label key={valor} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="radio"
                    name="basePreco"
                    checked={form.basePreco === valor}
                    onChange={() => setForm({ ...form, basePreco: valor })}
                    className="h-4 w-4"
                  />
                  {rotulo}
                </label>
              ))}
            </div>
          </Campo>

          {form.basePreco !== 'tabela' && (
            <Campo label={`Percentual ${form.basePreco === 'abaixo' ? 'de desconto' : 'de acréscimo'} *`}>
              <Input
                value={form.percentual}
                onChange={(e) => setForm({ ...form, percentual: e.target.value })}
                placeholder="5"
                className="max-w-[160px]"
              />
            </Campo>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={validarEAvancar}>Revisar antes de gerar</Button>
            <Link href="/dashboard/portal">
              <Button variant="outline">Cancelar</Button>
            </Link>
          </div>
        </div>
      )}

      {etapa === 'confirmacao' && 'investimento' in previa && (
        <div className="max-w-3xl space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
              Confira antes de gerar
            </h2>

            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <Linha rotulo="Empresa" valor={form.empresaNome} />
              <Linha rotulo="Cliente" valor={form.clienteNome} />
              <Linha rotulo="CNPJ" valor={form.cnpj || '—'} />
              <Linha rotulo="Licenças" valor={`${form.quantidade} (faixa ${previa.investimento.faixa})`} />
              <Linha
                rotulo="Planos"
                valor={previa.investimento.planos.map((p) => p.label).join(' · ')}
              />
              <Linha
                rotulo="Preço"
                valor={
                  ajuste === 0
                    ? 'Tabela cheia'
                    : `${previa.investimento.rotuloAjuste} de ${Math.abs(ajuste)}%`
                }
              />
            </dl>
          </div>

          {/* O preço aparece ANTES de o documento existir: é aqui que se pega
              um erro de quantidade sem queimar um número de proposta. */}
          <div className="space-y-4">
            {previa.investimento.planos.map((bloco) => (
              <div
                key={bloco.plano}
                className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
                  {bloco.label}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      <th className="py-1 font-medium">Vigência</th>
                      <th className="py-1 text-right font-medium">Unitário / mês</th>
                      <th className="py-1 text-right font-medium">Por licença</th>
                      <th className="py-1 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700 dark:text-slate-200">
                    {bloco.vigencias.map((v) => (
                      <tr key={v.anos} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="py-1.5">
                          {v.rotulo}
                          {v.bonusMeses > 0 && (
                            <span className="ml-1 text-xs text-emerald-600 dark:text-emerald-400">
                              ({v.meses} meses de cobertura)
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 text-right">{formatarBRL(v.valorUnitarioMesFinal)}</td>
                        <td className="py-1.5 text-right">{formatarBRL(v.precoLicencaFinal)}</td>
                        <td className="py-1.5 text-right font-semibold">
                          {formatarBRL(v.valorTotalFinal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tabela vigente desde {previa.investimento.tabelaVigencia}. O documento sai com{' '}
            {previa.investimento.planos.length === 1
              ? '1 página de investimento'
              : `${previa.investimento.planos.length} páginas de investimento`}
            .
          </p>

          <div className="flex gap-2">
            <Button onClick={gerar} disabled={gerando}>
              {gerando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {gerando ? 'Gerando o PDF…' : 'Confirmar e gerar proposta'}
            </Button>
            <Button variant="outline" onClick={() => setEtapa('formulario')} disabled={gerando}>
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar e corrigir
            </Button>
          </div>
        </div>
      )}

      {etapa === 'pronto' && emitida && (
        <div className="max-w-3xl space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <div className="font-semibold text-emerald-900 dark:text-emerald-200">
                Proposta {emitida.codigo} gerada
              </div>
              <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
                O download começou. O registro ficou salvo e pode ser baixado de novo
                pelo log, sempre com o mesmo preço.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <a href={`/api/portal/propostas/${emitida.id}/arquivo`}>
              <Button variant="outline">Baixar de novo</Button>
            </a>
            <Link href="/dashboard/portal/propostas">
              <Button variant="outline">Ver o log de propostas</Button>
            </Link>
            <Button
              onClick={() => {
                setForm(INICIAL)
                setEmitida(null)
                setEtapa('formulario')
              }}
            >
              Nova proposta
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      {children}
    </div>
  )
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {rotulo}
      </dt>
      <dd className="text-slate-900 dark:text-white">{valor}</dd>
    </div>
  )
}
