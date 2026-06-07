/**
 * Cliente HTTP do app Defenz. Fala apenas com `/api/demandas` via Bearer.
 * Não conhece companyId/role — o servidor resolve o escopo pelo token (Fase A).
 *
 * Usa `fetch` nativo (Node ≥18). `fetchImpl` é injetável para testes.
 */

export type Demanda = {
  id: string
  title: string
  status: string
  priority?: string
  classification?: string | null
  assignee?: string | null
  deadline?: string | null
  description?: string | null
  [key: string]: unknown
}

export interface DefenzClientOptions {
  /** Base da API (ex.: https://defenz-todo.vercel.app), sem `/api/demandas`. */
  baseUrl: string
  /** API Service Token (Bearer), formato `defz_...`. */
  token: string
  /** Timeout por requisição em ms (default 30000). */
  timeoutMs?: number
  /** Implementação de fetch (default: global). Injetável para testes. */
  fetchImpl?: typeof fetch
}

export type ListParams = { companyId?: string; teamId?: string }

/** Erro de chamada à API Defenz, carregando o status HTTP e o corpo (se houver). */
export class DefenzApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: unknown
  ) {
    super(message)
    this.name = 'DefenzApiError'
  }
}

type Envelope<T> = { success: boolean; data?: T; error?: string; message?: string }

export class DefenzClient {
  private readonly baseUrl: string
  private readonly token: string
  private readonly timeoutMs: number
  private readonly fetchImpl: typeof fetch

  constructor(opts: DefenzClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, '') // remove barra final
    this.token = opts.token
    this.timeoutMs = opts.timeoutMs ?? 30000
    this.fetchImpl = opts.fetchImpl ?? fetch
  }

  /** Lista demandas acessíveis ao token. Filtros opcionais de empresa/equipe (admin). */
  async list(params?: ListParams): Promise<Demanda[]> {
    const qs = new URLSearchParams()
    if (params?.companyId) qs.set('companyId', params.companyId)
    if (params?.teamId) qs.set('teamId', params.teamId)
    const suffix = qs.toString() ? `?${qs.toString()}` : ''
    const data = await this.request<Demanda[]>('GET', `/api/demandas${suffix}`)
    return data ?? []
  }

  /** Cria uma demanda. O escopo (empresa/equipe) vem do token. */
  async create(input: Record<string, unknown>): Promise<Demanda> {
    const data = await this.request<Demanda>('POST', '/api/demandas', input)
    return data as Demanda
  }

  /** Atualiza uma demanda existente (`input` deve conter `id`). */
  async update(input: { id: string } & Record<string, unknown>): Promise<Demanda> {
    const data = await this.request<Demanda>('PUT', '/api/demandas', input)
    return data as Demanda
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    path: string,
    body?: unknown
  ): Promise<T | undefined> {
    const url = `${this.baseUrl}${path}`
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)

    let res: Response
    try {
      res = await this.fetchImpl(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new DefenzApiError(`Requisição expirou após ${this.timeoutMs}ms`, 0)
      }
      throw new DefenzApiError(
        `Falha de rede ao chamar ${method} ${path}: ${err instanceof Error ? err.message : String(err)}`,
        0
      )
    } finally {
      clearTimeout(timer)
    }

    const raw = await res.text()
    let json: Envelope<T> | undefined
    try {
      json = raw ? (JSON.parse(raw) as Envelope<T>) : undefined
    } catch {
      json = undefined
    }

    if (!res.ok) {
      const serverMsg = json?.error || raw?.slice(0, 200) || `HTTP ${res.status}`
      throw new DefenzApiError(serverMsg, res.status, json ?? raw)
    }

    // Resposta 2xx mas envelope marca falha → trata como erro (defensivo).
    if (json && json.success === false) {
      throw new DefenzApiError(json.error || 'Resposta de erro do servidor', res.status, json)
    }

    return json?.data
  }
}
