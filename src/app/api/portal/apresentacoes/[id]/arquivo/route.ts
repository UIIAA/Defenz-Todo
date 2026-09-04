import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, companyScopeWhere } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/api-helpers'
import { renderPdf } from '@/lib/proposta/pdf'
import type { ComplementoId } from '@/lib/proposta/complementos'
import type { CasoApresentado } from '@/lib/apresentacao/templates/institucional-a4'
import {
  renderApresentacaoHtml,
  TEMPLATE_VERSAO,
} from '@/lib/apresentacao/templates/institucional-a4'
import { formatarDataSP } from '@/lib/apresentacao/apresentacao-server'
import type { FatoMercado } from '@/lib/apresentacao/mercado-fatos'
import type { NivelId } from '@/lib/apresentacao/comparativo'

export const maxDuration = 120

/**
 * Re-download de uma apresentação já emitida.
 *
 * ⚠️ Reimprime a partir do `fatosSnapshot`, NUNCA do catálogo de hoje. É a
 * lição que a Proposta pagou: lá o preço era fiel mas o texto vinha do código,
 * e mudar o template mudava, em silêncio, o que saía ao rebaixar um documento
 * antigo. Aqui o que foi AFIRMADO ao cliente está congelado no registro.
 *
 * O texto institucional fixo ainda vem do código — por isso o `templateVersao`
 * e o aviso quando diverge, em vez de entregar outro documento calado.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    const { id } = await params

    // Escopo na própria query: usuário de outra empresa recebe 404, não 403 —
    // não confirmamos nem a existência do documento.
    const registro = await db.apresentacao.findFirst({
      where: { AND: [{ id }, companyScopeWhere(user)] },
      select: {
        clienteNome: true,
        empresaNome: true,
        setor: true,
        nivelDestaque: true,
        fatosSnapshot: true,
        complementosSnapshot: true,
        casosSnapshot: true,
        templateVersao: true,
        arquivoNome: true,
        createdAt: true,
        criadoPor: { select: { name: true, email: true } },
      },
    })

    if (!registro) throw new ApiError('Apresentação não encontrada', 404)

    const fatos = (registro.fatosSnapshot as unknown as FatoMercado[]) ?? []

    const html = renderApresentacaoHtml({
      clienteNome: registro.clienteNome,
      empresaNome: registro.empresaNome,
      setor: registro.setor ?? undefined,
      // Data original: reimprimir com a data de hoje faria o mesmo documento
      // parecer outro, e o cliente já tem uma cópia com a data de então.
      dataFormatada: formatarDataSP(registro.createdAt),
      ano: Number(
        new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
        }).format(registro.createdAt)
      ),
      vendedor: {
        nome: registro.criadoPor?.name || registro.criadoPor?.email || 'Defenz Cybersecurity',
        email: registro.criadoPor?.email || 'contato@defenz.com.br',
      },
      fatos,
      casos: (registro.casosSnapshot as CasoApresentado[] | null) ?? [],
      nivelDestaque: registro.nivelDestaque as NivelId,
      // Sem isto a reimpressão perderia a página dos complementos citados.
      complementos: (registro.complementosSnapshot as ComplementoId[] | null) ?? undefined,
    })

    const pdf = await renderPdf(html)
    const divergente = registro.templateVersao !== TEMPLATE_VERSAO

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(registro.arquivoNome)}"`,
        'Content-Length': String(pdf.length),
        ...(divergente
          ? { 'X-Apresentacao-Template-Divergente': registro.templateVersao }
          : {}),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
