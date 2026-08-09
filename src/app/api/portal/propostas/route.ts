import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, companyScopeWhere, resolveActiveCompany } from '@/lib/auth'
import { handleApiError, successResponse, ApiError } from '@/lib/api-helpers'
import { createAuditLog } from '@/lib/audit'
import { calcularInvestimento } from '@/lib/proposta/calculo'
import { renderPdf } from '@/lib/proposta/pdf'
import { arquivarNoOneDrive } from '@/lib/proposta/arquivamento'
import {
  montarDocumento,
  nextPropostaCodigo,
  nomeArquivo,
  renderPropostaHtml,
} from '@/lib/proposta/proposta-server'
import {
  ajusteAssinado,
  createPropostaSchema,
} from '@/lib/validations/proposta'
import type { Prisma } from '@prisma/client'

/** O Chromium precisa de folga: cold start + render de 12 páginas. */
export const maxDuration = 120

/** Cap do log. Invariante §9.4 do GUIA: nada de feed infinito. */
const MAX_ITENS = 200

/**
 * ⚠️ SÓ SESSÃO, sem Bearer — mesma regra da `/api/portal/ask` (spec §10).
 * Um token de serviço permanente que emite documento comercial em nome da
 * Defenz é exposição sem rastro. Por isso `getCurrentUser()`, não `resolveActor`.
 */
async function exigirSessao() {
  const user = await getCurrentUser()
  if (!user) throw new ApiError('Nao autorizado', 401)
  return user
}

/**
 * Gera a proposta: valida, reserva o número, calcula, imprime e grava.
 * Devolve o PDF direto, para o download acontecer no mesmo clique.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await exigirSessao()
    const body = await request.json()
    const dados = createPropostaSchema.parse(body)

    const companyId = resolveActiveCompany(user, dados.companyId ?? undefined)

    // 1. calcula ANTES de reservar número: quantidade fora da tabela recusa
    //    aqui e nenhum código de proposta é queimado à toa.
    const ajustePercent = ajusteAssinado(dados)
    const investimento = calcularInvestimento({
      quantidade: dados.quantidade,
      planos: dados.planos,
      ajustePercent,
    })

    // 2. reserva o número (atômico)
    const agora = new Date()
    const codigo = await nextPropostaCodigo(
      Number(
        new Intl.DateTimeFormat('en-CA', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
        }).format(agora)
      )
    )

    // 3. monta e imprime
    const documento = montarDocumento({
      codigo,
      clienteNome: dados.clienteNome,
      empresaNome: dados.empresaNome,
      investimento,
      vendedor: {
        nome: user.name || 'Comercial Defenz',
        email: user.email || 'contato@defenz.com.br',
      },
      agora,
    })
    const pdf = await renderPdf(renderPropostaHtml(documento))
    const arquivo = nomeArquivo(codigo, dados.empresaNome)

    // 4. grava o registro com o snapshot do preço aplicado
    const registro = await db.proposta.create({
      data: {
        codigo,
        tipo: dados.tipo,
        clienteNome: dados.clienteNome,
        empresaNome: dados.empresaNome,
        cnpj: dados.cnpj || null,
        oQueFaz: dados.oQueFaz || null,
        quantidade: dados.quantidade,
        planos: dados.planos,
        ajustePercent,
        precoSnapshot: investimento as unknown as Prisma.InputJsonValue,
        tabelaVigencia: investimento.tabelaVigencia,
        arquivoNome: arquivo,
        companyId,
        criadoPorId: user.id,
      },
      select: { id: true, codigo: true },
    })

    await createAuditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Proposta',
      entityId: registro.id,
      userEmail: user.email ?? '',
      changes: {
        codigo: { from: null, to: codigo },
        empresaNome: { from: null, to: dados.empresaNome },
        quantidade: { from: null, to: dados.quantidade },
        planos: { from: null, to: dados.planos.join(', ') },
        ajustePercent: { from: null, to: ajustePercent },
      },
    })

    // 5. arquiva no OneDrive. NUNCA derruba a geração (R5): se o Graph/n8n
    //    estiver fora, o vendedor leva o PDF do mesmo jeito e o registro fica
    //    marcado como "não arquivado" no log.
    const arquivado = await arquivarNoOneDrive({
      propostaId: registro.id,
      codigo,
      arquivoNome: arquivo,
      empresaNome: dados.empresaNome,
      pdf,
    })

    // 6. devolve o arquivo. O ID e o código viajam em header para a tela
    //    conseguir mostrar "proposta DFZ-… gerada" sem uma segunda chamada.
    return new NextResponse(new Uint8Array(pdf), {
      status: 201,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(arquivo)}"`,
        'Content-Length': String(pdf.length),
        'X-Proposta-Id': registro.id,
        'X-Proposta-Codigo': codigo,
        'X-Proposta-Arquivado': arquivado ? '1' : '0',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/** Log buscável: `q` (empresa, cliente ou CNPJ), `de`, `ate`. */
export async function GET(request: NextRequest) {
  try {
    const user = await exigirSessao()
    const { searchParams } = new URL(request.url)

    const filtros: Prisma.PropostaWhereInput[] = []

    const q = searchParams.get('q')?.trim()
    if (q) {
      filtros.push({
        OR: [
          { empresaNome: { contains: q, mode: 'insensitive' } },
          { clienteNome: { contains: q, mode: 'insensitive' } },
          { cnpj: { contains: q, mode: 'insensitive' } },
          { codigo: { contains: q, mode: 'insensitive' } },
        ],
      })
    }

    const de = searchParams.get('de')
    const ate = searchParams.get('ate')
    if (de || ate) {
      const createdAt: Prisma.DateTimeFilter = {}
      if (de) createdAt.gte = new Date(`${de}T00:00:00-03:00`)
      // `ate` é inclusivo: o vendedor que digita o dia de hoje espera ver o
      // que emitiu hoje, não um intervalo que termina à meia-noite.
      if (ate) createdAt.lte = new Date(`${ate}T23:59:59.999-03:00`)
      filtros.push({ createdAt })
    }

    // Escopo por AND explícito: o `OR` da busca NÃO pode engolir a cláusula de
    // tenant por spread (mesma classe do C3 do review do Portal).
    const where: Prisma.PropostaWhereInput = {
      AND: [companyScopeWhere(user), ...filtros],
    }

    const propostas = await db.proposta.findMany({
      where,
      select: {
        id: true,
        codigo: true,
        clienteNome: true,
        empresaNome: true,
        cnpj: true,
        quantidade: true,
        planos: true,
        ajustePercent: true,
        tabelaVigencia: true,
        arquivoNome: true,
        oneDriveItemId: true,
        arquivadoEm: true,
        createdAt: true,
        criadoPor: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_ITENS,
    })

    return successResponse(
      propostas.map((p) => ({
        ...p,
        ajustePercent: Number(p.ajustePercent),
        arquivado: Boolean(p.oneDriveItemId),
      }))
    )
  } catch (error) {
    return handleApiError(error)
  }
}
