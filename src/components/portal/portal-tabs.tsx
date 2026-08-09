'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText } from 'lucide-react'

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
 * A AÇÃO ("Nova proposta") continua sendo botão, à direita e sempre à mostra.
 * Aba é lugar, botão é ação; misturar os dois é o que produz menu confuso.
 */
const ABAS = [
  { href: '/dashboard/portal', label: 'POPs' },
  { href: '/dashboard/portal/biblioteca', label: 'Biblioteca' },
  { href: '/dashboard/portal/ia', label: 'IA Defenz' },
  { href: '/dashboard/portal/propostas', label: 'Propostas' },
] as const

/** Formulário de emissão. Note o singular — `/proposta`, não `/propostas`. */
const ROTA_NOVA_PROPOSTA = '/dashboard/portal/proposta'

export function PortalTabs() {
  const pathname = usePathname() || ''

  // Comparação EXATA. `startsWith` aqui casaria também `/propostas` (o log) e
  // esconderia o botão justamente na tela onde ele é mais útil.
  const noFormulario = pathname === ROTA_NOVA_PROPOSTA

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
          const acesa = aba.href === '/dashboard/portal/propostas' ? ativa || noFormulario : ativa

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
        "Como se fosse um botão sempre à mostra chamado Proposta" (Marcos, 09/08).
        Mora aqui, e não em cada página, justamente para não depender de alguém
        lembrar de repeti-lo: quem renderiza as abas ganha o botão de graça.
      */}
      {!noFormulario && (
        <Link
          href={ROTA_NOVA_PROPOSTA}
          className="mb-2 inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
        >
          <FileText className="h-4 w-4" />
          Nova proposta
        </Link>
      )}
    </div>
  )
}
