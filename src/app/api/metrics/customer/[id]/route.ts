import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { updateCustomerMetricSchema } from '@/lib/validations/metrics';
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/metrics/customer/[id]
 *
 * Retorna uma métrica de cliente específica por ID
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

    const metric = await db.customerMetric.findUnique({
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
    console.error('Error fetching customer metric:', error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/metrics/customer/[id]
 *
 * Atualiza uma métrica de cliente existente
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
    const validatedData = updateCustomerMetricSchema.parse(body);

    const metric = await db.customerMetric.update({
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

    return successResponse(metric, 'Métrica de cliente atualizada com sucesso');
  } catch (error) {
    console.error('Error updating customer metric:', error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/metrics/customer/[id]
 *
 * Deleta uma métrica de cliente
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

    await db.customerMetric.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Métrica de cliente deletada com sucesso'
    });
  } catch (error) {
    console.error('Error deleting customer metric:', error);
    return handleApiError(error);
  }
}
