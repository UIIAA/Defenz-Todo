import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { updateBusinessMetricSchema } from '@/lib/validations/metrics';
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/metrics/business/[id]
 *
 * Retorna uma métrica operacional específica por ID
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

    const metric = await db.businessMetric.findUnique({
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
    console.error('Error fetching business metric:', error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/metrics/business/[id]
 *
 * Atualiza uma métrica operacional existente
 *
 * Nota: period e metricName NÃO podem ser alterados (são campos de versionamento)
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
    const validatedData = updateBusinessMetricSchema.parse(body);

    const metric = await db.businessMetric.update({
      where: { id },
      data: validatedData,
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

    return successResponse(metric, 'Métrica operacional atualizada com sucesso');
  } catch (error) {
    console.error('Error updating business metric:', error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/metrics/business/[id]
 *
 * Deleta uma métrica operacional
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

    await db.businessMetric.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Métrica operacional deletada com sucesso'
    });
  } catch (error) {
    console.error('Error deleting business metric:', error);
    return handleApiError(error);
  }
}
