import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { updateSalesMetricSchema } from '@/lib/validations/metrics';
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/metrics/sales/[id]
 *
 * Retorna uma métrica de vendas específica por ID
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

    const metric = await db.salesMetric.findUnique({
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
    console.error('Error fetching sales metric:', error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/metrics/sales/[id]
 *
 * Atualiza uma métrica de vendas existente
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
    const validatedData = updateSalesMetricSchema.parse(body);

    const metric = await db.salesMetric.update({
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

    return successResponse(metric, 'Métrica de vendas atualizada com sucesso');
  } catch (error) {
    console.error('Error updating sales metric:', error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/metrics/sales/[id]
 *
 * Deleta uma métrica de vendas
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

    await db.salesMetric.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Métrica de vendas deletada com sucesso'
    });
  } catch (error) {
    console.error('Error deleting sales metric:', error);
    return handleApiError(error);
  }
}
