import { z } from 'zod'
import { ApiError } from '@/lib/api-helpers'

export const PLAYBOOK_KINDS = ['POP', 'BIBLIOTECA'] as const

/** Allowlist de esquema: só https. Vale para link do Drive e para URL de imagem. */
const httpsUrl = z
  .string()
  .max(2000)
  .refine((v) => v.startsWith('https://'), {
    message: 'URL deve começar com https://',
  })

export const createPlaybookSchema = z.object({
  kind: z.enum(PLAYBOOK_KINDS).default('POP'),
  title: z.string().min(1, 'Título obrigatório').max(200),
  body: z.string().min(1, 'Conteúdo obrigatório').max(100000),
  externalUrl: httpsUrl.nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).default([]),
  companyId: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  reviewIntervalDays: z.number().int().min(1).max(3650).nullable().default(90),
})

export const updatePlaybookSchema = z.object({
  kind: z.enum(PLAYBOOK_KINDS).optional(),
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(100000).optional(),
  externalUrl: httpsUrl.nullable().optional(),
  tags: z.array(z.string().max(40)).max(20).optional(),
  companyId: z.string().nullable().optional(),
  ownerId: z.string().nullable().optional(),
  reviewIntervalDays: z.number().int().min(1).max(3650).nullable().optional(),
  isArchived: z.boolean().optional(),
})

export type CreatePlaybookInput = z.infer<typeof createPlaybookSchema>
export type UpdatePlaybookInput = z.infer<typeof updatePlaybookSchema>

/**
 * `BIBLIOTECA` exige `externalUrl`.
 *
 * Valida o ESTADO MERGEADO (existente + payload), não o payload — num PUT parcial
 * o campo ausente não significa "vazio", significa "não mexa". Sem isso, mandar só
 * `{ kind: 'BIBLIOTECA' }` criaria um item de biblioteca sem link.
 * Mesma classe do bug do `diffChanges` em PUT parcial (GUIA §9.6).
 */
export function assertKindInvariant(
  existente: { kind: 'POP' | 'BIBLIOTECA'; externalUrl: string | null },
  payload: { kind?: 'POP' | 'BIBLIOTECA'; externalUrl?: string | null }
): void {
  const merged = {
    kind: payload.kind ?? existente.kind,
    externalUrl:
      payload.externalUrl !== undefined ? payload.externalUrl : existente.externalUrl,
  }

  if (merged.kind === 'BIBLIOTECA' && !merged.externalUrl) {
    throw new ApiError('Item de Biblioteca exige um link (externalUrl) do Drive', 400)
  }
}
