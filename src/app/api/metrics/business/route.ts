import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createBusinessMetricSchema } from '@/lib/validations/metrics';
import { handleApiError, createdResponse, ApiError } from '@/lib/api-helpers';

/**
 * GET /api/metrics/business
 *
 * Retorna métricas operacionais de negócio (produtividade, conversão, qualidade, etc.)
 *
 * Query params:
 * - limit: número de registros (padrão: 12 meses)
 * - startDate: filtro de data inicial (YYYY-MM-01)
 * - endDate: filtro de data final (YYYY-MM-01)
 * - category: filtro por categoria (operational, sales, customer_service, productivity, quality)
 * - area: filtro por área (Marketing, Vendas, Gestão, etc.)
 * - metricName: filtro por nome da métrica
 * - version: versão específica dos dados
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      throw new ApiError('Não autorizado', 401);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const area = searchParams.get('area');
    const metricName = searchParams.get('metricName');
    const version = searchParams.get('version') ? parseInt(searchParams.get('version')!, 10) : undefined;

    // Build filter
    const where: any = {};

    if (startDate || endDate) {
      where.period = {};
      if (startDate) where.period.gte = new Date(startDate);
      if (endDate) where.period.lte = new Date(endDate);
    }

    if (category) {
      where.category = category;
    }

    if (area) {
      where.area = area;
    }

    if (metricName) {
      where.metricName = metricName;
    }

    if (version !== undefined) {
      where.version = version;
    }

    const metrics = await db.businessMetric.findMany({
      where,
      orderBy: [
        { period: 'desc' },
        { metricName: 'asc' },
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
      categories: metrics.reduce((acc, m) => {
        acc[m.category] = (acc[m.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      areas: metrics.reduce((acc, m) => {
        acc[m.area] = (acc[m.area] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      uniqueMetrics: new Set(metrics.map(m => m.metricName)).size,
      metricsWithTargets: metrics.filter(m => m.target !== null).length,
      metricsAboveTarget: metrics.filter(m => {
        if (m.target === null) return false;
        // Assumir que valores acima do target são bons (pode ser invertido por métrica)
        return Number(m.metricValue) >= Number(m.target);
      }).length
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      summary,
      count: metrics.length
    });
  } catch (error) {
    console.error('Error fetching business metrics:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/metrics/business
 *
 * Cria nova métrica operacional de negócio
 *
 * Body: CreateBusinessMetricInput
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
    const validatedData = createBusinessMetricSchema.parse(body);

    // Converter period string para Date
    const periodDate = new Date(validatedData.period);

    // Buscar última versão para esta combinação period + metricName
    const lastVersion = await db.businessMetric.findFirst({
      where: {
        period: periodDate,
        metricName: validatedData.metricName
      },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    const version = lastVersion ? lastVersion.version + 1 : 1;

    const metric = await db.businessMetric.create({
      data: {
        period: periodDate,
        category: validatedData.category,
        metricName: validatedData.metricName,
        metricValue: validatedData.metricValue,
        metricUnit: validatedData.metricUnit,
        target: validatedData.target,
        description: validatedData.description,
        area: validatedData.area,
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

    return createdResponse(metric, 'Métrica operacional criada com sucesso');
  } catch (error) {
    console.error('Error creating business metric:', error);
    return handleApiError(error);
  }
}
