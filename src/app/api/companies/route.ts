import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, accessibleCompanyIds, assertCompanyAccess } from '@/lib/auth'
import { handleApiError, successResponse, createdResponse, ApiError } from '@/lib/api-helpers'

/** Teto de listagem (invariante I5). Folgado: hoje o sistema tem poucas dezenas de empresas. */
const MAX_COMPANIES = 500

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    if (!['admin', 'gerencia'].includes(user.role)) {
      throw new ApiError('Sem permissao', 403)
    }

    // Admin ve todas; gerencia ve apenas as empresas do seu CONJUNTO (multi-empresa).
    // A entidade é a própria Company, então o escopo é por `id` (não `companyId`).
    const ids = accessibleCompanyIds(user) // null = admin
    const where =
      ids === null ? {} : ids.length === 1 ? { id: ids[0] } : { id: { in: ids } }

    const companies = await db.company.findMany({
      take: MAX_COMPANIES,
      where,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        accentColor: true,
        _count: { select: { users: true, teams: true } },
      },
    })

    return successResponse(companies)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    if (user.role !== 'admin') {
      throw new ApiError('Sem permissao', 403)
    }

    const body = await request.json()
    const { name, logoUrl, accentColor } = body as {
      name?: string
      logoUrl?: string
      accentColor?: string
    }

    if (!name || !name.trim()) {
      throw new ApiError('Nome da empresa e obrigatorio', 400)
    }

    if (accentColor && !HEX_COLOR_REGEX.test(accentColor)) {
      throw new ApiError('Cor accent deve ser hex valido (ex: #2563eb)', 400)
    }

    const company = await db.company.create({
      data: {
        name: name.trim(),
        logoUrl: logoUrl?.trim() || null,
        accentColor: accentColor || null,
      },
      select: {
        id: true,
        name: true,
        logoUrl: true,
        accentColor: true,
        _count: { select: { users: true, teams: true } },
      },
    })

    return createdResponse(company, 'Empresa criada com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    // Admin pode editar qualquer empresa; gerencia pode editar branding da sua
    if (!['admin', 'gerencia'].includes(user.role)) {
      throw new ApiError('Sem permissao', 403)
    }

    const body = await request.json()
    const { id, name, logoUrl, accentColor } = body as {
      id?: string
      name?: string
      logoUrl?: string | null
      accentColor?: string | null
    }

    if (!id) throw new ApiError('ID e obrigatorio', 400)

    if (accentColor && !HEX_COLOR_REGEX.test(accentColor)) {
      throw new ApiError('Cor accent deve ser hex valido (ex: #2563eb)', 400)
    }

    const existing = await db.company.findUnique({ where: { id } })
    if (!existing) throw new ApiError('Empresa nao encontrada', 404)

    // Gerencia so pode editar branding de empresa do seu conjunto
    if (user.role === 'gerencia') {
      assertCompanyAccess(id, user)
      // Gerencia nao pode renomear empresa
      const data: Record<string, unknown> = {}
      if (logoUrl !== undefined) data.logoUrl = logoUrl?.trim() || null
      if (accentColor !== undefined) data.accentColor = accentColor || null

      const company = await db.company.update({
        where: { id },
        data,
        select: {
          id: true, name: true, logoUrl: true, accentColor: true,
          _count: { select: { users: true, teams: true } },
        },
      })
      return successResponse(company, 'Branding atualizado')
    }

    // Admin: pode editar tudo
    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name.trim()
    if (logoUrl !== undefined) data.logoUrl = logoUrl?.trim() || null
    if (accentColor !== undefined) data.accentColor = accentColor || null

    const company = await db.company.update({
      where: { id },
      data,
      select: {
        id: true, name: true, logoUrl: true, accentColor: true,
        _count: { select: { users: true, teams: true } },
      },
    })

    return successResponse(company, 'Empresa atualizada')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    if (user.role !== 'admin') {
      throw new ApiError('Sem permissao', 403)
    }

    const id = new URL(request.url).searchParams.get('id')
    if (!id) throw new ApiError('ID e obrigatorio', 400)

    const existing = await db.company.findUnique({
      where: { id },
      select: { id: true, name: true, _count: { select: { users: true, teams: true } } },
    })
    if (!existing) throw new ApiError('Empresa nao encontrada', 404)

    if (existing._count.users > 0 || existing._count.teams > 0) {
      throw new ApiError(
        `Nao e possivel remover empresa com ${existing._count.users} usuario(s) e ${existing._count.teams} equipe(s). Mova-os primeiro.`,
        400
      )
    }

    await db.company.delete({ where: { id } })

    return successResponse(null, 'Empresa removida')
  } catch (error) {
    return handleApiError(error)
  }
}
