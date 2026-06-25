# defenz-mcp-server

Servidor **MCP** (Model Context Protocol) que expõe o Kanban Defenz (Demandas)
como tools nativas para qualquer cliente MCP (Claude Desktop, Claude Code, etc.).
Permite criar / listar / atualizar / mover cards conversando — sem abrir o navegador.

Fala apenas HTTP com `/api/demandas` do app Defenz, autenticando via **Bearer token**
(API Service Token, Solução A). O servidor Defenz resolve empresa/permissão pelo token —
o MCP **nunca** envia `companyId`/`role`.

## Tools

**Cards (Demandas):**

| Tool | O que faz |
|------|-----------|
| `list_demandas` | Lista cards acessíveis. Filtros: `status`/coluna, `companyId` (admin), `teamId`, `limit`. |
| `create_demanda` | Cria um card. Campos: `title` (obrigatório), `company` (nome do projeto), `description`, `status`, `priority`, `classification`, `assignee`, `deadline` (YYYY-MM-DD), `dependsOn`. |
| `update_demanda` | Atualiza campos de um card (`id` obrigatório). `company` move o card entre projetos (admin). |
| `move_demanda` | Move um card de coluna. Aceita nome humano ("Em Andamento", "Concluída") ou status canônico. |

**Subtarefas & tarefas por usuário:**

| Tool | O que faz |
|------|-----------|
| `add_subtask` | Cria subtarefa num card (`demandaId`, `title`). Com `spentMinutes` lança no diário de horas (atribuído ao Responsável do card). Com `completed:true` nasce concluída. |
| `complete_subtask` | Conclui (`completed:true`) ou reabre (`false`) uma subtarefa (`demandaId`, `subtaskId`). |
| `list_subtasks` | Lista as subtarefas de um card (id, título, ✓, horas). Use para obter o `subtaskId`. |
| `list_user_tasks` | Lista os cards de um usuário (`user` = nome ou e-mail, casa por aproximação). Filtro opcional `company`. |

Status/colunas: `solicitada · selecionada · em_andamento · concluida · bloqueada`.

## Pré-requisitos

- Node.js ≥ 18 (testado em Node 24).
- Um **API Service Token** do Defenz (formato `defz_…`).

### Gerar o token

Pela **UI** (recomendado): Defenz → Configurações → Usuários → ação 🔑 **API Tokens**
(somente admin) → gerar e copiar o token (mostrado uma única vez).

Ou via **script** (no diretório raiz do projeto Defenz):

```bash
npx tsx scripts/create-api-token.ts --email seu@email.com --name minha-mcp
```

> O token autentica "como" o usuário-dono e herda o escopo dele (admin = todas as
> empresas). **Nunca** commite o token nem coloque em `.env` versionado.

## Instalação / build

```bash
cd mcp/defenz-mcp
npm install
npm run build      # gera dist/
npm test           # roda os testes (vitest)
```

## Configuração (ambiente)

Copie `.env.example` para `.env` (ou exporte no shell):

```bash
DEFENZ_API_URL=https://defenz-todo.vercel.app   # prod (ou http://localhost:3000 em dev)
DEFENZ_API_TOKEN=defz_xxxxxxxx...               # seu token
# DEFENZ_API_TIMEOUT_MS=30000                   # opcional
```

## Conectar ao Claude Code

```bash
claude mcp add defenz \
  --env DEFENZ_API_URL=https://defenz-todo.vercel.app \
  --env DEFENZ_API_TOKEN=defz_xxxxxxxx... \
  -- node /caminho/absoluto/mcp/defenz-mcp/dist/index.js
```

(Use o caminho absoluto para `dist/index.js`. Rode `npm run build` antes.)

### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "defenz": {
      "command": "node",
      "args": ["/caminho/absoluto/mcp/defenz-mcp/dist/index.js"],
      "env": {
        "DEFENZ_API_URL": "https://defenz-todo.vercel.app",
        "DEFENZ_API_TOKEN": "defz_xxxxxxxx..."
      }
    }
  }
}
```

## Uso (exemplos de conversa)

- "Crie o card **Teste de release** com prioridade alta."
- "Mova o card `<id>` para **Em Andamento**."
- "Liste as demandas em **Concluída**."

## Desenvolvimento

```bash
npm run dev          # tsx watch (stdio)
npm run type-check   # tsc --noEmit (inclui testes)
npm test             # vitest run
```

Arquitetura (tudo testável, sem rede nos testes):

- `config.ts` — lê/valida env (`DEFENZ_API_URL`, `DEFENZ_API_TOKEN`, timeout).
- `client.ts` — `DefenzClient`: wrapper HTTP de `/api/demandas` (fetch nativo, Bearer).
- `status.ts` — `resolveStatus(coluna)`: mapeia nomes humanos → status canônico.
- `tools.ts` — handlers das 4 tools + registro no `McpServer`.
- `index.ts` — boot + transporte stdio.

## Segurança

- Token só via ambiente; `.env` está no `.gitignore`.
- Sem `companyId`/`role` nas tools — o escopo vem do token (tenant isolation no servidor).
- Erros viram mensagens acionáveis (401 → token; 403 → empresa; 404 → id; 429 → rate limit).
