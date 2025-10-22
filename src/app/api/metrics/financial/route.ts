import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createFinancialMetricSchema } from '@/lib/validations/metrics';
import { handleApiError, createdResponse, ApiError } from '@/lib/api-helpers';

/**
 * GET /api/metrics/financial
 *
 * Retorna métricas financeiras (ARR, EBITDA, MRR, Growth)
 *
 * Query params:
 * - limit: número de registros (padrão: 12 meses)
 * - startDate: filtro de data inicial (YYYY-MM-01)
 * - endDate: filtro de data final (YYYY-MM-01)
 * - version: versão específica dos dados (padrão: última versão)
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      throw new ApiError('Não autorizado', 401);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '12', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const version = searchParams.get('version') ? parseInt(searchParams.get('version')!, 10) : undefined;

    // Build filter
    const where: any = {};

    if (startDate || endDate) {
      where.period = {};
      if (startDate) where.period.gte = new Date(startDate);
      if (endDate) where.period.lte = new Date(endDate);
    }

    if (version !== undefined) {
      where.version = version;
    }

    const metrics = await db.financialMetric.findMany({
      where,
      orderBy: [
        { period: 'desc' },
        { version: 'desc' }
      ],
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Calcular agregados úteis
    const summary = {
      count: metrics.length,
      latestPeriod: metrics[0]?.period || null,
      latestArr: metrics[0]?.arr || 0,
      latestEbitdaMargin: metrics[0]?.ebitdaMargin || 0,
      latestRuleOf40: metrics[0]?.ruleOf40Score || 0,
      avgArrGrowth: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + Number(m.arrGrowthRate), 0) / metrics.length
        : 0
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      summary,
      count: metrics.length
    });
  } catch (error) {
    console.error('Error fetching financial metrics:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/metrics/financial
 *
 * Cria nova métrica financeira
 *
 * Body: CreateFinancialMetricInput
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError('Não autorizado', 401);
    }

    if (!user.id) {
      throw new ApiError('ID de usuário inválido', 400);
    }

    // Parse e validar dados com Zod
    const body = await request.json();
    const validatedData = createFinancialMetricSchema.parse(body);

    // Converter period string para Date
    const periodDate = new Date(validatedData.period);

    // Buscar última versão (query única, sem N+1)
    const lastVersion = await db.financialMetric.findFirst({
      where: { period: periodDate },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    const version = lastVersion ? lastVersion.version + 1 : 1;

    const metric = await db.financialMetric.create({
      data: {
        // Período
        period: periodDate,

        // ARR Metrics
        mrr: validatedData.mrr,
        arr: validatedData.arr,
        newMrr: validatedData.newMrr,
        expansionMrr: validatedData.expansionMrr,
        contractionMrr: validatedData.contractionMrr,
        churnedMrr: validatedData.churnedMrr,
        netNewMrr: validatedData.netNewMrr,

        // Growth
        mrrGrowthRate: validatedData.mrrGrowthRate,
        arrGrowthRate: validatedData.arrGrowthRate,

        // EBITDA
        revenue: validatedData.revenue,
        cogs: validatedData.cogs,
        operatingExpenses: validatedData.operatingExpenses,
        ebitda: validatedData.ebitda,
        ebitdaMargin: validatedData.ebitdaMargin,

        // Gross Margin
        grossProfit: validatedData.grossProfit,
        grossMargin: validatedData.grossMargin,

        // Burn Rate & Runway
        burnRate: validatedData.burnRate,
        cashBalance: validatedData.cashBalance,
        runway: validatedData.runway,

        // Rule of 40
        ruleOf40Score: validatedData.ruleOf40Score,

        // Audit Trail
        userId: user.id,
        source: validatedData.source || 'manual',
        notes: validatedData.notes,
        version
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return createdResponse(metric, 'Métrica financeira criada com sucesso');
  } catch (error) {
    console.error('Error creating financial metric:', error);
    return handleApiError(error);
  }
}
