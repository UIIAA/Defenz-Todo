import type { Prisma } from '@prisma/client'
import { companyScopeWhere, isAdmin, type ScopeUser } from './auth'

/**
 * Escopo de Playbook: empresa(s) do usuário + conteúdo GLOBAL (`companyId = null`).
 *
 * O `extra` é combinado por `AND` INTERNAMENTE — o caller NUNCA espalha o escopo
 * (`{ ...scope, ...filtros }`). Um filtro com `OR` próprio (a busca por título OU
 * corpo, por exemplo) sobrescreveria a cláusula de tenant pelo spread, em silêncio,
 * sem erro e sem teste que pegasse. Ver `feature-portal-defenz-review.md` C3.
 *
 * NÃO estender `companyScopeWhere` (retorna cláusula única e é usado por
 * Demanda/tickets/users — mexer nele quebraria os callers existentes).
 */
export function scopedPlaybookWhere(
  user: ScopeUser,
  extra: Prisma.PlaybookWhereInput = {}
): Prisma.PlaybookWhereInput {
  if (isAdmin(user)) return extra
  return {
    AND: [{ OR: [companyScopeWhere(user), { companyId: null }] }, extra],
  }
}
