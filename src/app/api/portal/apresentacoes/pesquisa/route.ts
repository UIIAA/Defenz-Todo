import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'
import { getCurrentUser, resolveActiveCompany } from '@/lib/auth'
import { handleApiError, ApiError } from '@/lib/api-helpers'
import { exigirEmissorDefenz } from '@/lib/emissao-documento'
import { pesquisaSchema } from '@/lib/validations/apresentacao-pesquisa'
import { pesquisar, PesquisaSemGroundingError } from '@/lib/apresentacao/pesquisa/gemini'
import { inicioDoDiaSP } from '@/lib/apresentacao/apresentacao-server'

export const maxDuration = 120

/** Cap diário por empresa (§6.8). Contado no banco, não em memória do lambda. */
const CAP_DIARIO = Number(process.env.APRESENTACAO_PESQUISA_CAP_DIA || 20)

/**
 * A pesquisa de nicho. **Não grava apresentação e não gera arquivo** (spec §4):
 * o vendedor precisa ver o resultado antes de existir documento, e refazer não
 * pode custar um PDF gravado.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)
    await exigirEmissorDefenz(user)

    const dados = pesquisaSchema.parse(await request.json())
    const companyId = resolveActiveCompany(user, dados.companyId ?? undefined)

    // ⚠️ O cap é contado no banco de propósito: o rate limit em memória do lambda
    // não segura custo nenhum, porque cada invocação nasce com o contador zerado.
    const hoje = await db.apresentacaoPesquisa.count({
      where: { companyId, createdAt: { gte: inicioDoDiaSP(new Date()) } },
    })
    if (hoje >= CAP_DIARIO) {
      throw new ApiError(
        `Limite de ${CAP_DIARIO} pesquisas por dia atingido para esta empresa. A geração da apresentação continua liberada.`,
        429
      )
    }

    try {
      const r = await pesquisar({
        empresaNome: dados.empresaNome,
        setor: dados.setor,
        site: dados.site,
        desde: dados.desde,
      })

      const registro = await db.apresentacaoPesquisa.create({
        data: {
          empresaNome: dados.empresaNome,
          setor: dados.setor,
          sucesso: true,
          // Guardados para a GERAÇÃO reconferir os dígitos contra o texto do
          // servidor, e não contra o que o navegador devolver.
          textoPesquisa: r.textoPesquisa,
          fontes: r.fontes as unknown as Prisma.InputJsonValue,
          latenciaMs: r.telemetria.latenciaMs,
          modelo: r.telemetria.modelo,
          qtdFontes: r.telemetria.qtdFontes,
          qtdCasos: r.casos.length,
          qtdBarrados: r.casos.filter((c) => c.bloqueado).length,
          companyId,
          criadoPorId: user.id,
        },
      })

      return NextResponse.json({ success: true, data: { ...r, pesquisaId: registro.id } })
    } catch (erro) {
      // A chamada foi paga mesmo tendo falhado: conta para o cap.
      await db.apresentacaoPesquisa.create({
        data: {
          empresaNome: dados.empresaNome,
          setor: dados.setor,
          sucesso: false,
          erro: erro instanceof Error ? erro.message.slice(0, 300) : 'desconhecido',
          companyId,
          criadoPorId: user.id,
        },
      })
      // ⚠️ Sem fonte não há citação. É resultado legítimo, não erro de servidor:
      // a tela diz "não encontrei" e o documento sai institucional (§6.7).
      if (erro instanceof PesquisaSemGroundingError) {
        return NextResponse.json({
          success: true,
          data: {
            panoramaSetor: '',
            casos: [],
            fontes: [],
            planoSugerido: 'PREMIUM',
            planoPorque: '',
            textoPesquisa: '',
            semResultado: true,
          },
        })
      }
      throw erro
    }
  } catch (error) {
    return handleApiError(error)
  }
}
