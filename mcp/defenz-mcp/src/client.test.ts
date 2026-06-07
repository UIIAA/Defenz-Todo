import { describe, it, expect, vi } from 'vitest'
import { DefenzClient, DefenzApiError } from './client.js'

type Call = { url: string; init: RequestInit }

function fakeFetch(response: { status?: number; body?: unknown; text?: string }) {
  const calls: Call[] = []
  const impl = vi.fn(async (url: string | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} })
    const status = response.status ?? 200
    const payload =
      response.text !== undefined ? response.text : JSON.stringify(response.body ?? {})
    return new Response(payload, {
      status,
      headers: { 'content-type': 'application/json' },
    })
  })
  return { impl: impl as unknown as typeof fetch, calls }
}

function makeClient(fetchImpl: typeof fetch) {
  return new DefenzClient({
    baseUrl: 'https://defenz.example',
    token: 'defz_' + 'a'.repeat(56),
    fetchImpl,
  })
}

describe('DefenzClient.list', () => {
  it('GETs /api/demandas with Bearer auth and returns data array', async () => {
    const demandas = [{ id: 'd1', title: 'A', status: 'solicitada' }]
    const { impl, calls } = fakeFetch({ body: { success: true, data: demandas } })
    const client = makeClient(impl)

    const result = await client.list()

    expect(result).toEqual(demandas)
    expect(calls[0].url).toBe('https://defenz.example/api/demandas')
    expect(calls[0].init.method).toBe('GET')
    const headers = new Headers(calls[0].init.headers)
    expect(headers.get('authorization')).toBe('Bearer defz_' + 'a'.repeat(56))
  })

  it('appends companyId and teamId as query params', async () => {
    const { impl, calls } = fakeFetch({ body: { success: true, data: [] } })
    const client = makeClient(impl)

    await client.list({ companyId: 'c1', teamId: 't1' })

    const url = new URL(calls[0].url)
    expect(url.searchParams.get('companyId')).toBe('c1')
    expect(url.searchParams.get('teamId')).toBe('t1')
  })
})

describe('DefenzClient.create', () => {
  it('POSTs JSON body with auth and returns created demanda', async () => {
    const created = { id: 'd2', title: 'Nova', status: 'solicitada' }
    const { impl, calls } = fakeFetch({ status: 201, body: { success: true, data: created } })
    const client = makeClient(impl)

    const result = await client.create({ title: 'Nova' })

    expect(result).toEqual(created)
    expect(calls[0].init.method).toBe('POST')
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ title: 'Nova' })
    const headers = new Headers(calls[0].init.headers)
    expect(headers.get('content-type')).toContain('application/json')
    expect(headers.get('authorization')).toContain('Bearer ')
  })
})

describe('DefenzClient.update', () => {
  it('PUTs JSON body (with id) and returns updated demanda', async () => {
    const updated = { id: 'd3', title: 'X', status: 'em_andamento' }
    const { impl, calls } = fakeFetch({ body: { success: true, data: updated } })
    const client = makeClient(impl)

    const result = await client.update({ id: 'd3', status: 'em_andamento' })

    expect(result).toEqual(updated)
    expect(calls[0].init.method).toBe('PUT')
    expect(JSON.parse(calls[0].init.body as string)).toEqual({ id: 'd3', status: 'em_andamento' })
  })
})

describe('DefenzClient error handling', () => {
  it('throws DefenzApiError with status + server message on non-2xx JSON', async () => {
    const { impl } = fakeFetch({ status: 403, body: { success: false, error: 'Sem permissao' } })
    const client = makeClient(impl)

    await expect(client.update({ id: 'd-y', status: 'em_andamento' })).rejects.toMatchObject({
      status: 403,
    })
    await expect(client.update({ id: 'd-y', status: 'em_andamento' })).rejects.toThrowError(
      /Sem permissao/
    )
  })

  it('throws DefenzApiError on non-2xx even when body is not JSON', async () => {
    const { impl } = fakeFetch({ status: 500, text: '<html>Internal Error</html>' })
    const client = makeClient(impl)

    const err = await client.list().catch((e) => e)
    expect(err).toBeInstanceOf(DefenzApiError)
    expect((err as DefenzApiError).status).toBe(500)
  })

  it('throws when success:false even on a 200 (defensive)', async () => {
    const { impl } = fakeFetch({ status: 200, body: { success: false, error: 'weird' } })
    const client = makeClient(impl)
    await expect(client.list()).rejects.toThrowError(/weird/)
  })
})
