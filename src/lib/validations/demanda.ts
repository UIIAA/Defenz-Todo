import { z } from 'zod'

export const createDemandaSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  origin: z.enum(['fernando', 'securisoft', 'autogerada', 'outra']).default('outra'),
  status: z.enum(['solicitada', 'selecionada', 'em_andamento', 'concluida', 'bloqueada']).default('solicitada'),
  priority: z.enum(['alta', 'media', 'baixa']).default('media'),
  classification: z.enum(['marketing', 'administrativo', 'vendas', 'financeiro', 'operacional', 'tecnologia', 'juridico', 'rh', 'estrategico']).nullable().optional(),
  assignee: z.string().nullable().optional(),
  assignedToId: z.string().min(1).nullable().optional(),
  dateIn: z.string().optional(),
  deadline: z.string().optional(),
  dateDone: z.string().nullable().optional(),
  dateStarted: z.string().nullable().optional(),
  reminderDate: z.string().nullable().optional(),
})

export const updateDemandaSchema = createDemandaSchema.partial().extend({
  id: z.string(),
  updatedAt: z.string().datetime().optional(),
})

export const importItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(''),
  origin: z.enum(['fernando', 'securisoft', 'autogerada', 'outra']).default('outra'),
  priority: z.enum(['alta', 'media', 'baixa']).default('media'),
  assignee: z.string().nullable().optional(),
  deadline: z.string().optional(),
})

export const importSchema = z.object({
  items: z.array(importItemSchema).min(1, 'Pelo menos 1 item'),
})
