import { z } from 'zod'

/**
 * Schema de atualização de usuário (PUT /api/users/[id]).
 * Todos os campos são opcionais (atualização parcial).
 * `companyIds` sincroniza as memberships N:N em `UserCompany` (multi-empresa).
 */
export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(['user', 'gerencia', 'admin']).optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  // empresa primária (branding + default de criação); null desvincula
  companyId: z.string().nullable().optional(),
  teamIds: z.array(z.string()).optional(),
  // empresas adicionais (multi-empresa) — sincroniza UserCompany
  companyIds: z.array(z.string()).optional(),
})

export type UpdateUserInput = z.infer<typeof updateUserSchema>
