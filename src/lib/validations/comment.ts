import { z } from 'zod'

// Schema para validar CUID (Prisma ID format)
export const cuidSchema = z.string().cuid('ID inválido')

// Schema para criar um novo comentário
export const createCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'O comentário não pode estar vazio')
    .max(5000, 'O comentário deve ter no máximo 5000 caracteres')
    .trim(),
})

// Schema para atualizar um comentário
export const updateCommentSchema = z.object({
  content: z
    .string()
    .min(1, 'O comentário não pode estar vazio')
    .max(5000, 'O comentário deve ter no máximo 5000 caracteres')
    .trim(),
})

// Tipos TypeScript inferidos dos schemas
export type CreateCommentInput = z.infer<typeof createCommentSchema>
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>
