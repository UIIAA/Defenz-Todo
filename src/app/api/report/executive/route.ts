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
      ? `Subtarefas: ${d.subtasks.filter(s => s.completed).length}/${d.subtasks.length} concluidas`
      : ''
    const linksInfo = d.links.length > 0
      ? `Links: ${d.links.map(l => l.label).join(', ')}`
      : ''
    return [
      `${i + 1}. **${d.title}**`,
      d.description ? `   Descricao: ${d.description.slice(0, 300)}` : '',
      d.classification ? `   Area: ${d.classification}` : '',
      d.assignee ? `   Responsavel: ${d.assignee}` : '',
      d.dateDone ? `   Concluida em: ${d.dateDone.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}` : '',
      subtaskInfo ? `   ${subtaskInfo}` : '',
      linksInfo ? `   ${linksInfo}` : '',
    ].filter(Boolean).join('\n')
  }).join('\n\n')

  return `Voce e um analista de negocios gerando um relatorio executivo profissional.

Com base nas ${demandas.length} demandas concluidas no periodo de ${periodLabel}, gere um relatorio executivo em portugues brasileiro formatado em Markdown.

O relatorio deve conter:

## Estrutura
1. **Resumo Executivo** — 2-3 paragrafos com visao geral do que foi entregue
2. **Entregas por Area** — agrupe por classificacao/area, destaque as principais entregas
3. **Metricas de Execucao** — total de tarefas, distribuicao por area, por responsavel
4. **Destaques** — entregas mais relevantes ou complexas (com muitas subtarefas ou links)
5. **Observacoes** — pontos de atencao se houver (tarefas sem descricao, subtarefas incompletas)

## Regras
- Tom profissional e objetivo, adequado para stakeholders e diretoria
- Use bullet points e tabelas quando apropriado
- Nao invente informacoes — use apenas os dados fornecidos
- Se uma area nao tiver tarefas, nao mencione
- Numeros e metricas devem ser precisos

## Dados das Demandas Concluidas

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
      period?: string
      startDate?: string
      endDate?: string
      companyId?: string
      teamId?: string
    }

    if (!period || !VALID_PERIODS.includes(period as typeof VALID_PERIODS[number])) {
      throw new ApiError('Periodo invalido. Use: 7d, 14d, 30d, 60d, 90d ou custom', 400)
    }

    const { start, end } = getPeriodDates(period, startDate, endDate)

    // Role-based filtering
    const where: Record<string, unknown> = {
      status: 'concluida',
      dateDone: { gte: start, lte: end },
    }

    if (user.role === 'admin') {
      if (companyId && companyId !== 'all') where.companyId = companyId
      if (teamId && teamId !== 'all') where.teamId = teamId
    } else {
      // Gerencia: only own company
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

    if (demandas.length === 0) {
      return successResponse(
        { markdown: `# Relatorio Executivo\n\nNenhuma demanda concluida encontrada no periodo selecionado (${period === 'custom' ? `${startDate} a ${endDate}` : `ultimos ${period.replace('d', ' dias')}`}).` },
        'Nenhuma demanda no periodo'
      )
    }

    // Generate with Gemini
    if (!process.env.GEMINI_API_KEY) {
      throw new ApiError('GEMINI_API_KEY nao configurada', 500)
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const periodLabel = period === 'custom'
      ? `${start.toLocaleDateString('pt-BR')} a ${end.toLocaleDateString('pt-BR')}`
      : `ultimos ${period.replace('d', ' dias')}`

    const prompt = buildPrompt(demandas, periodLabel)

    const result = await model.generateContent(prompt)
    const markdown = result.response.text()

    return successResponse({ markdown, demandaCount: demandas.length, period: periodLabel })
  } catch (error) {
    return handleApiError(error)
  }
}
