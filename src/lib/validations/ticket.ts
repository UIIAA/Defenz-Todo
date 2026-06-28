import { z } from 'zod'

export const TICKET_STATUS = ['solicitado', 'em_atendimento', 'concluido'] as const
export const TICKET_CHANNELS = ['email', 'whatsapp', 'telefone', 'chat', 'outro'] as const
const priorityEnum = z.enum(['alta', 'media', 'baixa'])

export const createTicketSchema = z.object({
  subject: z.string().min(1, 'Assunto obrigatório').max(200),
  description: z.string().max(5000).optional(),
  companyId: z.string().optional(),
  requester: z.string().max(200).optional(),
  client: z.string().max(200).optional(),
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
  client: z.string().max(200).nullable().optional(),
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

// ─── Portal público (F2) ──────────────────────────────────────────────────────

/**
 * Schema de validação para abertura de ticket pelo portal público.
 *
 * .strict() rejeita qualquer campo extra (assignedToId, status, companyId,
 * source, createdById etc.) — o endpoint não confia no body para esses valores.
 *
 * CNPJ/e-mail são validados aqui apenas como strings não-vazias; a
 * normalização e a verificação real (AuthorizedClient) ocorrem no handler.
 */
export const publicCreateTicketSchema = z
  .object({
    cnpj: z.string().min(1, 'CNPJ obrigatório'),
    email: z.string().email('E-mail inválido'),
    name: z.string().min(1, 'Nome obrigatório').max(200),
    subject: z.string().min(1, 'Assunto obrigatório').max(200),
    description: z.string().max(5000).optional(),
    priority: z.enum(['alta', 'media', 'baixa']).optional(),
    // Campos anti-bot (não persistidos)
    _hp: z.string().optional(),   // honeypot: deve estar vazio
    _t: z.number().optional(),    // tempo desde render em ms (mínimo verificado no handler)
  })
  .strict()

export type PublicCreateTicketInput = z.infer<typeof publicCreateTicketSchema>
