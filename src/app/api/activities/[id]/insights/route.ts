import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { getGeminiService } from '@/lib/ai/gemini-service';
import { RateLimitError, GeminiAPIError, GeminiValidationError } from '@/lib/ai/gemini-types';
import { handleApiError, createdResponse, ApiError } from '@/lib/api-helpers';
import type { ActivityInput } from '@/lib/ai/gemini-types';
import { insightDataSchema, scoreSchema } from '@/lib/validations/activity-insight';
import { validateAndSanitizeInput } from '@/lib/ai/gemini-validation';
import { mapInsightToResponse } from '@/lib/ai/insight-mapper';
import { calculateOverallScore } from '@/lib/utils/activity-insight-utils';
import { z } from 'zod';

type RouteParams = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/activities/[id]/insights
 *
 * Busca insights existentes de uma atividade
 *
 * Retorna:
 * - 200: Insight encontrado
 * - 401: Não autenticado
 * - 404: Atividade ou insight não encontrado
 * - 500: Erro interno
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Verificar autenticação
    const user = await getCurrentUser();
    if (!user) {
      throw new ApiError('Autenticação necessária', 401);
    }

    // 2. Obter ID da atividade
    const { id } = await params;
    
    // 2.1. Validar formato do ID (CUID)
    const idSchema = z.string().cuid();
    try {
      idSchema.parse(id);
    } catch {
      throw new ApiError('ID de atividade inválido', 400);
    }

    // 3. Buscar insight no banco
    const insight = await db.activityInsight.findUnique({
      where: { activityId: id },
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            description: true,
            area: true,
            priority: true,
            responsible: true,
            how: true,
            cost: true,
            status: true,
            deletedAt: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // 4. Verificar se existe
    if (!insight) {
      throw new ApiError('Insight não encontrado para esta atividade', 404);
    }

    // 5. Verificar se atividade não foi deletada
    if (insight.activity.deletedAt) {
      throw new ApiError('Atividade foi deletada', 404);
    }

    // 6. Verificar permissão para visualizar este insight
    // Apenas o criador do insight ou admin podem visualizar
    if (insight.createdBy !== user.id && user.role !== 'admin') {
      throw new ApiError('Sem permissão para visualizar este insight', 403);
    }

    // 6. Retornar insight (usando helper de mapeamento)
    return NextResponse.json(mapInsightToResponse(insight));
  } catch (error) {
    console.error('GET /api/activities/[id]/insights error:', error);
    return handleApiError(error);
  }
}

/**
 * POST /api/activities/[id]/insights
 *
 * Gera novo insight com Gemini AI para uma atividade
 *
 * Se insight já existe, retorna o existente (idempotente)
 *
 * Retorna:
 * - 201: Insight criado com sucesso
 * - 200: Insight já existe (retorna existente)
 * - 401: Não autenticado
 * - 404: Atividade não encontrada
 * - 429: Rate limit excedido
 * - 500: Erro interno ou erro do Gemini
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Verificar autenticação
    const user = await getCurrentUser();
    if (!user) {
      throw new ApiError('Autenticação necessária', 401);
    }

    // 2. Obter ID da atividade
    const { id } = await params;
    
    // 2.1. Validar formato do ID (CUID)
    const idSchema = z.string().cuid();
    try {
      idSchema.parse(id);
    } catch {
      throw new ApiError('ID de atividade inválido', 400);
    }

    // 3. Buscar atividade
    const activity = await db.activity.findUnique({
      where: { id },
    });

    if (!activity || activity.deletedAt) {
      throw new ApiError('Atividade não encontrada', 404);
    }

    // 4. Verificar se insight já existe (idempotência)
    const existingInsight = await db.activityInsight.findUnique({
      where: { activityId: id },
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            description: true,
            area: true,
            priority: true,
            responsible: true,
            how: true,
            cost: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (existingInsight) {
      console.log(`[Insights] Retornando insight existente para activity ${id}`);
      return NextResponse.json(mapInsightToResponse(existingInsight));
    }

    // 5. Preparar e validar dados da atividade para Gemini
    const activityInput = {
      title: activity.title,
      description: activity.description || undefined,
      area: activity.area,
      priority: activity.priority,
      responsible: activity.responsible || undefined,
      how: activity.how || undefined,
      cost: activity.cost || undefined,
    };

    // 5.1. Validar e sanitizar input
    const validatedInput = validateAndSanitizeInput(activityInput);

    // 6. Chamar Gemini AI para análise
    console.log(`[Insights] Iniciando análise Gemini para activity ${id}`);
    const geminiService = getGeminiService();
    const analysis = await geminiService.analyzeActivity(validatedInput, user.id);

    // 7. Validar estrutura JSONB
    const validated = insightDataSchema.parse({
      businessMetrics: analysis.businessMetrics,
      maMetrics: analysis.maMetrics,
    });

    // 7. Validar e normalizar scores
    const businessMetricScore = scoreSchema.parse(analysis.businessMetricScore);
    const maScore = scoreSchema.parse(analysis.maScore);
    
    // 7. Calcular overall score baseado nos outros scores
    const overallScore = calculateOverallScore(businessMetricScore, maScore);

    // 7. Normalizar e validar confidence
    const confidenceDecimal = (() => {
      const val = Number(analysis.aiConfidence);
      const normalized = val <= 1 ? val : val / 100;

      if (normalized < 0 || normalized > 1) {
        throw new ApiError(`AI confidence fora do range: ${normalized}`, 400);
      }

      return Math.round(normalized * 1000) / 1000; // 3 decimais
    })();

    // 7. Salvar insight no banco
    const insight = await db.activityInsight.create({
      data: {
        activityId: id,
        businessMetrics: validated.businessMetrics,
        businessMetricScore: businessMetricScore,
        maMetrics: validated.maMetrics,
        maScore: maScore,
        overallScore: overallScore,
        aiModel: 'gemini-1.5-flash',
        aiConfidence: confidenceDecimal,
        processingTime: analysis.processingTime,
        tokenCount: analysis.tokenCount || null,
        analysisPrompt: `Activity Analysis for: ${activity.title}`,
        rawResponse: analysis.rawResponse,
        analysisVersion: '1.0',
        createdBy: user.id,
      },
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            description: true,
            area: true,
            priority: true,
            responsible: true,
            how: true,
            cost: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    console.log(`[Insights] Insight criado com sucesso para activity ${id}`);

    // 8. Retornar insight criado (usando helper de mapeamento)
    return NextResponse.json(
      mapInsightToResponse(insight),
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/activities/[id]/insights error:', error);

    // Tratar erros específicos do Gemini
    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          retryAfter: error.retryAfter,
        },
        { status: 429 }
      );
    }

    if (error instanceof GeminiAPIError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Erro ao analisar atividade com IA',
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (error instanceof GeminiValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Resposta inválida da IA',
          details: error.message,
        },
        { status: 500 }
      );
    }

    return handleApiError(error);
  }
}

/**
 * DELETE /api/activities/[id]/insights
 *
 * Remove insight de uma atividade (para permitir reanalise)
 *
 * Apenas o criador ou admin pode deletar
 *
 * Retorna:
 * - 200: Insight deletado
 * - 401: Não autenticado
 * - 403: Sem permissão
 * - 404: Insight não encontrado
 * - 500: Erro interno
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // 1. Verificar autenticação
    const user = await getCurrentUser();
    if (!user) {
      throw new ApiError('Autenticação necessária', 401);
    }

    // 2. Obter ID da atividade
    const { id } = await params;
    
    // 2.1. Validar formato do ID (CUID)
    const idSchema = z.string().cuid();
    try {
      idSchema.parse(id);
    } catch {
      throw new ApiError('ID de atividade inválido', 400);
    }

    // 3. Buscar insight
    const insight = await db.activityInsight.findUnique({
      where: { activityId: id },
    });

    if (!insight) {
      throw new ApiError('Insight não encontrado', 404);
    }

    // 4. Verificar permissão (apenas criador ou admin)
    if (insight.createdBy !== user.id && user.role !== 'admin') {
      throw new ApiError('Sem permissão para deletar este insight', 403);
    }

    // 5. Deletar insight
    await db.activityInsight.delete({
      where: { activityId: id },
    });

    console.log(`[Insights] Insight deletado para activity ${id} by user ${user.id}`);

    // 6. Retornar sucesso
    return NextResponse.json({
      success: true,
      message: 'Insight deletado com sucesso. Você pode gerar uma nova análise.',
    });
  } catch (error) {
    console.error('DELETE /api/activities/[id]/insights error:', error);
    return handleApiError(error);
  }
}
