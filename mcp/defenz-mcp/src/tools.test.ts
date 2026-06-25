import { describe, it, expect, vi } from 'vitest'
import { buildHandlers } from './tools.js'
import { DefenzApiError } from './client.js'

// structuredContent é opcional (ausente em erros). Helper para acessar nos casos de sucesso.
const sc = (r: { structuredContent?: Record<string, unknown> }) =>
  r.structuredContent as Record<string, any>


function fakeClient(
  over: Partial<
    Record<'list' | 'create' | 'update' | 'createSubtask' | 'updateSubtask', any>
  > = {}
) {
  return {
    list: vi.fn(over.list ?? (async () => [])),
    create: vi.fn(over.create ?? (async (x: any) => ({ id: 'new', ...x }))),
    update: vi.fn(over.update ?? (async (x: any) => ({ id: x.id, ...x }))),
    createSubtask: vi.fn(
      over.createSubtask ??
        (async (_demandaId: string, x: any) => ({ id: 'st_new', completed: false, ...x }))
    ),
    updateSubtask: vi.fn(
      over.updateSubtask ??
        (async (_demandaId: string, subtaskId: string, x: any) => ({ id: subtaskId, ...x }))
    ),
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

  it('resolve `company` (nome) para companyId antes de criar', async () => {
    const client = fakeClient()
    const h = buildHandlers(client as any)

    await h.create_demanda({ title: 'X', company: 'Grafono' })

    expect(client.create).toHaveBeenCalledWith({ title: 'X', companyId: 'cmnuwl2yg0002l7046rwhmxu9' })
  })

  it('empresa desconhecida retorna erro e NÃO chama a API', async () => {
    const client = fakeClient()
    const h = buildHandlers(client as any)

    const res = await h.create_demanda({ title: 'X', company: 'Inexistente' })

    expect(res.isError).toBe(true)
    expect(client.create).not.toHaveBeenCalled()
    expect(res.content[0].text).toMatch(/desconhecida/i)
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

  it('resolve `company` para companyId (mover card entre projetos)', async () => {
    const client = fakeClient()
    const h = buildHandlers(client as any)

    await h.update_demanda({ id: 'd1', company: 'Cow Cycling' })

    expect(client.update).toHaveBeenCalledWith({ id: 'd1', companyId: 'cmnd3a1yr000q3oq80irkal13' })
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

describe('add_subtask handler', () => {
  it('cria subtarefa via client.createSubtask e devolve o objeto criado', async () => {
    const client = fakeClient({
      createSubtask: async (_d: string, x: any) => ({
        id: 'st1',
        title: x.title,
        completed: false,
        spentMinutes: x.spentMinutes ?? 0,
      }),
    })
    const h = buildHandlers(client as any)

    const res = await h.add_subtask({ demandaId: 'd1', title: 'Sub A', spentMinutes: 60 })

    expect(client.createSubtask).toHaveBeenCalledWith('d1', { title: 'Sub A', spentMinutes: 60 })
    expect(res.isError).toBeFalsy()
    expect(sc(res).id).toBe('st1')
    expect(res.content[0].text).toContain('Sub A')
  })

  it('com completed:true cria e depois conclui a subtarefa (POST + PUT)', async () => {
    const client = fakeClient({
      createSubtask: async () => ({ id: 'st2', title: 'X', completed: false }),
      updateSubtask: async (_d: string, id: string) => ({ id, title: 'X', completed: true }),
    })
    const h = buildHandlers(client as any)

    const res = await h.add_subtask({ demandaId: 'd1', title: 'X', completed: true })

    expect(client.createSubtask).toHaveBeenCalledWith('d1', { title: 'X' })
    expect(client.updateSubtask).toHaveBeenCalledWith('d1', 'st2', { completed: true })
    expect(sc(res).completed).toBe(true)
    expect(res.content[0].text).toMatch(/conclu/i)
  })

  it('erro de API vira resultado de erro acionável (não lança)', async () => {
    const client = fakeClient({
      createSubtask: async () => {
        throw new DefenzApiError('Demanda nao encontrada', 404)
      },
    })
    const h = buildHandlers(client as any)

    const res = await h.add_subtask({ demandaId: 'dX', title: 'Y' })

    expect(res.isError).toBe(true)
    expect(res.content[0].text).toMatch(/404|encontrada/i)
  })
})

describe('complete_subtask handler', () => {
  it('marca a subtarefa como concluída', async () => {
    const client = fakeClient({
      updateSubtask: async (_d: string, id: string, x: any) => ({ id, completed: x.completed }),
    })
    const h = buildHandlers(client as any)

    const res = await h.complete_subtask({ demandaId: 'd1', subtaskId: 'st1', completed: true })

    expect(client.updateSubtask).toHaveBeenCalledWith('d1', 'st1', { completed: true })
    expect(sc(res).completed).toBe(true)
    expect(res.content[0].text).toMatch(/conclu/i)
  })

  it('subtaskId inexistente vira erro 404 acionável', async () => {
    const client = fakeClient({
      updateSubtask: async () => {
        throw new DefenzApiError('Subtask nao encontrada', 404)
      },
    })
    const h = buildHandlers(client as any)

    const res = await h.complete_subtask({ demandaId: 'd1', subtaskId: 'nope', completed: true })

    expect(res.isError).toBe(true)
    expect(res.content[0].text).toMatch(/404|encontrada/i)
  })
})

describe('list_subtasks handler', () => {
  it('lista as subtarefas do card a partir do GET de demandas', async () => {
    const demandas = [
      {
        id: 'd1',
        title: 'Card',
        status: 'em_andamento',
        subtasks: [
          { id: 's1', title: 'Sub 1', completed: false, spentMinutes: 30 },
          { id: 's2', title: 'Sub 2', completed: true, spentMinutes: 0 },
        ],
      },
      { id: 'd2', title: 'Outro', status: 'solicitada', subtasks: [] },
    ]
    const client = fakeClient({ list: async () => demandas })
    const h = buildHandlers(client as any)

    const res = await h.list_subtasks({ demandaId: 'd1' })

    expect(res.isError).toBeFalsy()
    expect(sc(res).count).toBe(2)
    expect(sc(res).subtasks[0].id).toBe('s1')
    expect(res.content[0].text).toContain('s1')
  })

  it('card inexistente devolve erro acionável', async () => {
    const client = fakeClient({ list: async () => [] })
    const h = buildHandlers(client as any)

    const res = await h.list_subtasks({ demandaId: 'nope' })

    expect(res.isError).toBe(true)
    expect(res.content[0].text).toMatch(/encontrad/i)
  })
})

describe('list_user_tasks handler', () => {
  it('filtra os cards pelo responsável (nome OU e-mail, acento/caixa-insensível)', async () => {
    const demandas = [
      { id: 'd1', title: 'A', status: 'em_andamento', assignee: 'Leonardo Silva', spentMinutes: 120 },
      { id: 'd2', title: 'B', status: 'solicitada', assignee: 'Marcos Cruz', spentMinutes: 0 },
      {
        id: 'd3',
        title: 'C',
        status: 'concluida',
        assignee: null,
        user: { name: 'leonardo silva', email: 'leo@defenz.com' },
      },
    ]
    const client = fakeClient({ list: async () => demandas })
    const h = buildHandlers(client as any)

    const res = await h.list_user_tasks({ user: 'leonardo' })

    expect(res.isError).toBeFalsy()
    expect(sc(res).count).toBe(2)
    expect(sc(res).tasks.map((t: any) => t.id)).toEqual(['d1', 'd3'])
  })

  it('com `company` resolve o nome para companyId no filtro do list', async () => {
    const client = fakeClient({ list: async () => [] })
    const h = buildHandlers(client as any)

    await h.list_user_tasks({ user: 'qualquer', company: 'Grafono' })

    expect(client.list).toHaveBeenCalledWith({ companyId: 'cmnuwl2yg0002l7046rwhmxu9' })
  })

  it('sem match retorna lista vazia com mensagem acionável (não erro)', async () => {
    const demandas = [{ id: 'd1', title: 'A', status: 'em_andamento', assignee: 'Outra Pessoa' }]
    const client = fakeClient({ list: async () => demandas })
    const h = buildHandlers(client as any)

    const res = await h.list_user_tasks({ user: 'fulano inexistente' })

    expect(res.isError).toBeFalsy()
    expect(sc(res).count).toBe(0)
    expect(res.content[0].text).toMatch(/nenhuma tarefa/i)
  })

  it('empresa desconhecida retorna erro e NÃO chama a API', async () => {
    const client = fakeClient()
    const h = buildHandlers(client as any)

    const res = await h.list_user_tasks({ user: 'x', company: 'Inexistente' })

    expect(res.isError).toBe(true)
    expect(client.list).not.toHaveBeenCalled()
    expect(res.content[0].text).toMatch(/desconhecida/i)
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
