import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { createCustomerMetricSchema } from '@/lib/validations/metrics';
import { handleApiError, createdResponse, ApiError } from '@/lib/api-helpers';

/**
 * GET /api/metrics/customer
 *
 * Retorna métricas de clientes (Churn, LTV:CAC, NRR, ARPU)
 *
 * Query params:
 * - limit: número de registros (padrão: 12 meses)
 * - startDate: filtro de data inicial (YYYY-MM-01)
 * - endDate: filtro de data final (YYYY-MM-01)
 * - version: versão específica dos dados
 * - cohortMonth: filtrar por cohort específico
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
    const cohortMonth = searchParams.get('cohortMonth');

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

    if (cohortMonth) {
      where.cohortMonth = new Date(cohortMonth);
    }

    const metrics = await db.customerMetric.findMany({
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
      latestActiveCustomers: metrics[0]?.activeCustomers || 0,
      latestChurnRate: metrics[0]?.customerChurnRate || 0,
      latestLtvCacRatio: metrics[0]?.ltvCacRatio || 0,
      latestNrr: metrics[0]?.netRevenueRetention || 0,
      avgChurnRate: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + Number(m.customerChurnRate), 0) / metrics.length
        : 0
    };

    return NextResponse.json({
      success: true,
      data: metrics,
      summary,
      count: metrics.length
    });
  } catch (error) {
    console.error('Error fetching customer metrics:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/metrics/customer
 *
 * Cria nova métrica de cliente
 *
 * Body: CreateCustomerMetricInput
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
    const validatedData = createCustomerMetricSchema.parse(body);

    // Converter period string para Date
    const periodDate = new Date(validatedData.period);

    // Buscar última versão (query única, sem N+1)
    const lastVersion = await db.customerMetric.findFirst({
      where: { period: periodDate },
      orderBy: { version: 'desc' },
      select: { version: true }
    });

    const version = lastVersion ? lastVersion.version + 1 : 1;

    const metric = await db.customerMetric.create({
      data: {
        period: new Date(validatedData.period),

        // Customer Counts
        activeCustomers: validatedData.activeCustomers,
        newCustomers: validatedData.newCustomers,
        churnedCustomers: validatedData.churnedCustomers,
        netNewCustomers: validatedData.netNewCustomers,

        // Churn Metrics
        customerChurnRate: validatedData.customerChurnRate,
        revenueChurnRate: validatedData.revenueChurnRate,
        netRevenueRetention: validatedData.netRevenueRetention,

        // LTV:CAC
        averageLtv: validatedData.averageLtv,
        averageCac: validatedData.averageCac,
        ltvCacRatio: validatedData.ltvCacRatio,
        cacPaybackMonths: validatedData.cacPaybackMonths,

        // ARPU
        arpu: validatedData.arpu,
        arpuGrowth: validatedData.arpuGrowth,

        // Cohort
        cohortMonth: validatedData.cohortMonth ? new Date(validatedData.cohortMonth) : null,
        cohortSize: validatedData.cohortSize,
        cohortRetentionRate: validatedData.cohortRetentionRate,

        // Growth
        customerGrowthRate: validatedData.customerGrowthRate,

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

    return createdResponse(metric, 'Métrica de cliente criada com sucesso');
  } catch (error) {
    console.error('Error creating customer metric:', error);
    return handleApiError(error);
  }
}
