'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, Presentation } from 'lucide-react'

/**
 * Navegação do Portal.
 *
 * Nenhuma aba morta: cada uma aqui já leva a uma tela viva. A regra da spec-mãe
 * ("aba morta é promessa quebrada") vale — só entra na lista quando a fase existe.
 *
 * "Propostas" é a QUARTA aba, e não um submenu: o log emitido é um lugar que se
 * visita (buscar o que foi mandado para um cliente, baixar de novo), não um
 * detalhe de outra tela. Enterrá-lo dentro de outra aba faria dele um beco —
 * era exatamente o que estava acontecendo enquanto só se chegava lá pelo botão
 * que aparece depois de gerar.
 *
 * As AÇÕES ficam numa caixa própria à direita, sempre à mostra. Aba é lugar,
 * botão é ação; misturar os dois é o que produz menu confuso.
 *
 * ⚠️ São DUAS ações lado a lado, e não um menu com submenu, porque os três
 * caminhos do Marcos (22/08) são igualmente comuns: *"às vezes vamos gerar
 * apresentação e não proposta; às vezes as duas; às vezes só proposta"*.
 * Esconder uma atrás da outra faria o caminho do meio custar dois cliques e
 * sugeriria uma ordem que não existe.
 */
const ABAS = [
  { href: '/dashboard/portal', label: 'POPs' },
  { href: '/dashboard/portal/biblioteca', label: 'Biblioteca' },
  { href: '/dashboard/portal/ia', label: 'IA Defenz' },
  { href: '/dashboard/portal/apresentacoes', label: 'Apresentações' },
  { href: '/dashboard/portal/propostas', label: 'Propostas' },
] as const

/** Formulários de emissão. Note o singular — `/proposta`, não `/propostas`. */
const ROTA_NOVA_PROPOSTA = '/dashboard/portal/proposta'
const ROTA_NOVA_APRESENTACAO = '/dashboard/portal/apresentacao'

export function PortalTabs() {
  const pathname = usePathname() || ''

  // Comparação EXATA. `startsWith` aqui casaria também `/propostas` (o log) e
  // esconderia o botão justamente na tela onde ele é mais útil.
  const noFormulario = pathname === ROTA_NOVA_PROPOSTA
  const noApresentacao = pathname === ROTA_NOVA_APRESENTACAO

  return (
    <div className="flex items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-700/50">
      <div className="flex gap-6">
        {ABAS.map((aba) => {
          // `/dashboard/portal` é prefixo de todas — só casa exato; as outras
          // casam por prefixo para que telas de detalhe (ex.: /pops/[id])
          // mantenham a aba certa acesa.
          const ativa =
            aba.href === '/dashboard/portal'
              ? pathname === aba.href || pathname.startsWith('/dashboard/portal/pops')
              : pathname.startsWith(aba.href)

          // Emitir uma proposta pertence ao mesmo lugar que consultá-las: a aba
          // Propostas fica acesa também no formulário.
          // Emitir pertence ao mesmo lugar que consultar: a aba do log fica
          // acesa também no formulário correspondente.
          const acesa =
            aba.href === '/dashboard/portal/propostas'
              ? ativa || noFormulario
              : aba.href === '/dashboard/portal/apresentacoes'
                ? ativa || noApresentacao
                : ativa

          return (
            <Link
              key={aba.href}
              href={aba.href}
              className={
                acesa
                  ? '-mb-px border-b-2 border-blue-600 pb-2 text-sm font-medium text-slate-900 dark:border-blue-400 dark:text-white'
                  : 'pb-2 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }
            >
              {aba.label}
            </Link>
          )
        })}
      </div>

      {/*
        "Como se fosse um botão sempre à mostra" (Marcos, 09/08), agora uma caixa
        com as duas emissões (22/08). Mora aqui, e não em cada página, para não
        depender de alguém lembrar de repeti-la: quem renderiza as abas ganha a
        caixa de graça.

        A ação da tela em que já se está aparece apagada e sem link — some o
        clique que não leva a lugar nenhum, e a caixa continua mostrando que a
        outra emissão existe.
      */}
      <div className="mb-2 flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50/70 p-1 dark:border-blue-900/60 dark:bg-blue-950/30">
        <span className="px-2 text-[11px] font-semibold uppercase tracking-wider text-blue-700/80 dark:text-blue-300/80">
          Gerar
        </span>

        {noApresentacao ? (
          <span className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-blue-700/50 dark:text-blue-300/40">
            <Presentation className="h-4 w-4" />
            Apresentação
          </span>
        ) : (
          <Link
            href={ROTA_NOVA_APRESENTACAO}
            className="inline-flex items-center gap-1.5 rounded-md bg-white px-3 py-1.5 text-sm font-medium text-blue-700 shadow-sm transition-colors hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-300 dark:hover:bg-slate-700"
          >
            <Presentation className="h-4 w-4" />
            Apresentação
          </Link>
        )}

        {noFormulario ? (
          <span className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-blue-700/50 dark:text-blue-300/40">
            <FileText className="h-4 w-4" />
            Proposta
          </span>
        ) : (
          <Link
            href={ROTA_NOVA_PROPOSTA}
            className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <FileText className="h-4 w-4" />
            Proposta
          </Link>
        )}
      </div>
    </div>
  )
}
