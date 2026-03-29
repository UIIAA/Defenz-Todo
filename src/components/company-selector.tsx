'use client'

import { useState, useEffect } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Company {
  id: string
  name: string
  _count: { users: number; teams: number }
}

interface CompanySelectorProps {
  value: string
  onChange: (companyId: string) => void
}

export function CompanySelector({ value, onChange }: CompanySelectorProps) {
  const [companies, setCompanies] = useState<Company[]>([])

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await fetch('/api/companies')
        const json = await res.json()
        if (json.success) {
          setCompanies(json.data)
        }
      } catch (err) {
        console.error('Erro ao carregar empresas:', err)
      }
    }
    fetchCompanies()
  }, [])

  if (companies.length <= 1) return null

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px] h-9 text-xs">
        <SelectValue placeholder="Empresa" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Todas empresas</SelectItem>
        {companies.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full shrink-0 bg-indigo-500" />
              {c.name}
              <span className="text-muted-foreground">({c._count.users})</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
