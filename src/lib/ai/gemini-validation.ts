import { z } from 'zod';

/**
 * Schemas Zod para validação de respostas do Gemini AI
 */

export const businessMetricSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['operational', 'sales', 'customer_service', 'productivity', 'quality']),
  impact: z.number().int().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),
  explanation: z.string().min(10).max(500)
});

export const maMetricSchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['financial', 'customer', 'engagement', 'product_health', 'sales']),
  impact: z.number().int().min(0).max(100),
  confidence: z.enum(['low', 'medium', 'high']),
  explanation: z.string().min(10).max(500)
});

export const geminiResponseSchema = z.object({
  businessMetrics: z.array(businessMetricSchema).min(1).max(5),
  maMetrics: z.array(maMetricSchema).min(0).max(3)
});

export type BusinessMetricValidated = z.infer<typeof businessMetricSchema>;
export type MAMetricValidated = z.infer<typeof maMetricSchema>;
export type GeminiResponseValidated = z.infer<typeof geminiResponseSchema>;

/**
 * Sanitiza uma string para prevenir injeção de prompt e XSS
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') {
    throw new TypeError('Input must be a string');
  }
  
  // Remove caracteres perigosos e potenciais injeções
  return str
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F-\u009F]/g, '') // Remove controle especial
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/javascript:/gi, '') // Remove javascript protocol
    .trim();
}

/**
 * Schema para validação de input de atividade
 */
export const activityInputSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(2000).optional(),
  area: z.string().min(1).max(100),
  priority: z.number().int().min(0).max(2),
  responsible: z.string().max(200).optional(),
  how: z.string().max(1000).optional(),
  cost: z.string().max(200).optional(),
});

export type ValidatedActivityInput = z.infer<typeof activityInputSchema>;

/**
 * Sanitiza e valida o input de atividade
 */
export function sanitizeActivityInput(input: any): ValidatedActivityInput {
  // Sanitize strings
  const sanitized = {
    ...input,
    title: typeof input.title === 'string' ? sanitizeString(input.title) : input.title,
    description: typeof input.description === 'string' ? sanitizeString(input.description) : input.description,
    area: typeof input.area === 'string' ? sanitizeString(input.area) : input.area,
    responsible: typeof input.responsible === 'string' ? sanitizeString(input.responsible) : input.responsible,
    how: typeof input.how === 'string' ? sanitizeString(input.how) : input.how,
    cost: typeof input.cost === 'string' ? sanitizeString(input.cost) : input.cost,
  };

  return activityInputSchema.parse(sanitized);
}

/**
 * Valida e sanitiza input de atividade
 */
export function validateAndSanitizeInput(input: any): ValidatedActivityInput {
  try {
    return sanitizeActivityInput(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      throw new Error(`Input validation failed: ${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Valida resposta do Gemini usando Zod
 */
export function validateGeminiResponse(data: any): { success: boolean; data?: GeminiResponseValidated; error?: string; details?: any } {
  try {
    const validated = geminiResponseSchema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
      return { 
        success: false, 
        error: `Validation failed: ${errorMessages}`,
        details: error.errors
      };
    }
    return { success: false, error: error instanceof Error ? error.message : 'Unknown validation error' };
  }
}

/**
 * Converte JSON string para objeto validado com Zod
 */
export function parseAndValidateGeminiResponse(jsonStr: string): { success: boolean; data?: GeminiResponseValidated; error?: string; details?: any } {
  try {
    // Remove qualquer conteúdo extra que possa vir antes ou depois do JSON
    const jsonMatch = jsonStr.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) {
      return { success: false, error: 'No JSON object found in response' };
    }
    
    const jsonString = jsonMatch[1];
    const parsed = JSON.parse(jsonString);
    return validateGeminiResponse(parsed);
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to parse or validate response',
      details: error
    };
  }
}

/**
 * Métricas conhecidas para validação adicional (opcional)
 */
export const KNOWN_BUSINESS_METRICS = [
  'Tempo de Resposta',
  'Taxa de Erro',
  'Eficiência Operacional',
  'Taxa de Conversão',
  'Tamanho do Pipeline',
  'Número de Deals',
  'Ciclo de Vendas',
  'Satisfação do Cliente',
  'Tempo de Primeira Resposta',
  'Taxa de Resolução',
  'Output por Pessoa/Hora',
  'Taxa de Utilização',
  'Velocidade de Entrega',
  'Taxa de Defeitos',
  'Taxa de Retrabalho',
  'Precisão'
];

export const KNOWN_MA_METRICS = [
  'ARR',
  'MRR',
  'EBITDA Margin',
  'Rule of 40',
  'Customer Churn Rate',
  'Revenue Churn Rate',
  'LTV:CAC Ratio',
  'CAC Payback Period',
  'DAU/MAU Ratio',
  'User Stickiness',
  'Session Duration',
  'NPS Score',
  'Feature Adoption',
  'Time to Value',
  'Win Rate',
  'Sales Cycle Length',
  'Pipeline Value'
];

/**
 * Tipos auxiliares
 */
export type ValidatedGeminiResponse = GeminiResponseValidated;
export type ValidatedBusinessMetric = z.infer<typeof businessMetricSchema>;
export type ValidatedMAMetric = z.infer<typeof maMetricSchema>;
