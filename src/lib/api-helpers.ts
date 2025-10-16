import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * Classe customizada para erros de API
 *
 * Permite criar erros estruturados com código de status HTTP
 * e detalhes adicionais opcionais.
 */
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handler centralizado de erros para APIs
 *
 * Trata diferentes tipos de erros (Zod, Prisma, ApiError customizado)
 * e retorna respostas padronizadas.
 *
 * @param error - Erro capturado no catch
 * @returns NextResponse com erro formatado
 */
export function handleApiError(error: unknown): NextResponse {
  // Erro customizado da aplicação
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        ...(error.details && { details: error.details })
      },
      { status: error.statusCode }
    );
  }

  // Erros de validação Zod
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Dados inválidos',
        details: error.issues.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      },
      { status: 400 }
    );
  }

  // Erros do Prisma
  if (error && typeof error === 'object' && 'code' in error) {
    const prismaError = error as { code: string; meta?: any };

    switch (prismaError.code) {
      case 'P2002': // Unique constraint violation
        return NextResponse.json(
          {
            success: false,
            error: 'Registro duplicado',
            details: prismaError.meta
          },
          { status: 409 }
        );

      case 'P2025': // Record not found
        return NextResponse.json(
          { success: false, error: 'Recurso não encontrado' },
          { status: 404 }
        );

      case 'P2003': // Foreign key constraint violation
        return NextResponse.json(
          {
            success: false,
            error: 'Referência inválida',
            details: prismaError.meta
          },
          { status: 400 }
        );

      default:
        console.error('Prisma error:', prismaError);
        return NextResponse.json(
          { success: false, error: 'Erro de banco de dados' },
          { status: 500 }
        );
    }
  }

  // Erro genérico desconhecido
  console.error('Unhandled error:', error);
  const errorMessage = error instanceof Error ? error.message : 'Erro interno do servidor';

  return NextResponse.json(
    { success: false, error: errorMessage },
    { status: 500 }
  );
}

/**
 * Formato de resposta de sucesso padronizado
 *
 * @param data - Dados a serem retornados
 * @param message - Mensagem opcional de sucesso
 * @param status - Status HTTP (padrão: 200)
 * @returns NextResponse com dados formatados
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message })
    },
    { status }
  );
}

/**
 * Formato de resposta de sucesso para criação
 *
 * @param data - Dados do recurso criado
 * @param message - Mensagem opcional
 * @returns NextResponse com status 201
 */
export function createdResponse<T>(data: T, message?: string): NextResponse {
  return successResponse(data, message, 201);
}
