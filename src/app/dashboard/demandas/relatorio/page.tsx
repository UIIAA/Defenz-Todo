'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Sparkles, Copy, Printer, Check } from 'lucide-react'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'

export default function RelatorioPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [period, setPeriod] = useState('7d')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [filterCompany, setFilterCompany] = useState('all')
  const [filterTeam, setFilterTeam] = useState('all')
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([])
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([])
  const [markdown, setMarkdown] = useState('')
  const [demandaCount, setDemandaCount] = useState(0)
  const [generating, setGenerating] = useState(false)
  const [copied, setCopied] = useState(false)

  const userRole = (session?.user as { role?: string })?.role || ''
  const isAdmin = userRole === 'admin'
  const isAdminOrGerencia = ['admin', 'gerencia'].includes(userRole)

  useEffect(() => {
    if (session && !isAdminOrGerencia) {
      router.push('/dashboard/demandas')
    }
  }, [session, isAdminOrGerencia, router])

  useEffect(() => {
    if (!isAdminOrGerencia) return
    const fetchFilters = async () => {
      try {
        const [teamsRes, companiesRes] = await Promise.all([
          fetch('/api/teams'),
          isAdmin ? fetch('/api/companies') : Promise.resolve(null),
        ])
        const teamsData = await teamsRes.json()
        if (teamsData.success) setTeams(teamsData.data)
        if (companiesRes) {
          const companiesData = await companiesRes.json()
          if (companiesData.success) setCompanies(companiesData.data)
        }
      } catch {}
    }
    fetchFilters()
  }, [isAdmin, isAdminOrGerencia])

  const handleGenerate = async () => {
    setGenerating(true)
    setMarkdown('')
    try {
      const body: Record<string, string> = { period }
      if (period === 'custom') {
        if (!startDate) {
          toast.error('Selecione a data inicial')
          setGenerating(false)
          return
        }
        body.startDate = startDate
        if (endDate) body.endDate = endDate
      }
      if (isAdmin && filterCompany !== 'all') body.companyId = filterCompany
      if (filterTeam !== 'all') body.teamId = filterTeam

      const res = await fetch('/api/report/executive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (json.success) {
        setMarkdown(json.data.markdown)
        setDemandaCount(json.data.demandaCount || 0)
      } else {
        toast.error(json.error || 'Erro ao gerar relatorio')
      }
    } catch {
      toast.error('Erro ao gerar relatorio')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    toast.success('Relatorio copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  if (!isAdminOrGerencia) return null

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Relatorio Executivo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gere um relatorio com IA a partir das demandas concluidas</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">Periodo</label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <SelectItem value="7d">Ultimos 7 dias</SelectItem>
                  <SelectItem value="14d">Ultimos 14 dias</SelectItem>
                  <SelectItem value="30d">Ultimos 30 dias</SelectItem>
                  <SelectItem value="60d">Ultimos 60 dias</SelectItem>
                  <SelectItem value="90d">Ultimos 90 dias</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === 'custom' && (
              <>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">De</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">Ate</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </>
            )}

            {isAdmin && companies.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">Empresa</label>
                <Select value={filterCompany} onValueChange={setFilterCompany}>
                  <SelectTrigger className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="all">Todas</SelectItem>
                    {companies.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {teams.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">Equipe</label>
                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="all">Todas</SelectItem>
                    {teams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Gerando com IA...
                </span>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-1.5" />
                  Gerar Relatorio
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {markdown && (
        <Card className="bg-white dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 print:border-none print:shadow-none">
          <CardHeader className="flex flex-row items-center justify-between print:hidden">
            <CardTitle className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Relatorio Gerado
              {demandaCount > 0 && (
                <span className="text-sm font-normal text-slate-400">
                  ({demandaCount} demanda{demandaCount !== 1 ? 's' : ''})
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="cursor-pointer"
              >
                {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5 mr-1" />
                Imprimir
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-strong:text-slate-800 dark:prose-strong:text-slate-100 prose-li:text-slate-600 dark:prose-li:text-slate-300 prose-th:text-slate-500 prose-td:text-slate-600 dark:prose-td:text-slate-300">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
