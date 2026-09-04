'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { PortalTabs } from '@/components/portal/portal-tabs'
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Presentation } from 'lucide-react'
import { NIVEIS, NIVEL_NOME, type NivelId } from '@/lib/apresentacao/comparativo'
import { fatosParaSetor } from '@/lib/apresentacao/mercado-fatos'
import { mensagemDeErroApi } from '@/lib/api-erro-legivel'
import { COMPLEMENTOS, type ComplementoId } from '@/lib/proposta/complementos'

interface Formulario {
  clienteNome: string
  empresaNome: string
  setor: string
  nivelDestaque: NivelId
  complementos: ComplementoId[]
}

/** Mesmo limite do `createApresentacaoSchema`. Se mudar lá, muda aqui. */
const SETOR_MAX = 80

const INICIAL: Formulario = {
  clienteNome: '',
  empresaNome: '',
  setor: '',
  nivelDestaque: 'PREMIUM',
  complementos: [],
}

export default function NovaApresentacaoPage() {
  const [form, setForm] = useState<Formulario>(INICIAL)
  const [erro, setErro] = useState<string | null>(null)
  const [gerando, setGerando] = useState(false)
  const [pronta, setPronta] = useState(false)

  // Prévia do que o nicho muda: a mesma função pura que o servidor usa, então
  // a tela não pode prometer um número que o documento não vai trazer.
  const fatos = fatosParaSetor(form.setor.trim() || undefined)
  const especificos = fatos.filter((f) => f.setores?.length)

  const podeGerar = form.clienteNome.trim() && form.empresaNome.trim() && !gerando

  async function gerar() {
    setErro(null)
    setGerando(true)
    try {
      const res = await fetch('/api/portal/apresentacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNome: form.clienteNome.trim(),
          empresaNome: form.empresaNome.trim(),
          setor: form.setor.trim() || null,
          nivelDestaque: form.nivelDestaque,
          complementos: form.complementos,
        }),
      })

      if (!res.ok) {
        // Sem erro silencioso (I4): a tela diz por que o backend recusou.
        // ⚠️ O `handleApiError` manda `error` como STRING e o motivo real em
        // `details[]`. Ler `j.error.message` devolvia undefined e escondia
        // justamente o campo que estourou (400 do Gustavo, 02/09).
        let motivo = `Falha ao gerar a apresentação (HTTP ${res.status})`
        try {
          motivo = mensagemDeErroApi(await res.json(), res.status, 'Falha ao gerar a apresentação')
        } catch {
          /* resposta sem JSON — fica a mensagem com o status */
        }
        throw new Error(motivo)
      }

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Apresentacao Defenz - ${form.empresaNome.trim()}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 2000)
      setPronta(true)
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao gerar a apresentação')
    } finally {
      setGerando(false)
    }
  }

  return (
    <div className="space-y-6">
      <PortalTabs />

      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/portal"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Portal
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          Nova apresentação
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
          Documento institucional para quem ainda não conhece a Bitdefender. Vai por e-mail
          e se explica sozinho, sem apresentador. Não mostra preço — quem faz preço é a
          proposta.
        </p>
      </div>

      <div className="max-w-2xl space-y-5 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              Nome da empresa <span className="text-red-600">*</span>
            </span>
            <Input
              value={form.empresaNome}
              onChange={(e) => setForm({ ...form, empresaNome: e.target.value })}
              placeholder="Clínica São Rafael"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
              A/C — quem vai ler <span className="text-red-600">*</span>
            </span>
            <Input
              value={form.clienteNome}
              onChange={(e) => setForm({ ...form, clienteNome: e.target.value })}
              placeholder="Dr. Antônio Ribeiro"
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Setor do cliente
          </span>
          <Input
            value={form.setor}
            // ⚠️ O limite é do schema (80). Cortar aqui é o que evita o 400 que
            // chegou ao vendedor sem dizer o motivo: é campo de NICHO, não de
            // descrição da empresa — alguém colou o texto institucional inteiro.
            maxLength={SETOR_MAX}
            onChange={(e) => setForm({ ...form, setor: e.target.value.slice(0, SETOR_MAX) })}
            placeholder="Saúde, Financeiro, Setor público…"
          />
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
            {especificos.length > 0 ? (
              <>
                O documento vai trazer <strong>{especificos.length}</strong> dado específico
                deste setor, além dos números nacionais.
              </>
            ) : form.setor.trim() ? (
              <>
                Ainda não tenho dado específico deste setor. A apresentação sai com os
                números nacionais, <strong>sem inventar</strong> um número setorial.
              </>
            ) : (
              'Em branco, o documento sai institucional, só com os números nacionais.'
            )}
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Nível em destaque
          </span>
          <select
            value={form.nivelDestaque}
            onChange={(e) => setForm({ ...form, nivelDestaque: e.target.value as NivelId })}
            className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          >
            {NIVEIS.map((n) => (
              <option key={n} value={n}>
                {NIVEL_NOME[n]}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
            Marca a coluna recomendada na tabela dos três níveis.
          </span>
        </label>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
            Complementos a citar
          </span>
          <div className="space-y-1.5">
            {COMPLEMENTOS.map((c) => (
              <label
                key={c.id}
                className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-200"
              >
                <input
                  type="checkbox"
                  checked={form.complementos.includes(c.id)}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      complementos: e.target.checked
                        ? [...form.complementos, c.id]
                        : form.complementos.filter((x) => x !== c.id),
                    })
                  }
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                />
                <span>{c.nome.replace('Bitdefender ', '')}</span>
              </label>
            ))}
          </div>
          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
            A apresentação diz o que cada módulo <strong>faz</strong>, e não mostra
            valor nenhum — quem faz preço é a proposta.
          </span>
        </div>

        {erro && (
          <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {pronta && !erro && (
          <div className="flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Apresentação gerada e baixada. Pode gerar outra alterando os campos.</span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Button onClick={gerar} disabled={!podeGerar}>
            {gerando ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando…
              </>
            ) : (
              <>
                <Presentation className="mr-2 h-4 w-4" />
                Gerar apresentação
              </>
            )}
          </Button>
          <Link
            href="/dashboard/portal/proposta"
            className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-white"
          >
            Precisa também de proposta?
          </Link>
        </div>
      </div>
    </div>
  )
}
