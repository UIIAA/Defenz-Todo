import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createSalesMetricSchema } from '@/lib/validations/metrics';
import { handleApiError, createdResponse, ApiError } from '@/lib/api-helpers';

/**
 * GET /api/metrics/sales
 *
 * Retorna métricas de vendas (CAC, Funnel, Pipeline, Conversão)
 *
 * Query params:
 * - limit: número de registros (padrão: 12 meses)
 * - startDate: filtro de data inicial (YYYY-MM-01)
 * - endDate: filtro de data final (YYYY-MM-01)
 * - version: versão específica dos dados
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

    const metrics = await db.salesMetric.findMany({
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
      latestConversionRate: metrics[0]?.overallConversionRate || 0,
      latestBlendedCac: metrics[0]?.blendedCac || 0,
      latestPipelineValue: metrics[0]?.pipelineValue || 0,
      latestAvgDealSize: metrics[0]?.avgDealSize || 0,
      avgConversionRate: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + Number(m.overallConversionRate), 0) / metrics.length
        : 0,
      totalLeads: metrics.reduce((sum, m) => sum + m.leads, 0),
      totalClosedWon: metrics.reduce((sum, m) => sum + m.closedWon, 0)
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      summary,
      count: metrics.length
    });
  } catch (error) {
    console.error('Error fetching sales metrics:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/metrics/sales
 *
 * Cria nova métrica de vendas
 *
 * Body: CreateSalesMetricInput
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
    const validatedData = createSalesMetricSchema.parse(body);

    // Converter period string para Date
    const periodDate = new Date(validatedData.period);

    // Buscar última versão (query única, sem N+1)
    const lastVersion = await db.salesMetric.findFirst({
      where: { period: periodDate },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    const version = lastVersion ? lastVersion.version + 1 : 1;

    const metric = await db.salesMetric.create({
      data: {
        period: new Date(validatedData.period),

        // Sales Performance
        leads: validatedData.leads,
        qualifiedLeads: validatedData.qualifiedLeads,
        opportunities: validatedData.opportunities,
        closedWon: validatedData.closedWon,
        closedLost: validatedData.closedLost,

        // Conversion Rates
        leadToSqlRate: validatedData.leadToSqlRate,
        sqlToOpportunityRate: validatedData.sqlToOpportunityRate,
        opportunityToWinRate: validatedData.opportunityToWinRate,
        overallConversionRate: validatedData.overallConversionRate,

        // CAC Breakdown
        marketingSpend: validatedData.marketingSpend,
        salesSpend: validatedData.salesSpend,
        totalCacSpend: validatedData.totalCacSpend,
        blendedCac: validatedData.blendedCac,

        // Sales Cycle
        avgSalesCycleLength: validatedData.avgSalesCycleLength,
        avgDealSize: validatedData.avgDealSize,

        // Pipeline Health
        pipelineValue: validatedData.pipelineValue,
        pipelineCoverage: validatedData.pipelineCoverage,
        leadVelocityRate: validatedData.leadVelocityRate,

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

    return createdResponse(metric, 'Métrica de vendas criada com sucesso');
  } catch (error) {
    console.error('Error creating sales metric:', error);
    return handleApiError(error);
  }
}
