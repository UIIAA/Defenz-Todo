# Feature: MCP `defenz-mcp` (Solução B)
**Status:** Done
**Priority:** P1
**Date:** 2026-06-07

> Decisões herdadas das specs-pai (já aprovadas): [[feature-external-kanban-feed]], [[feature-api-service-token]]. Esta spec detalha apenas a Solução B (servidor MCP).

## Objective
Expor o Kanban Defenz como tools MCP nativas (`list_demandas`, `create_demanda`, `update_demanda`, `move_demanda`) para que qualquer chat MCP (Claude Desktop/Code) crie/mova/atualize Demandas conversando — sem curl manual, sem abrir o navegador.

## Behavior
1. O servidor roda como processo local (stdio), configurado via `claude mcp add`.
2. Lê `DEFENZ_API_URL` (base, ex. `https://defenz-todo.vercel.app`) e `DEFENZ_API_TOKEN` (Bearer `defz_...`) do ambiente.
3. Cada tool faz uma chamada HTTP a `/api/demandas` com header `Authorization: Bearer <token>`. O servidor Defenz resolve company/role pelo token (Fase A) — o MCP **nunca** envia `companyId`/`role`.
4. `move_demanda` mapeia um nome de coluna humano ("Em Andamento", "Concluída", ...) para o `status` canônico, depois faz `PUT`.
5. Respostas voltam como texto legível + `structuredContent`. Erros viram mensagens acionáveis (401 → token; 403 → empresa; 404 → id; 429 → rate limit).

## Business Rules
- O pacote é **standalone** em `mcp/defenz-mcp/` (não importa código do app Next.js — só fala HTTP).
- Auth exclusivamente por env. Token **nunca** commitado (`.gitignore` + `.env.example`).
- Status canônicos: `solicitada | selecionada | em_andamento | concluida | bloqueada`.
- `move_demanda` aceita tanto o nome de coluna humano quanto o status canônico (case/acento-insensível).
- `create_demanda` / `update_demanda` espelham o data-contract de `/api/demandas` (title, status, priority, classification, assignee, deadline, dependsOn, estim*Minutes…).
- Sem `companyId`/`teamId`/`role` nas tools — escopo vem do token.

## Edge Cases
- Env ausente (`DEFENZ_API_URL`/`DEFENZ_API_TOKEN`) → processo aborta no boot com mensagem clara (exit 1).
- Coluna desconhecida em `move_demanda` → erro listando as colunas válidas (sem chamar a API).
- API responde não-2xx → mensagem acionável por código; corpo de erro do servidor incluído quando houver.
- Rede/timeout → mensagem "request falhou/timeout, tente de novo".
- Lista vazia → "Nenhuma demanda encontrada".

## Data Contract
- **Env**: `DEFENZ_API_URL` (string, base sem trailing slash exigido), `DEFENZ_API_TOKEN` (`defz_` + 56 hex).
- **list_demandas**: in `{ companyId?, teamId?, status?, limit? }` → GET `/api/demandas[?companyId&teamId]`, filtra `status`/`limit` client-side. Out: lista resumida (id, title, status, priority, assignee, deadline).
- **create_demanda**: in `{ title, status?, priority?, classification?, assignee?, deadline?, description?, dependsOn? }` → POST. Out: demanda criada.
- **update_demanda**: in `{ id, ...campos }` → PUT. Out: demanda atualizada.
- **move_demanda**: in `{ id, column }` → resolve status → PUT `{ id, status }`. Out: demanda movida.

## Acceptance Criteria
- [ ] `resolveStatus(column)` mapeia colunas humanas e canônicas → status; desconhecida lança erro com lista de válidas. (pure, testado)
- [ ] `DefenzClient` envia `Authorization: Bearer` e método/body corretos; parseia `data`; erro não-2xx vira mensagem acionável. (testado com fetch mockado)
- [ ] As 4 tools chamam o client e formatam saída texto+structured; `move_demanda` traduz coluna→status. (testado)
- [ ] Boot aborta sem env. README com `claude mcp add`. `.gitignore` cobre `.env`/`dist`/`node_modules`.
- [ ] `npm run build` (tsc) e `npm test` (vitest) verdes no pacote.

## Technical Decisions
- **`fetch` nativo (Node ≥18; runner usa Node 24)** em vez de axios: zero dependência de runtime além de `@modelcontextprotocol/sdk` + `zod`, menor superfície de supply-chain, mock trivial via `vi.stubGlobal`. (Desvio consciente do rascunho que citava axios.)
- SDK moderno: `McpServer` + `registerTool` (não APIs deprecadas). stdio transport.
- Lógica separável e testável: `status.ts` (puro) + `client.ts` (HTTP) + `tools.ts` (registro/handlers) + `index.ts` (boot/transport).
- Vitest no pacote (consistente com o app). Sem rede nos testes (fetch mockado).

## Dependencies
- Depende de: [[feature-api-service-token]] (Bearer já no ar), [[feature-multi-company-membership]] (escopo por conjunto).
