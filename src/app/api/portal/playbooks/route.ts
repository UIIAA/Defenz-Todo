import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { resolveActor, resolveActiveCompany, isAdmin } from '@/lib/auth'
import {
  handleApiError,
  successResponse,
  createdResponse,
  ApiError,
} from '@/lib/api-helpers'
import { scopedPlaybookWhere } from '@/lib/playbook-scope'
import { nextReviewDueAt } from '@/lib/playbook-freshness'
import { createPlaybookSchema } from '@/lib/validations/playbook'
import { createAuditLog } from '@/lib/audit'

/** Cap de itens: o Portal não é feed infinito. Invariante §9.4 do GUIA. */
const MAX_ITEMS = 200

/**
 * Lista playbooks do escopo do ator (empresa(s) + globais).
 * Filtros: `kind`, `tag`, `archived`, `q` (busca em título E corpo).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await resolveActor(request)
    const { searchParams } = new URL(request.url)

    const filtros: Record<string, unknown> = {
      isArchived: searchParams.get('archived') === 'true',
    }

    const kind = searchParams.get('kind')
    if (kind) filtros.kind = kind

    const tag = searchParams.get('tag')
    if (tag) filtros.tags = { has: tag }

    const q = searchParams.get('q')?.trim()
    if (q) {
      // Busca no CORPO é o requisito real: sem ela a equipe não acha o
      // procedimento e volta pro Drive. `contains` basta nesta escala — ver §3.2
      // da spec (índice GIN foi cortado do MVP de propósito).
      filtros.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { body: { contains: q, mode: 'insensitive' } },
      ]
    }

    // scopedPlaybookWhere combina por AND internamente: o `OR` da busca acima
    // NÃO pode engolir a cláusula de tenant.
    const playbooks = await db.playbook.findMany({
      where: scopedPlaybookWhere(user, filtros),
      select: {
        id: true,
        kind: true,
        title: true,
        tags: true,
        companyId: true,
        externalUrl: true,
        verifiedAt: true,
        reviewDueAt: true,
        updatedAt: true,
        owner: { select: { name: true, email: true } },
      },
      orderBy: [{ reviewDueAt: 'asc' }, { updatedAt: 'desc' }],
      take: MAX_ITEMS,
    })

    return successResponse(playbooks)
  } catch (error) {
    return handleApiError(error)
  }
}

/** Cria um playbook. Global (`companyId=null`) é privilégio de admin. */
export async function POST(request: NextRequest) {
  try {
    const user = await resolveActor(request)
    const data = createPlaybookSchema.parse(await request.json())

    if (!isAdmin(user) && data.companyId === null) {
      throw new ApiError('Só admin cria conteúdo global', 403)
    }

    const companyId = isAdmin(user)
      ? (data.companyId ?? null)
      : resolveActiveCompany(user, data.companyId ?? undefined)

    const agora = new Date()
    const playbook = await db.playbook.create({
      data: {
        kind: data.kind,
        title: data.title,
        body: data.body,
        externalUrl: data.externalUrl ?? null,
        tags: data.tags,
        companyId,
        ownerId: data.ownerId ?? user.id,
        reviewIntervalDays: data.reviewIntervalDays,
        // Relógio de frescor nasce rodando: sem isto um POP nunca verificado
        // ficaria invisível ao motor de frescor para sempre.
        reviewDueAt: nextReviewDueAt(data.reviewIntervalDays, agora),
        createdById: user.id,
      },
    })

    await createAuditLog({
      action: 'CREATE',
      entityType: 'Playbook',
      entityId: playbook.id,
      userId: user.id,
      userEmail: user.email ?? '',
      changes: { title: { from: null, to: data.title } },
    })

    return createdResponse(playbook)
  } catch (error) {
    return handleApiError(error)
  }
}
