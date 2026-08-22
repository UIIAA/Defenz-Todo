import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, resolveActiveCompany } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/api-helpers'
import { exigirEmissorDefenz } from '@/lib/emissao-documento'
import { createApresentacaoSchema } from '@/lib/validations/apresentacao'
import { renderPdf } from '@/lib/proposta/pdf'
import {
  renderApresentacaoHtml,
  TEMPLATE_VERSAO,
} from '@/lib/apresentacao/templates/institucional-a4'
import { fatosParaSetor } from '@/lib/apresentacao/mercado-fatos'
import { formatarDataSP } from '@/lib/apresentacao/apresentacao-server'
import { nomeArquivoApresentacao } from '@/lib/apresentacao/apresentacao-server'

export const maxDuration = 120

/**
 * Gera a apresentação institucional e devolve o PDF no mesmo clique.
 *
 * ⚠️ SÓ SESSÃO, sem Bearer, e só quem é da Defenz emite (spec §10.1). Documento
 * com a marca da Defenz não sai de token de serviço permanente.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)
    await exigirEmissorDefenz(user)

    const dados = createApresentacaoSchema.parse(await request.json())
    const companyId = resolveActiveCompany(user, dados.companyId ?? undefined)

    const setor = dados.setor?.trim() || undefined
    // Os fatos que EFETIVAMENTE entram — congelados no registro logo abaixo.
    const fatos = fatosParaSetor(setor)
    const agora = new Date()

    const html = renderApresentacaoHtml({
      clienteNome: dados.clienteNome,
      empresaNome: dados.empresaNome,
      setor,
      dataFormatada: formatarDataSP(agora),
      ano: Number(
        new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
        }).format(agora)
      ),
      vendedor: {
        nome: user.name || user.email || 'Defenz Cybersecurity',
        email: user.email || 'contato@defenz.com.br',
      },
      fatos,
      casos: [], // F2 é sem IA; a pesquisa de casos entra na F3
      nivelDestaque: dados.nivelDestaque,
    })

    const pdf = await renderPdf(html)
    const arquivoNome = nomeArquivoApresentacao(dados.empresaNome, agora)

    // Registro DEPOIS do render: sem número de série a queimar, gravar antes só
    // criaria linha órfã se o Chromium falhasse (a cicatriz da Proposta, §8).
    await db.apresentacao.create({
      data: {
        clienteNome: dados.clienteNome,
        empresaNome: dados.empresaNome,
        setor: setor ?? null,
        nivelDestaque: dados.nivelDestaque,
        fatosSnapshot: fatos.map((f) => ({
          id: f.id,
          texto: f.texto,
          valor: f.valor,
          fonte: f.fonte,
          ano: f.ano,
        })),
        templateVersao: TEMPLATE_VERSAO,
        arquivoNome,
        companyId,
        criadoPorId: user.id,
      },
    })

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(arquivoNome)}"`,
        'Content-Length': String(pdf.length),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
