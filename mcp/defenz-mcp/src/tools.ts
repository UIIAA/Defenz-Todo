/**
 * Tools MCP do Defenz Kanban. A lógica de cada tool vive em `buildHandlers`
 * (puro, testável); `registerTools` apenas conecta ao McpServer com schemas Zod.
 */
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { DefenzApiError, type DefenzClient, type Demanda, type Subtask } from './client.js'
import { resolveStatus, STATUSES, COLUMN_HELP } from './status.js'
import { resolveCompanyId, COMPANY_HELP } from './companies.js'

/**
 * Resolve o parâmetro humano `company` (nome do projeto) para `companyId` e o remove
 * do payload. Se `companyId` cru já veio, prevalece. Pode lançar (empresa desconhecida) —
 * o handler captura e devolve erro acionável sem chamar a API.
 */
function withCompany(input: Record<string, unknown>): Record<string, unknown> {
  const { company, ...rest } = input
  if (!rest.companyId && typeof company === 'string' && company.trim()) {
    rest.companyId = resolveCompanyId(company)
  }
  return rest
}

const CHARACTER_LIMIT = 25000

type ToolResult = {
  content: { type: 'text'; text: string }[]
  structuredContent?: Record<string, unknown>
  isError?: boolean
}

/** Projeção resumida de uma demanda (evita estourar o contexto do agente). */
function summarize(d: Demanda) {
  return {
    id: d.id,
    title: d.title,
    status: d.status,
    priority: d.priority ?? null,
    assignee: d.assignee ?? null,
    deadline: d.deadline ?? null,
  }
}

/** Projeção de uma demanda com horas (para list_user_tasks). */
function summarizeTask(d: Demanda) {
  return {
    id: d.id,
    title: d.title,
    status: d.status,
    assignee: d.assignee ?? d.user?.name ?? null,
    spentMinutes: d.spentMinutes ?? 0,
    estimatedMinutes: d.estimatedMinutes ?? null,
    deadline: d.deadline ?? null,
  }
}

/** Projeção resumida de uma subtarefa. */
function summarizeSubtask(s: Subtask) {
  return {
    id: s.id,
    title: s.title,
    completed: !!s.completed,
    spentMinutes: s.spentMinutes ?? 0,
    estimatedMinutes: s.estimatedMinutes ?? null,
  }
}

/** Normaliza um nome/e-mail: sem acento, minúsculas, espaços colapsados. */
function normalizePerson(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/** True se o responsável (nome/e-mail) do card casa (substring) com a chave normalizada. */
function personMatches(d: Demanda, key: string): boolean {
  const candidates = [d.assignee, d.user?.name, d.user?.email]
  return candidates.some(
    (c) => typeof c === 'string' && c.trim() !== '' && normalizePerson(c).includes(key)
  )
}

/** Serializa itens em JSON com o mesmo truncamento por CHARACTER_LIMIT usado em list_demandas. */
function renderItems(items: unknown[]): { text: string; truncated: boolean } {
  const text = JSON.stringify(items, null, 2)
  if (text.length > CHARACTER_LIMIT) {
    const half = Math.max(1, Math.floor(items.length / 2))
    return {
      text:
        JSON.stringify(items.slice(0, half), null, 2) +
        `\n... (resposta truncada; use filtros para refinar)`,
      truncated: true,
    }
  }
  return { text, truncated: false }
}

function ok(text: string, structured: Record<string, unknown>): ToolResult {
  return { content: [{ type: 'text', text }], structuredContent: structured }
}

function fail(text: string): ToolResult {
  return { content: [{ type: 'text', text }], isError: true }
}

/** Converte qualquer erro em uma mensagem acionável para o agente. */
function toErrorResult(err: unknown): ToolResult {
  if (err instanceof DefenzApiError) {
    switch (err.status) {
      case 401:
        return fail(
          'Erro: não autenticado (401). Verifique a variável DEFENZ_API_TOKEN (token expirado/revogado/incorreto).'
        )
      case 403:
        return fail(
          'Erro: acesso negado (403). O token não tem permissão para esse recurso (provavelmente é de outra empresa).'
        )
      case 404:
        return fail('Erro: demanda não encontrada (404). Confira o id informado.')
      case 429:
        return fail('Erro: limite de requisições atingido (429). Aguarde alguns instantes e tente de novo.')
      case 0:
        return fail(`Erro de conexão: ${err.message}`)
      default:
        return fail(`Erro: ${err.message} (HTTP ${err.status}).`)
    }
  }
  return fail(`Erro: ${err instanceof Error ? err.message : String(err)}`)
}

export type Handlers = {
  list_demandas: (input: {
    companyId?: string
    teamId?: string
    status?: string
    limit?: number
  }) => Promise<ToolResult>
  create_demanda: (input: Record<string, unknown>) => Promise<ToolResult>
  update_demanda: (input: { id: string } & Record<string, unknown>) => Promise<ToolResult>
  move_demanda: (input: { id: string; column: string }) => Promise<ToolResult>
  add_subtask: (input: {
    demandaId: string
    title: string
    spentMinutes?: number
    estimatedMinutes?: number
    completed?: boolean
  }) => Promise<ToolResult>
  complete_subtask: (input: {
    demandaId: string
    subtaskId: string
    completed: boolean
  }) => Promise<ToolResult>
  list_subtasks: (input: { demandaId: string }) => Promise<ToolResult>
  list_user_tasks: (input: { user: string; company?: string }) => Promise<ToolResult>
}

export function buildHandlers(client: DefenzClient): Handlers {
  return {
    async list_demandas(input) {
      try {
        let demandas = await client.list({ companyId: input.companyId, teamId: input.teamId })
        if (input.status) {
          const status = resolveStatus(input.status)
          demandas = demandas.filter((d) => d.status === status)
        }
        const total = demandas.length
        if (input.limit && input.limit > 0) demandas = demandas.slice(0, input.limit)

        if (total === 0) {
          return ok('Nenhuma demanda encontrada para os filtros informados.', {
            count: 0,
            total: 0,
            demandas: [],
          })
        }

        const items = demandas.map(summarize)
        let text = JSON.stringify(items, null, 2)
        let truncated = false
        if (text.length > CHARACTER_LIMIT) {
          const half = Math.max(1, Math.floor(items.length / 2))
          text =
            JSON.stringify(items.slice(0, half), null, 2) +
            `\n... (resposta truncada; use 'limit' ou filtros para refinar)`
          truncated = true
        }
        return ok(text, { count: items.length, total, truncated, demandas: items })
      } catch (err) {
        return toErrorResult(err)
      }
    },

    async create_demanda(input) {
      try {
        const created = await client.create(withCompany(input))
        return ok(
          `Demanda criada: "${created.title}" (id ${created.id}, status ${created.status}).`,
          created as Record<string, unknown>
        )
      } catch (err) {
        return toErrorResult(err)
      }
    },

    async update_demanda(input) {
      try {
        const updated = await client.update(withCompany(input) as { id: string } & Record<string, unknown>)
        return ok(
          `Demanda ${updated.id} atualizada (status ${updated.status}).`,
          updated as Record<string, unknown>
        )
      } catch (err) {
        return toErrorResult(err)
      }
    },

    async move_demanda(input) {
      let status: string
      try {
        status = resolveStatus(input.column)
      } catch (err) {
        // coluna inválida: não chama a API
        return toErrorResult(err)
      }
      try {
        const moved = await client.update({ id: input.id, status })
        return ok(
          `Demanda ${moved.id} movida para "${status}".`,
          moved as Record<string, unknown>
        )
      } catch (err) {
        return toErrorResult(err)
      }
    },

    async add_subtask(input) {
      try {
        const payload: Record<string, unknown> = { title: input.title }
        if (input.spentMinutes !== undefined) payload.spentMinutes = input.spentMinutes
        if (input.estimatedMinutes !== undefined) payload.estimatedMinutes = input.estimatedMinutes

        const created = await client.createSubtask(input.demandaId, payload)
        let subtask = created
        // POST de subtarefa não aceita `completed` → cria e marca num PUT separado.
        if (input.completed === true) {
          subtask = await client.updateSubtask(input.demandaId, created.id, { completed: true })
        }
        const done = subtask.completed ? ' (concluída ✓)' : ''
        return ok(
          `Subtarefa criada: "${subtask.title}" (id ${subtask.id})${done}.`,
          subtask as Record<string, unknown>
        )
      } catch (err) {
        return toErrorResult(err)
      }
    },

    async complete_subtask(input) {
      try {
        const updated = await client.updateSubtask(input.demandaId, input.subtaskId, {
          completed: input.completed,
        })
        return ok(
          `Subtarefa ${updated.id} ${input.completed ? 'concluída ✓' : 'reaberta'}.`,
          updated as Record<string, unknown>
        )
      } catch (err) {
        return toErrorResult(err)
      }
    },

    async list_subtasks(input) {
      try {
        const demandas = await client.list()
        const demanda = demandas.find((d) => d.id === input.demandaId)
        if (!demanda) {
          return fail(
            `Erro: demanda "${input.demandaId}" não encontrada no escopo do token (confira o id).`
          )
        }
        const subs = (demanda.subtasks ?? []).map(summarizeSubtask)
        if (subs.length === 0) {
          return ok('Este card não tem subtarefas.', {
            demandaId: input.demandaId,
            count: 0,
            subtasks: [],
          })
        }
        const { text, truncated } = renderItems(subs)
        return ok(text, {
          demandaId: input.demandaId,
          count: subs.length,
          truncated,
          subtasks: subs,
        })
      } catch (err) {
        return toErrorResult(err)
      }
    },

    async list_user_tasks(input) {
      // Resolve a empresa ANTES de chamar a API: empresa desconhecida → erro sem request.
      let companyId: string | undefined
      try {
        if (input.company && input.company.trim()) {
          companyId = resolveCompanyId(input.company)
        }
      } catch (err) {
        return toErrorResult(err)
      }
      try {
        const demandas = await client.list(companyId ? { companyId } : undefined)
        const key = normalizePerson(input.user)
        const matched = demandas.filter((d) => personMatches(d, key))
        if (matched.length === 0) {
          return ok(
            `Nenhuma tarefa encontrada para "${input.user}"${
              input.company ? ` em ${input.company}` : ''
            }. Confira o nome/e-mail do responsável.`,
            { user: input.user, count: 0, tasks: [] }
          )
        }
        const items = matched.map(summarizeTask)
        const { text, truncated } = renderItems(items)
        return ok(text, { user: input.user, count: items.length, truncated, tasks: items })
      } catch (err) {
        return toErrorResult(err)
      }
    },
  }
}

// ============================================================
// Zod input schemas (camada MCP)
// ============================================================

const priorityEnum = z.enum(['alta', 'media', 'baixa'])
const classificationEnum = z.enum([
  'marketing',
  'administrativo',
  'vendas',
  'financeiro',
  'operacional',
  'tecnologia',
  'juridico',
  'rh',
  'estrategico',
])

const ListInput = {
  companyId: z.string().optional().describe('Filtra por empresa (somente admin). Omita para usar o escopo do token.'),
  teamId: z.string().optional().describe('Filtra por equipe.'),
  status: z
    .string()
    .optional()
    .describe(`Filtra por status/coluna (${COLUMN_HELP} ou rótulos como "Em Andamento").`),
  limit: z.number().int().min(1).max(200).optional().describe('Máximo de itens a retornar.'),
}

const CreateInput = {
  title: z.string().min(1).describe('Título da demanda (obrigatório).'),
  company: z
    .string()
    .optional()
    .describe(`Empresa/projeto destino (admin). Nome humano: ${COMPANY_HELP}. Omita para usar a empresa primária do token.`),
  companyId: z.string().optional().describe('companyId cru (cuid), alternativa a `company` para empresas fora do mapa.'),
  description: z.string().optional().describe('Descrição/detalhes (markdown aceito).'),
  status: z.enum(STATUSES).optional().describe(`Coluna inicial (${COLUMN_HELP}). Default: solicitada.`),
  priority: priorityEnum.optional().describe('Prioridade. Default: media.'),
  classification: classificationEnum.optional().describe('Área/classificação da demanda.'),
  assignee: z.string().optional().describe('Nome do responsável (texto livre).'),
  deadline: z.string().optional().describe('Prazo no formato YYYY-MM-DD.'),
  dependsOn: z.array(z.string()).optional().describe('IDs de demandas das quais esta depende.'),
}

const UpdateInput = {
  id: z.string().min(1).describe('ID da demanda a atualizar (obrigatório).'),
  company: z
    .string()
    .optional()
    .describe(`Move o card para outra empresa/projeto (admin). Nome humano: ${COMPANY_HELP}. Requer o fix de movimentação deployado.`),
  companyId: z.string().optional().describe('companyId cru (cuid), alternativa a `company`.'),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(STATUSES).optional().describe(`Novo status (${COLUMN_HELP}).`),
  priority: priorityEnum.optional(),
  classification: classificationEnum.nullable().optional(),
  assignee: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  dependsOn: z.array(z.string()).optional(),
  estimatedMinutes: z.number().int().min(0).nullable().optional(),
  spentMinutes: z.number().int().min(0).optional(),
}

const MoveInput = {
  id: z.string().min(1).describe('ID da demanda a mover (obrigatório).'),
  column: z
    .string()
    .min(1)
    .describe(`Coluna destino: ${COLUMN_HELP} ou rótulos humanos ("Em Andamento", "Concluída").`),
}

const AddSubtaskInput = {
  demandaId: z.string().min(1).describe('ID do card (demanda) onde criar a subtarefa.'),
  title: z.string().min(1).describe('Título da subtarefa (obrigatório).'),
  spentMinutes: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe('Minutos já gastos. Lança no diário de horas (atribuído ao Responsável do card).'),
  estimatedMinutes: z.number().int().min(0).optional().describe('Estimativa de minutos.'),
  completed: z
    .boolean()
    .optional()
    .describe('Se true, cria a subtarefa já concluída (POST cria + PUT marca completed).'),
}

const CompleteSubtaskInput = {
  demandaId: z.string().min(1).describe('ID do card pai.'),
  subtaskId: z.string().min(1).describe('ID da subtarefa (use list_subtasks para obter o id).'),
  completed: z.boolean().describe('true = concluir; false = reabrir.'),
}

const ListSubtasksInput = {
  demandaId: z.string().min(1).describe('ID do card cujas subtarefas serão listadas.'),
}

const ListUserTasksInput = {
  user: z
    .string()
    .min(1)
    .describe('Nome OU e-mail do responsável (casa por aproximação, sem acento/caixa).'),
  company: z
    .string()
    .optional()
    .describe(`Filtra por empresa/projeto (admin). Nome humano: ${COMPANY_HELP}.`),
}

/** Registra as 4 tools no McpServer, conectando-as ao client. */
export function registerTools(server: McpServer, client: DefenzClient): void {
  const h = buildHandlers(client)

  server.registerTool(
    'list_demandas',
    {
      title: 'Listar demandas (Defenz)',
      description:
        'Lista as demandas (cards do Kanban) acessíveis ao token. Suporta filtro por status/coluna, ' +
        'empresa (admin) e equipe, além de limite. Retorna um resumo (id, título, status, prioridade, ' +
        'responsável, prazo). Use os ids retornados em update_demanda/move_demanda.',
      inputSchema: ListInput,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (input) => h.list_demandas(input)
  )

  server.registerTool(
    'create_demanda',
    {
      title: 'Criar demanda (Defenz)',
      description:
        'Cria uma nova demanda (card) no Kanban Defenz. Use `company` (nome do projeto, ex.: "Grafono") ' +
        'para escolher a empresa destino; admin pode qualquer empresa, demais só o próprio escopo. Omitir ' +
        'company cria na empresa primária do token. Campos: title (obrigatório), company, description, ' +
        'status, priority, classification, assignee, deadline (YYYY-MM-DD), dependsOn.',
      inputSchema: CreateInput,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (input) => h.create_demanda(input)
  )

  server.registerTool(
    'update_demanda',
    {
      title: 'Atualizar demanda (Defenz)',
      description:
        'Atualiza campos de uma demanda existente (informe o id). Para apenas mudar de coluna, prefira ' +
        'move_demanda. Aceita title, description, status, priority, classification, assignee, deadline, ' +
        'dependsOn, estimatedMinutes, spentMinutes.',
      inputSchema: UpdateInput,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (input) => h.update_demanda(input)
  )

  server.registerTool(
    'move_demanda',
    {
      title: 'Mover demanda de coluna (Defenz)',
      description:
        'Move uma demanda para outra coluna do Kanban. Aceita o nome humano da coluna ("Em Andamento", ' +
        `"Concluída") ou o status canônico (${COLUMN_HELP}). Coluna inválida retorna erro sem alterar nada.`,
      inputSchema: MoveInput,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (input) => h.move_demanda(input)
  )

  server.registerTool(
    'add_subtask',
    {
      title: 'Adicionar subtarefa (Defenz)',
      description:
        'Cria uma subtarefa (checklist) num card. Com `spentMinutes`, lança no diário de horas atribuído ' +
        'ao Responsável do card (setar o Cliente do card antes, se relevante). Com `completed:true`, a ' +
        'subtarefa já nasce concluída. As rotas de subtarefa têm AuditLog próprio e limpo.',
      inputSchema: AddSubtaskInput,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async (input) => h.add_subtask(input)
  )

  server.registerTool(
    'complete_subtask',
    {
      title: 'Concluir/reabrir subtarefa (Defenz)',
      description:
        'Marca uma subtarefa como concluída (`completed:true`) ou a reabre (`completed:false`). ' +
        'Use list_subtasks para descobrir o subtaskId antes.',
      inputSchema: CompleteSubtaskInput,
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (input) => h.complete_subtask(input)
  )

  server.registerTool(
    'list_subtasks',
    {
      title: 'Listar subtarefas de um card (Defenz)',
      description:
        'Lista as subtarefas de um card (id, título, ✓, horas). Necessário para obter o subtaskId ' +
        'antes de complete_subtask. Lê do GET de demandas (subtarefas embutidas) — sem endpoint extra.',
      inputSchema: ListSubtasksInput,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (input) => h.list_subtasks(input)
  )

  server.registerTool(
    'list_user_tasks',
    {
      title: 'Listar tarefas de um usuário (Defenz)',
      description:
        'Lista os cards (demandas) cujo responsável casa com o `user` informado (nome OU e-mail, sem ' +
        'acento/caixa). Retorna título, status e horas de cada. Filtro opcional por `company`. ' +
        'Sem match retorna lista vazia com mensagem (não erro).',
      inputSchema: ListUserTasksInput,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async (input) => h.list_user_tasks(input)
  )
}
