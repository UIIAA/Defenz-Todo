/**
 * Quem pode EMITIR documento comercial em nome da Defenz.
 *
 * Decisão do Marcos, 21/08: *"Podem users também gerar. Mas só users Defenz."*
 * O corte que importa não é o papel — o vendedor que precisa emitir é `user` —
 * e sim a EMPRESA: quem usa a plataforma como empresa-cliente não pode gerar
 * documento com a marca da Defenz, em nenhum papel.
 *
 * Vale para proposta e, quando existir, para a apresentação
 * (`feature-portal-apresentacao.md` §10.1).
 */
import { ApiError } from '@/lib/api-helpers'
import { isAdmin, accessibleCompanyIds, type ScopeUser } from '@/lib/auth'
import { resolveDefenzCompanyId } from '@/lib/service-desk-server'

export async function exigirEmissorDefenz(user: ScopeUser): Promise<void> {
  // admin é operação da própria Defenz e cruza empresas por definição.
  if (isAdmin(user)) return

  const defenzId = await resolveDefenzCompanyId()
  const ids = accessibleCompanyIds(user) ?? []

  if (!ids.includes(defenzId)) {
    throw new ApiError(
      'Apenas usuários da Defenz podem emitir documentos comerciais da Defenz.',
      403,
      { code: 'FORBIDDEN_EMISSAO' }
    )
  }
}
