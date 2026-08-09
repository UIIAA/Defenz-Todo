'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

/**
 * Navegação dos 3 pilares do Portal (spec §4: POPs · Biblioteca · IA Defenz).
 *
 * Nenhuma aba morta: cada uma aqui já leva a uma tela viva. A regra da spec-mãe
 * ("aba morta é promessa quebrada") vale — só entra na lista quando a fase existe.
 */
const ABAS = [
  { href: '/dashboard/portal', label: 'POPs' },
  { href: '/dashboard/portal/biblioteca', label: 'Biblioteca' },
  { href: '/dashboard/portal/ia', label: 'IA Defenz' },
] as const

export function PortalTabs() {
  const pathname = usePathname() || ''

  return (
    <div className="flex gap-6 border-b border-slate-200 dark:border-slate-700/50">
      {ABAS.map((aba) => {
        // `/dashboard/portal` é prefixo de todas — só casa exato; as outras casam por prefixo
        // para que as telas de detalhe (ex.: /pops/[id]) mantenham a aba certa acesa.
        const ativa =
          aba.href === '/dashboard/portal'
            ? pathname === aba.href || pathname.startsWith('/dashboard/portal/pops')
            : pathname.startsWith(aba.href)

        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={
              ativa
                ? '-mb-px border-b-2 border-blue-600 pb-2 text-sm font-medium text-slate-900 dark:border-blue-400 dark:text-white'
                : 'pb-2 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }
          >
            {aba.label}
          </Link>
        )
      })}
    </div>
  )
}
