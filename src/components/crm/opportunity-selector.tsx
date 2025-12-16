'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { searchOpportunities } from '@/actions/crm'
import { useDebounce } from '@/hooks/use-debounce' // Assuming this exists or I'll implement simple debounce

// Interface based on what searchOpportunities returns
interface Opportunity {
    id: string
    title: string
    status: string
    client: { name: string } | null
}

interface OpportunitySelectorProps {
    selectedIds: string[]
    onSelect: (ids: string[]) => void
}

export function OpportunitySelector({ selectedIds, onSelect }: OpportunitySelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState('')
    const [opportunities, setOpportunities] = React.useState<Opportunity[]>([])
    const [loading, setLoading] = React.useState(false)

    // Local cache of selected items to display even if not in current search results
    const [selectedCache, setSelectedCache] = React.useState<Opportunity[]>([])

    // Load initial selected items if needed? 
    // Ideally passed from parent if editing, but for now we rely on search to find them 
    // or we need a way to fetch them by IDs. 
    // For simplicity MVP: we only search. 
    // Improvement: Accept `initialSelected` prop with full objects.

    const handleSearch = React.useCallback(async (value: string) => {
        setLoading(true)
        try {
            const results = await searchOpportunities(value)
            setOpportunities(results)
        } catch (error) {
            console.error('Error searching opportunities:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            handleSearch(query)
        }, 300)
        return () => clearTimeout(timer)
    }, [query, handleSearch])

    const handleSelect = (id: string, opportunity: Opportunity) => {
        const newSelected = selectedIds.includes(id)
            ? selectedIds.filter(i => i !== id)
            : [...selectedIds, id]

        onSelect(newSelected)

        // Update cache
        if (!selectedIds.includes(id)) {
            if (!selectedCache.find(o => o.id === id)) {
                setSelectedCache(prev => [...prev, opportunity])
            }
        }
    }

    // Combine opportunities from search and cache for display
    const displayOpportunities = React.useMemo(() => {
        const map = new Map<string, Opportunity>()
        selectedCache.forEach(o => map.set(o.id, o))
        opportunities.forEach(o => map.set(o.id, o))
        return Array.from(map.values())
    }, [opportunities, selectedCache])

    // Get count of selected
    const selectedCount = selectedIds.length

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        {selectedCount > 0
                            ? `${selectedCount} oportunidade(s) vinculada(s)`
                            : "Vincular ao CRM (Opcional)"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Buscar oportunidades..."
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            {loading && <div className="p-2 text-sm text-muted-foreground text-center">Buscando...</div>}
                            {!loading && displayOpportunities.length === 0 && (
                                <CommandEmpty>Nenhuma oportunidade encontrada.</CommandEmpty>
                            )}
                            <CommandGroup heading="Resultados">
                                {displayOpportunities.map((opp) => (
                                    <CommandItem
                                        key={opp.id}
                                        value={opp.id}
                                        onSelect={() => handleSelect(opp.id, opp)}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedIds.includes(opp.id) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        <div className="flex flex-col">
                                            <span>{opp.title}</span>
                                            <span className="text-xs text-muted-foreground">
                                                {opp.client?.name} • {opp.status}
                                            </span>
                                        </div>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Selected tags display */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                    {selectedIds.map(id => {
                        const opp = displayOpportunities.find(o => o.id === id) || selectedCache.find(o => o.id === id)
                        if (!opp) return null // Should ideally fetch missing labels
                        return (
                            <Badge key={id} variant="secondary" className="flex items-center gap-1">
                                {opp.title}
                                <button
                                    type="button"
                                    onClick={() => handleSelect(id, opp)}
                                    className="ml-1 hover:text-destructive"
                                >
                                    ×
                                </button>
                            </Badge>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
