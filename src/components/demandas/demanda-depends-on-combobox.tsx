'use client'

import { useState, useEffect } from 'react'
import { Check, X, ChevronsUpDown } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'

export interface DemandaOption {
  id: string
  title: string
}

interface Props {
  /** id da demanda em edição (para excluir auto-referência); undefined em demanda nova */
  demandaId?: string
  value: string[]
  onChange: (ids: string[]) => void
  disabled?: boolean
  /** abre a demanda da dependência clicada (navegação) */
  onOpen?: (id: string) => void
}

export function DemandaDependsOnCombobox({ demandaId, value, onChange, disabled, onOpen }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [allDemandas, setAllDemandas] = useState<DemandaOption[]>([])

  const debouncedQuery = useDebounce(query, 200)

  useEffect(() => {
    fetch('/api/demandas')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setAllDemandas(
            (d.data as { id: string; title: string }[]).map((x) => ({ id: x.id, title: x.title }))
          )
        }
      })
      .catch(() => {})
  }, [])

  const candidates = allDemandas.filter((x) => {
    if (x.id === demandaId) return false
    if (value.includes(x.id)) return false
    if (!debouncedQuery.trim()) return true
    return x.title.toLowerCase().includes(debouncedQuery.toLowerCase())
  })

  const selected = allDemandas.filter((x) => value.includes(x.id))

  const remove = (id: string) => onChange(value.filter((v) => v !== id))

  const add = (id: string) => {
    onChange([...value, id])
    setQuery('')
    setOpen(false)
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((x) => (
            <Badge
              key={x.id}
              variant="secondary"
              className="gap-1 pr-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/15"
            >
              {onOpen ? (
                <button
                  type="button"
                  onClick={() => onOpen(x.id)}
                  className="max-w-[180px] truncate text-xs hover:underline cursor-pointer text-left"
                  title={`Abrir: ${x.title}`}
                >
                  {x.title}
                </button>
              ) : (
                <span className="max-w-[180px] truncate text-xs">{x.title}</span>
              )}
              <button
                type="button"
                onClick={() => remove(x.id)}
                disabled={disabled}
                className="rounded hover:bg-blue-500/20 p-0.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                aria-label={`Remover dependência ${x.title}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="w-full justify-between bg-white/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/30 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 h-9 text-sm font-normal"
          >
            {selected.length === 0
              ? 'Buscar demandas...'
              : `${selected.length} dependência${selected.length > 1 ? 's' : ''} selecionada${selected.length > 1 ? 's' : ''}`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[400px] max-w-[calc(100vw-3rem)] p-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-white/50 dark:border-slate-700/30"
          align="start"
        >
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por título..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty className="py-4 text-center text-sm text-slate-400">
                Nenhuma demanda encontrada
              </CommandEmpty>
              <CommandGroup>
                {candidates.map((x) => (
                  <CommandItem
                    key={x.id}
                    value={x.id}
                    onSelect={() => add(x.id)}
                    className="cursor-pointer text-slate-700 dark:text-slate-200"
                  >
                    <Check className={cn('mr-2 h-4 w-4 opacity-0')} />
                    <span className="truncate">{x.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
