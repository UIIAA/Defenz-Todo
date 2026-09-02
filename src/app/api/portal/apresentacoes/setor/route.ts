import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/api-helpers'
import { exigirEmissorDefenz } from '@/lib/emissao-documento'
import { setorSchema } from '@/lib/validations/apresentacao-pesquisa'
import { faltaAncora, sugerirSetorPorCnpj } from '@/lib/apresentacao/pesquisa/setor'

/**
 * PASSO ZERO — sugere o setor e para por aí (spec §4).
 *
 * ⚠️ De propósito NÃO dispara busca nem IA: é o passo barato que existe para o
 * vendedor confirmar o nicho ANTES de a pesquisa custar. Errar aqui contamina
 * panorama, casos e plano sugerido de uma vez só.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)
    await exigirEmissorDefenz(user)

    const dados = setorSchema.parse(await request.json())
    // I4: sem CNPJ, sem site e sem descrição, entender o nicho vira adivinhar.
    if (faltaAncora(dados)) {
      throw new ApiError(
        'Informe CNPJ, site ou uma descrição do que a empresa faz — sem isso não dá para identificar o nicho.',
        400
      )
    }

    const sugestao = dados.cnpj ? await sugerirSetorPorCnpj(dados.cnpj) : { origem: 'nenhuma' as const }
    return NextResponse.json({ success: true, data: sugestao })
  } catch (error) {
    return handleApiError(error)
  }
}
