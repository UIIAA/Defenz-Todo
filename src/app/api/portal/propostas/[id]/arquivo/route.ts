import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, companyScopeWhere } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/api-helpers'
import { renderPdf } from '@/lib/proposta/pdf'
import { reconstruirDocumento, renderPropostaHtml } from '@/lib/proposta/proposta-server'

export const maxDuration = 120

/**
 * Re-download de uma proposta já emitida.
 *
 * Reimprime a partir do `precoSnapshot`, NUNCA da tabela de hoje: o mesmo
 * código de proposta tem que sair sempre com o mesmo preço. Quem quer preço
 * novo emite proposta nova, que ganha número novo (spec §8).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Só sessão, sem Bearer (spec §10).
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    const { id } = await params

    // Escopo de tenant na própria query: usuário de outra empresa recebe 404,
    // não 403 — não confirmamos nem a existência do documento.
    const registro = await db.proposta.findFirst({
      where: { AND: [{ id }, companyScopeWhere(user)] },
      select: {
        codigo: true,
        clienteNome: true,
        empresaNome: true,
        precoSnapshot: true,
        arquivoNome: true,
        createdAt: true,
        criadoPor: { select: { name: true, email: true } },
      },
    })

    if (!registro) throw new ApiError('Proposta não encontrada', 404)

    const pdf = await renderPdf(renderPropostaHtml(reconstruirDocumento(registro)))

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(registro.arquivoNome)}"`,
        'Content-Length': String(pdf.length),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
