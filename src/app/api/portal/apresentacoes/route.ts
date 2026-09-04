import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, resolveActiveCompany, companyScopeWhere } from '@/lib/auth'
import type { Prisma } from '@prisma/client'
import { handleApiError, ApiError } from '@/lib/api-helpers'
import { exigirEmissorDefenz } from '@/lib/emissao-documento'
import { createApresentacaoSchema } from '@/lib/validations/apresentacao'
import { renderPdf } from '@/lib/proposta/pdf'
import {
  renderApresentacaoHtml,
  TEMPLATE_VERSAO,
} from '@/lib/apresentacao/templates/institucional-a4'
import { fatosParaSetor } from '@/lib/apresentacao/mercado-fatos'
import { revisarCasos, exigirAceite } from '@/lib/apresentacao/pesquisa/revisao'
import type { CasoApresentado } from '@/lib/apresentacao/templates/institucional-a4'
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

    // ⚠️ Os casos NÃO são aceitos como vieram: as guardas rodam de novo contra o
    // texto da pesquisa GUARDADO NO BANCO. O que o navegador manda é proposta de
    // conteúdo, não veredito.
    let casos: CasoApresentado[] = []
    let recusados = 0
    if (dados.casos.length > 0 && dados.pesquisaId) {
      const pesquisa = await db.apresentacaoPesquisa.findFirst({
        where: { id: dados.pesquisaId, ...companyScopeWhere(user) },
        select: { textoPesquisa: true, fontes: true },
      })
      if (!pesquisa?.textoPesquisa) {
        throw new ApiError('Pesquisa não encontrada — refaça a pesquisa antes de gerar.', 400)
      }
      exigirAceite(dados.aceite, dados.casos.length)

      const qtdFontes = Array.isArray(pesquisa.fontes) ? pesquisa.fontes.length : 0
      const revisao = revisarCasos(dados.casos, pesquisa.textoPesquisa, qtdFontes)
      recusados = revisao.recusados.length
      casos = revisao.aprovados.map((v) => ({
        oQueAconteceu: v.caso.oQueAconteceu,
        necessidade: v.caso.necessidade,
        funcionalidade: v.caso.funcionalidade,
        veiculo: v.caso.veiculo,
        ano: v.caso.ano,
      }))

      // Nada de erro silencioso: se algo ficou de fora, o vendedor precisa saber
      // ANTES de mandar o PDF ao cliente — não descobrir pela ausência.
      if (recusados > 0) {
        throw new ApiError(
          `${recusados} caso(s) continuam barrados pelas guardas e não podem entrar. ` +
            'Edite o texto ou marque "liberar mesmo assim" na revisão.',
          400
        )
      }
    }

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
      casos,
      nivelDestaque: dados.nivelDestaque,
      complementos: dados.complementos,
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
        // Congelado pela mesma razão do fatosSnapshot: a descrição do módulo
        // vem do catálogo, e catálogo muda (crítica C1).
        complementosSnapshot: dados.complementos.length ? dados.complementos : undefined,
        // Congelados: sem isto a reimpressão perderia a página de casos.
        casosSnapshot: casos.length ? (casos as unknown as Prisma.InputJsonValue) : undefined,
        pesquisaId: dados.pesquisaId ?? undefined,
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


/** Cap duro de listagem (I5). */
const MAX_ITENS = 200

/**
 * Log das apresentações emitidas, buscável.
 *
 * ⚠️ Aqui NÃO se exige emissor Defenz: consultar o que já saiu é diferente de
 * emitir. O escopo de tenant continua valendo — quem é de outra empresa não vê.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    const { searchParams } = new URL(request.url)
    const filtros: Prisma.ApresentacaoWhereInput[] = []

    const q = searchParams.get('q')?.trim()
    if (q) {
      filtros.push({
        OR: [
          { empresaNome: { contains: q, mode: 'insensitive' } },
          { clienteNome: { contains: q, mode: 'insensitive' } },
          { setor: { contains: q, mode: 'insensitive' } },
        ],
      })
    }

    const de = searchParams.get('de')
    const ate = searchParams.get('ate')
    if (de || ate) {
      const createdAt: Prisma.DateTimeFilter = {}
      if (de) createdAt.gte = new Date(`${de}T00:00:00-03:00`)
      // `ate` inclusivo: quem digita hoje espera ver o que emitiu hoje.
      if (ate) createdAt.lte = new Date(`${ate}T23:59:59.999-03:00`)
      filtros.push({ createdAt })
    }

    // Escopo por AND explícito: o `OR` da busca não pode engolir o tenant por
    // spread (invariante I2).
    const where: Prisma.ApresentacaoWhereInput = {
      AND: [companyScopeWhere(user), ...filtros],
    }

    const apresentacoes = await db.apresentacao.findMany({
      where,
      select: {
        id: true,
        clienteNome: true,
        empresaNome: true,
        setor: true,
        nivelDestaque: true,
        templateVersao: true,
        arquivoNome: true,
        createdAt: true,
        criadoPor: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_ITENS,
    })

    return NextResponse.json({ success: true, data: apresentacoes })
  } catch (error) {
    return handleApiError(error)
  }
}
