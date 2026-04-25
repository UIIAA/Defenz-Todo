import { z } from 'zod'

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no minimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter pelo menos 1 letra maiuscula')
  .regex(/[a-z]/, 'Senha deve conter pelo menos 1 letra minuscula')
  .regex(/[0-9]/, 'Senha deve conter pelo menos 1 numero')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos 1 caractere especial')

export const registerSchema = z.object({
  email: z.string().email('Email invalido').transform((e) => e.toLowerCase().trim()),
  password: passwordSchema,
  name: z.string().min(1, 'Nome e obrigatorio').optional(),
  token: z.string().min(1, 'Token de convite e obrigatorio'),
  position: z.string().optional(),
})
