import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { updateFinancialMetricSchema } from '@/lib/validations/metrics';
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers';

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

/**
 * GET /api/metrics/financial/[id]
 *
 * Retorna uma métrica financeira específica por ID
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

    const metric = await db.financialMetric.findUnique({
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
    console.error('Error fetching financial metric:', error);
    return handleApiError(error);
  }
}

/**
 * PUT /api/metrics/financial/[id]
 *
 * Atualiza uma métrica financeira existente
 *
 * Body: UpdateFinancialMetricInput (campos opcionais)
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

    // Parse e validar dados com Zod
    const body = await request.json();
    const validatedData = updateFinancialMetricSchema.parse(body);

    const metric = await db.financialMetric.update({
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

    return successResponse(metric, 'Métrica financeira atualizada com sucesso');
  } catch (error) {
    console.error('Error updating financial metric:', error);
    return handleApiError(error);
  }
}

/**
 * DELETE /api/metrics/financial/[id]
 *
 * Deleta uma métrica financeira
 *
 * ATENÇÃO: Operação irreversível. Use com cuidado.
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

    await db.financialMetric.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Métrica financeira deletada com sucesso'
    });
  } catch (error) {
    console.error('Error deleting financial metric:', error);
    return handleApiError(error);
  }
}
