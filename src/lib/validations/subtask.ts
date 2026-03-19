import { z } from 'zod'

export const createSubtaskSchema = z.object({
  title: z.string().min(1, 'Titulo obrigatorio').max(200),
  position: z.number().int().min(0).optional(),
})

export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
})
