'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command'
import { LayoutGrid, BarChart3, FileText, User, Search } from 'lucide-react'
import type { Demanda } from '@/app/dashboard/demandas/helpers'
import { STATUSES, ORIGINS } from '@/app/dashboard/demandas/helpers'

interface SearchCommandProps {
  demandas: Demanda[]
  onSelectDemanda: (d: Demanda) => void
  onNavigate: (path: string) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
  { label: 'Kanban', path: '/dashboard/demandas', icon: LayoutGrid },
  { label: 'Analises', path: '/dashboard/demandas/analises', icon: BarChart3 },
  { label: 'Logs', path: '/dashboard/logs', icon: FileText },
  { label: 'Perfil', path: '/dashboard/configuracoes/perfil', icon: User },
]

export function SearchCommand({
  demandas,
  onSelectDemanda,
  onNavigate,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: SearchCommandProps) {
  const [internalOpen, setInternalOpen] = useState(false)

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(!open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [open, setOpen])

  const handleSelectDemanda = useCallback(
    (d: Demanda) => {
      onSelectDemanda(d)
      setOpen(false)
    },
    [onSelectDemanda, setOpen]
  )

  const handleNavigate = useCallback(
    (path: string) => {
      onNavigate(path)
      setOpen(false)
    },
    [onNavigate, setOpen]
  )

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Buscar"
      description="Busque demandas ou navegue pelo sistema"
      className="rounded-xl shadow-2xl max-w-lg mx-auto !top-[30%] !translate-y-0"
      showCloseButton={false}
    >
      <CommandInput placeholder="Buscar demandas, paginas..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Demandas">
          {demandas.map((d) => {
            const status = STATUSES.find((s) => s.id === d.status)
            const origin = ORIGINS.find((o) => o.id === d.origin)
            return (
              <CommandItem
                key={d.id}
                value={d.title}
                onSelect={() => handleSelectDemanda(d)}
                className="cursor-pointer"
              >
                <Search className="h-4 w-4 text-slate-400 shrink-0" />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-sm truncate">{d.title}</span>
                  <span className="text-xs text-slate-400">
                    {status?.icon} {status?.label} — {origin?.label}
                  </span>
                </div>
              </CommandItem>
            )
          })}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Navegacao">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.path}
              value={item.label}
              onSelect={() => handleNavigate(item.path)}
              className="cursor-pointer"
            >
              <item.icon className="h-4 w-4 text-slate-400" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
