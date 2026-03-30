import { z } from "zod";

export const createLinkSchema = z.object({
  label: z.string().min(1, "Rótulo é obrigatório").max(100, "Rótulo deve ter no máximo 100 caracteres"),
  url: z.string().url("URL inválida").max(2000, "URL deve ter no máximo 2000 caracteres"),
  position: z.number().int().min(0).optional(),
});

export const updateLinkSchema = createLinkSchema.partial();

export type CreateLinkInput = z.infer<typeof createLinkSchema>;
export type UpdateLinkInput = z.infer<typeof updateLinkSchema>;
