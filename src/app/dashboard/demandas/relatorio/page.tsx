'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FileText, Sparkles, Copy, Printer, Check, ChevronLeft, ChevronRight, Presentation, BookOpen, TrendingUp, Target, AlertTriangle, BarChart3, Star } from 'lucide-react'
import { toast } from 'sonner'

interface AreaEntrega {
  area: string
  entregas: string[]
  destaque: string
}

interface ReportData {
  resumo: string
  areaEntregas: AreaEntrega[]
  metricas: {
    total: number
    porArea: { area: string; count: number }[]
    porResponsavel: { nome: string; count: number }[]
    subtarefasConcluidas: number
  }
  destaques: string[]
  observacoes: string[]
}

type ViewMode = 'document' | 'slides'

const AREA_COLORS: Record<string, string> = {
  tecnologia: '#06b6d4',
  marketing: '#ec4899',
  vendas: '#f59e0b',
  financeiro: '#10b981',
  operacional: '#6366f1',
  administrativo: '#8b5cf6',
  juridico: '#64748b',
  rh: '#f97316',
  estrategico: '#ef4444',
  comercial: '#f59e0b',
}

function getAreaColor(area: string) {
  const key = area.toLowerCase().replace(/\s/g, '')
  for (const [k, v] of Object.entries(AREA_COLORS)) {
    if (key.includes(k)) return v
  }
  return '#6366f1'
}

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
  const [report, setReport] = useState<ReportData | null>(null)
  const [demandaCount, setDemandaCount] = useState(0)
  const [periodLabel, setPeriodLabel] = useState('')
  const [generating, setGenerating] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('slides')
  const [currentSlide, setCurrentSlide] = useState(0)
  const [copied, setCopied] = useState(false)

  const userRole = (session?.user as { role?: string })?.role || ''
  const companyName = (session?.user as { companyName?: string })?.companyName || 'Defenz'
  const isAdmin = userRole === 'admin'
  const isAdminOrGerencia = ['admin', 'gerencia'].includes(userRole)

  useEffect(() => {
    if (session && !isAdminOrGerencia) router.push('/dashboard/demandas')
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

  const totalSlides = report ? 4 + (report.observacoes.length > 0 ? 1 : 0) : 0

  const handleGenerate = async () => {
    setGenerating(true)
    setReport(null)
    setCurrentSlide(0)
    try {
      const body: Record<string, string> = { period }
      if (period === 'custom') {
        if (!startDate) { toast.error('Selecione a data inicial'); setGenerating(false); return }
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
      if (json.success && json.data.report) {
        setReport(json.data.report)
        setDemandaCount(json.data.demandaCount || 0)
        setPeriodLabel(json.data.period || '')
      } else if (json.success && !json.data.report) {
        toast.info(json.data.message || 'Nenhuma demanda no periodo')
      } else {
        toast.error(json.error || 'Erro ao gerar relatorio')
      }
    } catch { toast.error('Erro ao gerar relatorio') }
    finally { setGenerating(false) }
  }

  const handleCopy = async () => {
    if (!report) return
    const text = [
      `RELATORIO EXECUTIVO — ${companyName}`,
      `Periodo: ${periodLabel}\n`,
      `RESUMO\n${report.resumo}\n`,
      ...report.areaEntregas.map(a => `${a.area.toUpperCase()}\n${a.entregas.map(e => `- ${e}`).join('\n')}\nDestaque: ${a.destaque}`),
      `\nMETRICAS\nTotal: ${report.metricas.total} demandas | ${report.metricas.subtarefasConcluidas} subtarefas`,
      ...report.destaques.map(d => `★ ${d}`),
      report.observacoes.length > 0 ? `\nOBSERVACOES\n${report.observacoes.map(o => `- ${o}`).join('\n')}` : '',
    ].filter(Boolean).join('\n')
    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copiado!')
    setTimeout(() => setCopied(false), 2000)
  }

  const nextSlide = () => setCurrentSlide((p) => Math.min(p + 1, totalSlides - 1))
  const prevSlide = () => setCurrentSlide((p) => Math.max(p - 1, 0))

  useEffect(() => {
    if (viewMode !== 'slides' || !report) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); nextSlide() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prevSlide() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [viewMode, report, totalSlides])

  if (!isAdminOrGerencia) return null

  // ─── SLIDE COMPONENTS ───

  const SlideWrapper = ({ children, slideNum }: { children: React.ReactNode; slideNum: number }) => (
    <div className="relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-2xl overflow-hidden" style={{ minHeight: 500 }}>
      <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />
      <div className="absolute top-5 right-6 text-[10px] font-mono text-slate-300 dark:text-slate-600">
        {slideNum + 1}/{totalSlides}
      </div>
      <div className="p-10 sm:p-14 flex flex-col min-h-[460px]">
        {children}
      </div>
      <div className="absolute bottom-0 left-0 right-0 px-8 py-3 flex items-center justify-between text-[10px] text-slate-300 dark:text-slate-600 border-t border-slate-100 dark:border-slate-800">
        <span className="font-semibold tracking-wider uppercase">{companyName}</span>
        <span>{new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</span>
      </div>
    </div>
  )

  const SlideCover = () => (
    <SlideWrapper slideNum={0}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
          <BarChart3 className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 dark:text-slate-100 mb-3">
          Relatorio Executivo
        </h1>
        <p className="text-lg text-slate-400 mb-8">{companyName} — {periodLabel}</p>
        <div className="flex items-center gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{report?.metricas.total}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Entregas</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <Check className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{report?.metricas.subtarefasConcluidas}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Subtarefas</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{report?.metricas.porArea.length}</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Areas</div>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  )

  const SlideResumo = () => (
    <SlideWrapper slideNum={1}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
          <FileText className="h-5 w-5 text-blue-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Resumo Executivo</h2>
      </div>
      <div className="flex-1">
        <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[15px] whitespace-pre-line">
          {report?.resumo}
        </p>
      </div>
    </SlideWrapper>
  )

  const SlideEntregas = () => (
    <SlideWrapper slideNum={2}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
          <Target className="h-5 w-5 text-indigo-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Entregas por Area</h2>
      </div>
      <div className="flex-1 grid gap-4 sm:grid-cols-2">
        {report?.areaEntregas.map((area, i) => {
          const color = getAreaColor(area.area)
          return (
            <div key={i} className="rounded-xl border border-slate-100 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-800/30">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{area.area}</span>
                <span className="text-[10px] ml-auto px-1.5 py-0.5 rounded-full font-semibold" style={{ background: color + '18', color }}>
                  {area.entregas.length}
                </span>
              </div>
              <ul className="space-y-1 mb-2">
                {area.entregas.map((e, j) => (
                  <li key={j} className="text-xs text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                    <span className="text-slate-300 mt-0.5">•</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
              <p className="text-[11px] font-medium italic" style={{ color }}>
                {area.destaque}
              </p>
            </div>
          )
        })}
      </div>
    </SlideWrapper>
  )

  const SlideMetricas = () => (
    <SlideWrapper slideNum={3}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-emerald-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Metricas & Destaques</h2>
      </div>
      <div className="flex-1 space-y-6">
        {/* Bar chart */}
        {report && report.metricas.porArea.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Distribuicao por Area</h3>
            {report.metricas.porArea.map((a, i) => {
              const pct = (a.count / report.metricas.total) * 100
              const color = getAreaColor(a.area)
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 dark:text-slate-400 w-28 text-right truncate">{a.area}</span>
                  <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500 flex items-center pl-2" style={{ width: `${Math.max(pct, 8)}%`, backgroundColor: color }}>
                      <span className="text-[10px] font-bold text-white">{a.count}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 w-10">{Math.round(pct)}%</span>
                </div>
              )
            })}
          </div>
        )}
        {/* Responsaveis */}
        {report && report.metricas.porResponsavel.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Por Responsavel</h3>
            <div className="flex flex-wrap gap-2">
              {report.metricas.porResponsavel.map((r, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">{r.nome}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold">{r.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
        {/* Destaques */}
        {report && report.destaques.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Destaques</h3>
            <div className="space-y-1.5">
              {report.destaques.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Star className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </SlideWrapper>
  )

  const SlideObservacoes = () => (
    <SlideWrapper slideNum={4}>
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Observacoes</h2>
      </div>
      <div className="flex-1 space-y-3">
        {report?.observacoes.map((o, i) => (
          <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
            <div className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-amber-600">{i + 1}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{o}</p>
          </div>
        ))}
      </div>
    </SlideWrapper>
  )

  const slideComponents = report ? [
    <SlideCover key="cover" />,
    <SlideResumo key="resumo" />,
    <SlideEntregas key="entregas" />,
    <SlideMetricas key="metricas" />,
    ...(report.observacoes.length > 0 ? [<SlideObservacoes key="obs" />] : []),
  ] : []

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
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
                <SelectTrigger className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"><SelectValue /></SelectTrigger>
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
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100" />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">Ate</label>
                  <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100" />
                </div>
              </>
            )}
            {isAdmin && companies.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">Empresa</label>
                <Select value={filterCompany} onValueChange={setFilterCompany}>
                  <SelectTrigger className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="all">Todas</SelectItem>
                    {companies.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {teams.length > 0 && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 block">Equipe</label>
                <Select value={filterTeam} onValueChange={setFilterTeam}>
                  <SelectTrigger className="bg-white/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                    <SelectItem value="all">Todas</SelectItem>
                    {teams.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleGenerate} disabled={generating} className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer">
              {generating ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Gerando com IA...
                </span>
              ) : (
                <><Sparkles className="h-4 w-4 mr-1.5" />Gerar Relatorio</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {report && (
        <>
          {/* Toolbar */}
          <div className="flex items-center justify-between print:hidden">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('slides')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${viewMode === 'slides' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Presentation className="h-3.5 w-3.5" />
                Slides
              </button>
              <button
                onClick={() => setViewMode('document')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors cursor-pointer ${viewMode === 'document' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                Documento
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 mr-2">{demandaCount} demanda{demandaCount !== 1 ? 's' : ''}</span>
              <Button variant="outline" size="sm" onClick={handleCopy} className="cursor-pointer">
                {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                {copied ? 'Copiado' : 'Copiar'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.print()} className="cursor-pointer">
                <Printer className="h-3.5 w-3.5 mr-1" />
                Imprimir
              </Button>
            </div>
          </div>

          {/* Slides View */}
          {viewMode === 'slides' && (
            <div className="space-y-4">
              {slideComponents[currentSlide]}

              <div className="flex items-center justify-center gap-4 print:hidden">
                <Button variant="outline" size="sm" onClick={prevSlide} disabled={currentSlide === 0} className="cursor-pointer">
                  <ChevronLeft className="h-4 w-4 mr-1" />Anterior
                </Button>
                <div className="flex items-center gap-1.5">
                  {slideComponents.map((_, i) => (
                    <button key={i} onClick={() => setCurrentSlide(i)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${i === currentSlide ? 'w-6 bg-purple-500' : 'w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400'}`} />
                  ))}
                </div>
                <Button variant="outline" size="sm" onClick={nextSlide} disabled={currentSlide === totalSlides - 1} className="cursor-pointer">
                  Proximo<ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <p className="text-center text-xs text-slate-400 print:hidden">Setas do teclado para navegar</p>
            </div>
          )}

          {/* Document View */}
          {viewMode === 'document' && (
            <div className="space-y-4 print:space-y-2">
              {slideComponents.map((slide, i) => (
                <div key={i}>{slide}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
