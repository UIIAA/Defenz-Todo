'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Team {
  id: string
  name: string
  companyId: string
  company?: { name: string }
  _count: { members: number; demandas: number }
}

interface TeamSelectorProps {
  value: string
  onChange: (teamId: string) => void
  companyId?: string // Admin pode filtrar por empresa
  showAll?: boolean // Mostra opção "Todas equipes"
}

export function TeamSelector({ value, onChange, companyId, showAll = true }: TeamSelectorProps) {
  const [teams, setTeams] = useState<Team[]>([])

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const params = new URLSearchParams()
        if (companyId && companyId !== 'all') {
          params.set('companyId', companyId)
        }
        const url = `/api/teams${params.toString() ? `?${params}` : ''}`
        const res = await fetch(url)
        const json = await res.json()
        if (json.success) {
          setTeams(json.data)
        }
      } catch (err) {
        console.error('Erro ao carregar equipes:', err)
      }
    }
    fetchTeams()
  }, [companyId])

  if (teams.length === 0) return null

  // User com uma única equipe e sem opção "todas": não renderiza
  if (!showAll && teams.length === 1) return null

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] h-9 text-xs">
        <SelectValue placeholder="Equipe" />
      </SelectTrigger>
      <SelectContent>
        {showAll && <SelectItem value="all">Todas equipes</SelectItem>}
        {teams.map((t) => (
          <SelectItem key={t.id} value={t.id}>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0 bg-blue-500" />
              {t.name}
              <span className="text-muted-foreground">({t._count.members})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
