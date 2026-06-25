import { z } from 'zod'

export const TICKET_STATUS = ['open', 'paused', 'resolved'] as const
export const TICKET_CHANNELS = ['email', 'whatsapp', 'telefone', 'chat', 'outro'] as const
const priorityEnum = z.enum(['alta', 'media', 'baixa'])

export const createTicketSchema = z.object({
  subject: z.string().min(1, 'Assunto obrigatório').max(200),
  description: z.string().max(5000).optional(),
  companyId: z.string().optional(),
  requester: z.string().max(200).optional(),
  channel: z.enum(TICKET_CHANNELS).optional(),
  priority: priorityEnum.default('media'),
  assignedToId: z.string().nullable().optional(),
})

export const updateTicketSchema = z.object({
  subject: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(TICKET_STATUS).optional(),
  priority: priorityEnum.optional(),
  channel: z.enum(TICKET_CHANNELS).nullable().optional(),
  requester: z.string().max(200).nullable().optional(),
  assignedToId: z.string().nullable().optional(),
})

export const createTicketMessageSchema = z.object({
  body: z.string().min(1, 'Mensagem obrigatória').max(10000),
  kind: z.enum(['reply', 'note']).default('reply'),
})

export const escalateTicketSchema = z.object({
  escalatedTo: z.string().min(1, 'Informe o destino (parceiro/N2)').max(120),
})

export const linkDemandaSchema = z.object({
  demandaId: z.string().min(1),
})

export const metricsQuerySchema = z.object({
  from: z.string().optional(), // YYYY-MM-DD
  to: z.string().optional(),
  companyId: z.string().optional(),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>
