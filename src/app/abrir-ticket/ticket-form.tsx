'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

type FormState = 'idle' | 'enviando' | 'sucesso' | 'erro'

interface FormFields {
  cnpj: string
  email: string
  name: string
  subject: string
  description: string
  priority: string
}

const EMPTY_FIELDS: FormFields = {
  cnpj: '',
  email: '',
  name: '',
  subject: '',
  description: '',
  priority: 'media',
}

function formatCnpj(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 14)
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12)
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export function TicketForm() {
  const [fields, setFields] = useState<FormFields>(EMPTY_FIELDS)
  const [state, setState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [protocol, setProtocol] = useState('')
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    startTimeRef.current = Date.now()
  }, [])

  function handleCnpjChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFields((prev) => ({ ...prev, cnpj: formatCnpj(e.target.value) }))
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  function handlePriorityChange(value: string) {
    setFields((prev) => ({ ...prev, priority: value }))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Read honeypot from the form itself (the hidden input is in the DOM)
    const form = e.currentTarget
    const hp = (form.elements.namedItem('_hp') as HTMLInputElement | null)?.value ?? ''
    const elapsed = Date.now() - startTimeRef.current

    setState('enviando')
    setErrorMessage('')

    try {
      const res = await fetch('/api/public/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cnpj: fields.cnpj,
          email: fields.email,
          name: fields.name,
          subject: fields.subject,
          description: fields.description,
          priority: fields.priority || undefined,
          _hp: hp,
          _t: elapsed,
        }),
      })

      const data = await res.json()

      if (res.status === 429) {
        setState('erro')
        setErrorMessage('Muitas tentativas. Aguarde alguns minutos e tente novamente.')
        return
      }

      if (!res.ok || !data.success) {
        setState('erro')
        setErrorMessage(
          data.error ??
            'Nao foi possivel validar seus dados. Confira o CNPJ e o e-mail cadastrado na console.'
        )
        return
      }

      setProtocol(data.data.protocol)
      setState('sucesso')
      setFields(EMPTY_FIELDS)
    } catch {
      setState('erro')
      setErrorMessage('Erro de conexao. Verifique sua internet e tente novamente.')
    }
  }

  function handleAbrirOutro() {
    setState('idle')
    setProtocol('')
    setErrorMessage('')
    setFields(EMPTY_FIELDS)
    startTimeRef.current = Date.now()
  }

  if (state === 'sucesso') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="flex flex-col items-center gap-6 py-8 text-center"
      >
        <CheckCircle2 className="h-16 w-16 text-green-500" aria-hidden="true" />
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-800">Chamado aberto com sucesso!</h2>
          <p className="text-slate-600">
            Seu protocolo e:{' '}
            <span
              className="font-mono font-bold text-blue-700 text-lg"
              aria-label={`Protocolo ${protocol}`}
            >
              {protocol}
            </span>
          </p>
          <p className="text-sm text-slate-500">
            Guarde este numero. Nossa equipe entrara em contato em breve.
          </p>
        </div>
        <Button
          onClick={handleAbrirOutro}
          variant="outline"
          className="border-blue-200 text-blue-700 hover:bg-blue-50"
        >
          Abrir outro chamado
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Honeypot — oculto de usuarios reais, visiveis a bots */}
      <input
        type="text"
        name="_hp"
        aria-hidden="true"
        tabIndex={-1}
        autoComplete="off"
        style={{
          position: 'absolute',
          left: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />

      {state === 'erro' && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="cnpj" className="text-slate-700 font-medium text-sm">
            CNPJ <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cnpj"
            name="cnpj"
            type="text"
            inputMode="numeric"
            placeholder="00.000.000/0000-00"
            value={fields.cnpj}
            onChange={handleCnpjChange}
            required
            maxLength={18}
            className="bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 h-11"
            autoComplete="off"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-slate-700 font-medium text-sm">
            E-mail da console <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="contato@suaempresa.com.br"
            value={fields.email}
            onChange={handleChange}
            required
            className="bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 h-11"
            autoComplete="email"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-slate-700 font-medium text-sm">
          Seu nome <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          type="text"
          placeholder="Nome completo"
          value={fields.name}
          onChange={handleChange}
          required
          className="bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 h-11"
          autoComplete="name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject" className="text-slate-700 font-medium text-sm">
          Assunto <span className="text-red-500">*</span>
        </Label>
        <Input
          id="subject"
          name="subject"
          type="text"
          placeholder="Resumo do chamado (max. 200 caracteres)"
          value={fields.subject}
          onChange={handleChange}
          required
          maxLength={200}
          className="bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 h-11"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-slate-700 font-medium text-sm">
          Descricao{' '}
          <span className="text-slate-400 font-normal text-xs">(opcional)</span>
        </Label>
        <Textarea
          id="description"
          name="description"
          placeholder="Descreva o problema ou solicitacao com o maximo de detalhes possivel."
          value={fields.description}
          onChange={handleChange}
          maxLength={5000}
          rows={5}
          className="bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-y min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority" className="text-slate-700 font-medium text-sm">
          Prioridade{' '}
          <span className="text-slate-400 font-normal text-xs">(opcional)</span>
        </Label>
        <Select value={fields.priority} onValueChange={handlePriorityChange}>
          <SelectTrigger
            id="priority"
            className="bg-white border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 h-11"
          >
            <SelectValue placeholder="Selecione a prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Media (padrao)</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="submit"
        disabled={state === 'enviando'}
        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold h-11 shadow-lg shadow-blue-600/25 hover:shadow-blue-700/30 transition-all duration-200 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {state === 'enviando' ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            Enviando chamado...
          </span>
        ) : (
          'Abrir chamado'
        )}
      </Button>

      <p className="text-center text-xs text-slate-400">
        <span className="text-red-400">*</span> Campos obrigatorios.
        Seus dados sao usados apenas para abertura do chamado.
      </p>
    </form>
  )
}
