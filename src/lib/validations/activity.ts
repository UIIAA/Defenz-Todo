import { z } from 'zod';

/**
 * Schema de validação para criação de atividades
 *
 * Valida todos os campos obrigatórios e opcionais de uma atividade,
 * incluindo transformações de dados (trim, lowercase) e validações
 * de tamanho e formato.
 */
export const createActivitySchema = z.object({
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(255, 'Título muito longo (máximo 255 caracteres)')
    .transform(val => val.trim()),

  description: z.string()
    .max(5000, 'Descrição muito longa (máximo 5000 caracteres)')
    .transform(val => val?.trim())
    .optional()
    .nullable(),

  area: z.string()
    .min(1, 'Área é obrigatória')
    .max(100, 'Área muito longa (máximo 100 caracteres)')
    .transform(val => val.trim()),

  priority: z.number()
    .int('Prioridade deve ser um número inteiro')
    .min(0, 'Prioridade mínima é 0 (Alta)')
    .max(2, 'Prioridade máxima é 2 (Baixa)'),

  status: z.enum(['pending', 'in_progress', 'completed', 'ok'])
    .default('pending'),

  responsible: z.string()
    .max(100, 'Responsável muito longo (máximo 100 caracteres)')
    .transform(val => val?.trim())
    .optional()
    .nullable(),

  deadline: z.string()
    .max(50, 'Prazo muito longo (máximo 50 caracteres)')
    .transform(val => val?.trim())
    .optional()
    .nullable(),

  location: z.string()
    .max(200, 'Local muito longo (máximo 200 caracteres)')
    .transform(val => val?.trim())
    .optional()
    .nullable(),

  how: z.string()
    .max(5000, 'Método muito longo (máximo 5000 caracteres)')
    .transform(val => val?.trim())
    .optional()
    .nullable(),

  cost: z.string()
    .max(50, 'Custo muito longo (máximo 50 caracteres)')
    .transform(val => val?.trim())
    .optional()
    .nullable(),
});

/**
 * Schema de validação para atualização de atividades
 *
 * Todos os campos são opcionais, permitindo atualizações parciais.
 */
export const updateActivitySchema = createActivitySchema.partial();

/**
 * Schema de validação para importação em lote de atividades
 */
export const importActivitiesSchema = z.array(createActivitySchema)
  .min(1, 'Pelo menos uma atividade deve ser fornecida')
  .max(1000, 'Máximo de 1000 atividades por importação');

/**
 * Schema de validação para comentários de atividades
 */
export const createCommentSchema = z.object({
  content: z.string()
    .min(1, 'Comentário não pode estar vazio')
    .max(5000, 'Comentário muito longo (máximo 5000 caracteres)')
    .transform(val => val.trim()),
});

/**
 * Schema de validação para atualização de comentários
 */
export const updateCommentSchema = createCommentSchema;

/**
 * Types inferidos dos schemas para TypeScript
 */
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type ImportActivitiesInput = z.infer<typeof importActivitiesSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;
