import { z } from "zod";

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export const createCompanySchema = z.object({
  name: z.string().min(1, "Nome da empresa e obrigatorio").max(100),
  logoUrl: z.string().url("URL da logo invalida").max(2000).optional().or(z.literal("")),
  accentColor: z
    .string()
    .regex(HEX_COLOR, "Cor deve ser hex valido (ex: #2563eb)")
    .optional()
    .or(z.literal("")),
});

export const updateCompanySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(100).optional(),
  logoUrl: z.string().url("URL da logo invalida").max(2000).nullable().optional().or(z.literal("")),
  accentColor: z
    .string()
    .regex(HEX_COLOR, "Cor deve ser hex valido (ex: #2563eb)")
    .nullable()
    .optional()
    .or(z.literal("")),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
