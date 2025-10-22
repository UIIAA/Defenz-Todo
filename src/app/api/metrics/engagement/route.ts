import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createEngagementMetricSchema } from '@/lib/validations/metrics';
import { handleApiError, createdResponse, ApiError } from '@/lib/api-helpers';

/**
 * GET /api/metrics/engagement
 *
 * Retorna métricas de engajamento (DAU/MAU, Retention, Activation)
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

    const metrics = await db.engagementMetric.findMany({
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
      latestDauMauRatio: metrics[0]?.dauMauRatio || 0,
      latestMonthlyRetention: metrics[0]?.monthlyRetention || 0,
      latestActivationRate: metrics[0]?.activationRate || 0,
      latestPowerUserPct: metrics[0]?.powerUserPercentage || 0,
      avgDauMauRatio: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + Number(m.dauMauRatio), 0) / metrics.length
        : 0
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      summary,
      count: metrics.length
    });
  } catch (error) {
    console.error('Error fetching engagement metrics:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/metrics/engagement
 *
 * Cria nova métrica de engajamento
 *
 * Body: CreateEngagementMetricInput
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
    const validatedData = createEngagementMetricSchema.parse(body);

    // Converter period string para Date
    const periodDate = new Date(validatedData.period);

    // Buscar última versão (query única, sem N+1)
    const lastVersion = await db.engagementMetric.findFirst({
      where: { period: periodDate },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    const version = lastVersion ? lastVersion.version + 1 : 1;

    const metric = await db.engagementMetric.create({
      data: {
        period: new Date(validatedData.period),

        // Activation & Usage
        dau: validatedData.dau,
        mau: validatedData.mau,
        wau: validatedData.wau,
        dauMauRatio: validatedData.dauMauRatio,

        // Engagement Depth
        avgSessionsPerUser: validatedData.avgSessionsPerUser,
        avgSessionDuration: validatedData.avgSessionDuration,
        avgActivitiesPerUser: validatedData.avgActivitiesPerUser,

        // Time to Value
        avgTimeToFirstValue: validatedData.avgTimeToFirstValue,
        activationRate: validatedData.activationRate,

        // Retention
        weeklyRetention: validatedData.weeklyRetention,
        monthlyRetention: validatedData.monthlyRetention,
        quarterlyRetention: validatedData.quarterlyRetention,

        // Feature Adoption
        featureAdoptionRates: validatedData.featureAdoptionRates || undefined,
        powerUserPercentage: validatedData.powerUserPercentage,

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

    return createdResponse(metric, 'Métrica de engajamento criada com sucesso');
  } catch (error) {
    console.error('Error creating engagement metric:', error);
    return handleApiError(error);
  }
}
