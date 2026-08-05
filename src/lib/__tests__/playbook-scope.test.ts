import { describe, it, expect } from 'vitest'
import { scopedPlaybookWhere } from '../playbook-scope'

const userA = { role: 'user', companyId: 'A', companyIds: [] as string[] }
const gerenciaAB = { role: 'gerencia', companyId: 'A', companyIds: ['B'] }
const admin = { role: 'admin', companyId: 'A', companyIds: [] as string[] }

describe('scopedPlaybookWhere', () => {
  it('usuário vê a própria empresa + os globais (companyId null)', () => {
    expect(scopedPlaybookWhere(userA)).toEqual({
      AND: [{ OR: [{ companyId: 'A' }, { companyId: null }] }, {}],
    })
  })

  it('multi-empresa usa `in` + globais', () => {
    expect(scopedPlaybookWhere(gerenciaAB)).toEqual({
      AND: [{ OR: [{ companyId: { in: ['A', 'B'] } }, { companyId: null }] }, {}],
    })
  })

  it('admin não é filtrado (cruza empresas)', () => {
    expect(scopedPlaybookWhere(admin, { isArchived: false })).toEqual({ isArchived: false })
  })

  it('sad path: filtro com OR próprio NÃO engole o escopo', () => {
    const busca = {
      OR: [
        { title: { contains: 'bm', mode: 'insensitive' as const } },
        { body: { contains: 'bm', mode: 'insensitive' as const } },
      ],
    }
    const where = scopedPlaybookWhere(userA, busca) as { AND: unknown[] }

    expect(where.AND).toHaveLength(2)
    expect(where.AND[0]).toEqual({ OR: [{ companyId: 'A' }, { companyId: null }] })
    expect(where.AND[1]).toEqual(busca)
  })
})
