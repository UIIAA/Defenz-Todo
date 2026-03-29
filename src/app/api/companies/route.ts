import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { handleApiError, successResponse, createdResponse, ApiError } from '@/lib/api-helpers'

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) throw new ApiError('Nao autorizado', 401)

    // Somente admin pode listar todas as empresas
    if (user.role !== 'admin') {
      throw new ApiError('Sem permissao', 403)
    }

    const companies = await db.company.findMany({
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

    if (user.role !== 'admin') {
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

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name.trim()
    if (logoUrl !== undefined) data.logoUrl = logoUrl?.trim() || null
    if (accentColor !== undefined) data.accentColor = accentColor || null

    const company = await db.company.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        logoUrl: true,
        accentColor: true,
        _count: { select: { users: true, teams: true } },
      },
    })

    return successResponse(company, 'Empresa atualizada')
  } catch (error) {
    return handleApiError(error)
  }
}
