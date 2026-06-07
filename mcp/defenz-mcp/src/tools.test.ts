import { describe, it, expect, vi } from 'vitest'
import { buildHandlers } from './tools.js'
import { DefenzApiError } from './client.js'

// structuredContent é opcional (ausente em erros). Helper para acessar nos casos de sucesso.
const sc = (r: { structuredContent?: Record<string, unknown> }) =>
  r.structuredContent as Record<string, any>


function fakeClient(over: Partial<Record<'list' | 'create' | 'update', any>> = {}) {
  return {
    list: vi.fn(over.list ?? (async () => [])),
    create: vi.fn(over.create ?? (async (x: any) => ({ id: 'new', ...x }))),
    update: vi.fn(over.update ?? (async (x: any) => ({ id: x.id, ...x }))),
  }
}

describe('list_demandas handler', () => {
  it('returns items and count from client.list', async () => {
    const demandas = [
      { id: 'd1', title: 'A', status: 'solicitada' },
      { id: 'd2', title: 'B', status: 'em_andamento' },
    ]
    const client = fakeClient({ list: async () => demandas })
    const h = buildHandlers(client as any)

    const res = await h.list_demandas({})

    expect(client.list).toHaveBeenCalledOnce()
    expect(res.isError).toBeFalsy()
    expect(sc(res).count).toBe(2)
    expect(sc(res).demandas).toHaveLength(2)
    expect(res.content[0].text).toContain('d1')
  })

  it('filters by status client-side', async () => {
    const demandas = [
      { id: 'd1', title: 'A', status: 'solicitada' },
      { id: 'd2', title: 'B', status: 'em_andamento' },
    ]
    const client = fakeClient({ list: async () => demandas })
    const h = buildHandlers(client as any)

    const res = await h.list_demandas({ status: 'em_andamento' })

    expect(sc(res).count).toBe(1)
    expect(sc(res).demandas[0].id).toBe('d2')
  })

  it('respects limit', async () => {
    const demandas = Array.from({ length: 5 }, (_, i) => ({
      id: `d${i}`,
      title: `T${i}`,
      status: 'solicitada',
    }))
    const client = fakeClient({ list: async () => demandas })
    const h = buildHandlers(client as any)

    const res = await h.list_demandas({ limit: 2 })

    expect(sc(res).count).toBe(2)
  })

  it('returns a friendly message when empty', async () => {
    const client = fakeClient({ list: async () => [] })
    const h = buildHandlers(client as any)

    const res = await h.list_demandas({})

    expect(res.content[0].text).toMatch(/nenhuma demanda/i)
  })
})

describe('create_demanda handler', () => {
  it('calls client.create with the given fields and returns the created demanda', async () => {
    const client = fakeClient({
      create: async () => ({ id: 'c1', title: 'Nova', status: 'solicitada' }),
    })
    const h = buildHandlers(client as any)

    const res = await h.create_demanda({ title: 'Nova', priority: 'alta' })

    expect(client.create).toHaveBeenCalledWith({ title: 'Nova', priority: 'alta' })
    expect(sc(res).id).toBe('c1')
    expect(res.content[0].text).toContain('Nova')
  })
})

describe('update_demanda handler', () => {
  it('calls client.update with id + fields', async () => {
    const client = fakeClient({
      update: async (x: any) => ({ id: x.id, title: 'Edit', status: 'concluida' }),
    })
    const h = buildHandlers(client as any)

    const res = await h.update_demanda({ id: 'u1', status: 'concluida' })

    expect(client.update).toHaveBeenCalledWith({ id: 'u1', status: 'concluida' })
    expect(sc(res).id).toBe('u1')
  })
})

describe('move_demanda handler', () => {
  it('resolves a human column to status and calls client.update', async () => {
    const client = fakeClient({
      update: async (x: any) => ({ id: x.id, status: x.status }),
    })
    const h = buildHandlers(client as any)

    const res = await h.move_demanda({ id: 'm1', column: 'Em Andamento' })

    expect(client.update).toHaveBeenCalledWith({ id: 'm1', status: 'em_andamento' })
    expect(sc(res).status).toBe('em_andamento')
    expect(res.content[0].text).toMatch(/em_andamento/)
  })

  it('does NOT call the API for an unknown column and returns an actionable error', async () => {
    const client = fakeClient()
    const h = buildHandlers(client as any)

    const res = await h.move_demanda({ id: 'm1', column: 'Arquivada' })

    expect(res.isError).toBe(true)
    expect(client.update).not.toHaveBeenCalled()
    expect(res.content[0].text).toMatch(/coluna desconhecida/i)
  })
})

describe('error handling (all handlers)', () => {
  it('maps a DefenzApiError 403 to an actionable error result', async () => {
    const client = fakeClient({
      update: async () => {
        throw new DefenzApiError('Sem permissao', 403)
      },
    })
    const h = buildHandlers(client as any)

    const res = await h.update_demanda({ id: 'x', status: 'concluida' })

    expect(res.isError).toBe(true)
    expect(res.content[0].text).toMatch(/permiss|empresa|403/i)
  })

  it('maps a 401 to a token-hint error', async () => {
    const client = fakeClient({
      list: async () => {
        throw new DefenzApiError('Nao autorizado', 401)
      },
    })
    const h = buildHandlers(client as any)

    const res = await h.list_demandas({})

    expect(res.isError).toBe(true)
    expect(res.content[0].text).toMatch(/token/i)
  })
})
