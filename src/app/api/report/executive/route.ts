import { NextRequest } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'

const VALID_PERIODS = ['7d', '14d', '30d', '60d', '90d', 'custom'] as const

function getPeriodDates(period: string, startDate?: string, endDate?: string) {
  const end = endDate ? new Date(endDate) : new Date()
  end.setHours(23, 59, 59, 999)

  if (period === 'custom') {
    if (!startDate) throw new ApiError('startDate obrigatorio para periodo custom', 400)
    const start = new Date(startDate)
    start.setHours(0, 0, 0, 0)
    return { start, end }
  }

  const days = parseInt(period)
  const start = new Date(end)
  start.setDate(start.getDate() - days)
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

function buildPrompt(demandas: Array<{
  title: string
  description: string | null
  classification: string | null
  assignee: string | null
  dateDone: Date | null
  subtasks: Array<{ title: string; completed: boolean }>
  links: Array<{ label: string; url: string }>
}>, periodLabel: string): string {
  const context = demandas.map((d, i) => {
    const subtaskInfo = d.subtasks.length > 0
      ? `Subtarefas: ${d.subtasks.filter(s => s.completed).length}/${d.subtasks.length}`
      : ''
    return [
      `${i + 1}. ${d.title}`,
      d.description ? `   Desc: ${d.description.slice(0, 200)}` : '',
      d.classification ? `   Area: ${d.classification}` : '',
      d.assignee ? `   Resp: ${d.assignee}` : '',
      subtaskInfo ? `   ${subtaskInfo}` : '',
    ].filter(Boolean).join('\n')
  }).join('\n')

  return `Analise estas ${demandas.length} demandas concluidas (${periodLabel}) e retorne APENAS um JSON valido, sem markdown, sem backticks.

O JSON deve ter esta estrutura exata:
{
  "resumo": "2-3 paragrafos com visao geral do que foi entregue no periodo",
  "areaEntregas": [
    { "area": "Nome da Area", "entregas": ["entrega 1", "entrega 2"], "destaque": "frase curta do principal resultado" }
  ],
  "metricas": {
    "total": numero,
    "porArea": [{ "area": "nome", "count": numero }],
    "porResponsavel": [{ "nome": "nome", "count": numero }],
    "subtarefasConcluidas": numero
  },
  "destaques": ["frase 1 sobre entrega relevante", "frase 2"],
  "observacoes": ["ponto de atencao 1", "ponto 2"]
}

Regras:
- Portugues brasileiro, tom executivo
- Nao invente dados
- Se nao houver observacoes, retorne array vazio
- Agrupe por classificacao/area das demandas
- Seja preciso nos numeros

Dados:
${context}`
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user?.id) throw new ApiError('Nao autorizado', 401)

    if (!['admin', 'gerencia'].includes(user.role)) {
      throw new ApiError('Sem permissao', 403)
    }

    const body = await request.json()
    const { period, startDate, endDate, companyId, teamId } = body as {
      period?: string; startDate?: string; endDate?: string; companyId?: string; teamId?: string
    }

    if (!period || !VALID_PERIODS.includes(period as typeof VALID_PERIODS[number])) {
      throw new ApiError('Periodo invalido. Use: 7d, 14d, 30d, 60d, 90d ou custom', 400)
    }

    const { start, end } = getPeriodDates(period, startDate, endDate)

    const where: Record<string, unknown> = {
      status: 'concluida',
      dateDone: { gte: start, lte: end },
    }

    if (user.role === 'admin') {
      if (companyId && companyId !== 'all') where.companyId = companyId
      if (teamId && teamId !== 'all') where.teamId = teamId
    } else {
      where.companyId = user.companyId
      if (teamId && teamId !== 'all') where.teamId = teamId
    }

    const demandas = await db.demanda.findMany({
      where,
      orderBy: { dateDone: 'desc' },
      include: {
        subtasks: { select: { title: true, completed: true } },
        links: { select: { label: true, url: true } },
      },
    })

    const periodLabel = period === 'custom'
      ? `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`
      : `ultimos ${period.replace('d', ' dias')}`

    if (demandas.length === 0) {
      return successResponse({
        report: null,
        demandaCount: 0,
        period: periodLabel,
        message: 'Nenhuma demanda concluida no periodo',
      })
    }

    if (!process.env.GEMINI_API_KEY) {
      throw new ApiError('GEMINI_API_KEY nao configurada', 500)
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' })

    const prompt = buildPrompt(demandas, periodLabel)
    const result = await model.generateContent(prompt)
    const text = result.response.text()

    // Parse JSON — strip markdown fences if present
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    let report
    try {
      report = JSON.parse(cleaned)
    } catch {
      // Fallback: return raw text as resumo if JSON parse fails
      report = {
        resumo: cleaned,
        areaEntregas: [],
        metricas: { total: demandas.length, porArea: [], porResponsavel: [], subtarefasConcluidas: 0 },
        destaques: [],
        observacoes: [],
      }
    }

    return successResponse({ report, demandaCount: demandas.length, period: periodLabel })
  } catch (error) {
    return handleApiError(error)
  }
}
