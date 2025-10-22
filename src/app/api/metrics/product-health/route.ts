import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createProductHealthMetricSchema } from '@/lib/validations/metrics';
import { handleApiError, createdResponse, ApiError } from '@/lib/api-helpers';

/**
 * GET /api/metrics/product-health
 *
 * Retorna métricas de saúde do produto (NPS, CSAT, Uptime, Bugs)
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

    const metrics = await db.productHealthMetric.findMany({
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
      latestNps: metrics[0]?.nps || 0,
      latestCsat: metrics[0]?.csat || 0,
      latestUptime: metrics[0]?.uptime || 0,
      latestErrorRate: metrics[0]?.errorRate || 0,
      avgNps: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + Number(m.nps), 0) / metrics.length
        : 0,
      avgUptime: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + Number(m.uptime), 0) / metrics.length
        : 0
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      summary,
      count: metrics.length
    });
  } catch (error) {
    console.error('Error fetching product health metrics:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/metrics/product-health
 *
 * Cria nova métrica de saúde do produto
 *
 * Body: CreateProductHealthMetricInput
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
    const validatedData = createProductHealthMetricSchema.parse(body);

    // Converter period string para Date
    const periodDate = new Date(validatedData.period);

    // Buscar última versão (query única, sem N+1)
    const lastVersion = await db.productHealthMetric.findFirst({
      where: { period: periodDate },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    const version = lastVersion ? lastVersion.version + 1 : 1;

    const metric = await db.productHealthMetric.create({
      data: {
        period: new Date(validatedData.period),

        // Customer Satisfaction
        nps: validatedData.nps,
        csat: validatedData.csat,
        ces: validatedData.ces,

        // Product Quality
        bugCount: validatedData.bugCount,
        criticalBugCount: validatedData.criticalBugCount,
        avgBugResolutionTime: validatedData.avgBugResolutionTime,

        // Feature Velocity
        featuresShipped: validatedData.featuresShipped,
        avgFeatureLeadTime: validatedData.avgFeatureLeadTime,
        featureRequestBacklog: validatedData.featureRequestBacklog,

        // Technical Health
        uptime: validatedData.uptime,
        avgApiResponseTime: validatedData.avgApiResponseTime,
        errorRate: validatedData.errorRate,

        // Support Quality
        avgSupportResponseTime: validatedData.avgSupportResponseTime,
        avgSupportResolutionTime: validatedData.avgSupportResolutionTime,
        supportTicketCount: validatedData.supportTicketCount,
        firstContactResolution: validatedData.firstContactResolution,

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

    return createdResponse(metric, 'Métrica de saúde do produto criada com sucesso');
  } catch (error) {
    console.error('Error creating product health metric:', error);
    return handleApiError(error);
  }
}
