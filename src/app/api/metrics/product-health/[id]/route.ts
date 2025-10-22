import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { updateProductHealthMetricSchema } from '@/lib/validations/metrics';
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/metrics/product-health/[id]
 *
 * Retorna uma métrica de saúde do produto específica por ID
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

    const metric = await db.productHealthMetric.findUnique({
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
    console.error('Error fetching product health metric:', error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/metrics/product-health/[id]
 *
 * Atualiza uma métrica de saúde do produto existente
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
    const validatedData = updateProductHealthMetricSchema.parse(body);

    const metric = await db.productHealthMetric.update({
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

    return successResponse(metric, 'Métrica de saúde do produto atualizada com sucesso');
  } catch (error) {
    console.error('Error updating product health metric:', error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/metrics/product-health/[id]
 *
 * Deleta uma métrica de saúde do produto
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

    await db.productHealthMetric.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Métrica de saúde do produto deletada com sucesso'
    });
  } catch (error) {
    console.error('Error deleting product health metric:', error);
    return handleApiError(error);
  }
}
