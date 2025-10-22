import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { updateEngagementMetricSchema } from '@/lib/validations/metrics';
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/metrics/engagement/[id]
 *
 * Retorna uma métrica de engajamento específica por ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError('Não autorizado', 401);
    }

    const { id } = await params;

    const metric = await db.engagementMetric.findUnique({
      where: { id },
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

    if (!metric) {
      throw new ApiError('Métrica não encontrada', 404);
    }

    return successResponse(metric);
  } catch (error) {
    console.error('Error fetching engagement metric:', error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/metrics/engagement/[id]
 *
 * Atualiza uma métrica de engajamento existente
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError('Não autorizado', 401);
    }

    if (!user.id) {
      throw new ApiError('ID de usuário inválido', 400);
    }

    const { id } = await params;

    const body = await request.json();
    const validatedData = updateEngagementMetricSchema.parse(body);

    // Converter null para Prisma.JsonNull para campos JSON
    const data: any = { ...validatedData };
    if (data.featureAdoptionRates === null) {
      data.featureAdoptionRates = undefined;
    }

    const metric = await db.engagementMetric.update({
      where: { id },
      data,
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

    return successResponse(metric, 'Métrica de engajamento atualizada com sucesso');
  } catch (error) {
    console.error('Error updating engagement metric:', error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/metrics/engagement/[id]
 *
 * Deleta uma métrica de engajamento
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      throw new ApiError('Não autorizado', 401);
    }

    const { id } = await params;

    await db.engagementMetric.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Métrica de engajamento deletada com sucesso'
    });
  } catch (error) {
    console.error('Error deleting engagement metric:', error);
    return handleApiError(error);
  }
}
