# Feature: defenz-mcp — subtarefas + tarefas por usuário
**Status:** Done
**Priority:** P2
**Date:** 2026-06-24

## Objective
Estender o MCP `defenz-mcp` (já plugado no Claude Code do Marcos) para gerenciar **subtarefas** e listar **todas as tarefas de um usuário** — fechando o gap que obrigou a operar a esteira de cards deste mês pela API direto.

## Behavior
1. `add_subtask(demandaId, title, spentMinutes?, completed?)` — cria subtarefa; com `spentMinutes` lança no **diário de horas** (delta-on-save, atribuído ao Responsável do card); com `completed:true` cria já concluída (POST cria + PUT completed internamente, pois o POST de subtask não aceita `completed`).
2. `complete_subtask(demandaId, subtaskId, completed)` — conclui/reabre uma subtarefa.
3. `list_subtasks(demandaId)` — lista as subtarefas (id, título, ✓, horas). Necessário pra obter o `subtaskId` antes de `complete_subtask`.
4. `list_user_tasks(user, company?)` — lista os **cards** de um usuário (título, status, horas de cada). `user` casa por nome OU e-mail (case/acento-insensível) contra o responsável. `company` opcional reusa o mapa nome→id de `companies.ts`.

As 4 tools atuais permanecem: `list_demandas`, `create_demanda`, `update_demanda`, `move_demanda`.

## Business Rules
- Escopo sempre resolvido pelo token (Bearer). Token admin (Marcos) enxerga tudo; `list_user_tasks` filtra por responsável **client-side** sobre o GET de demandas — sem mudança no backend.
- `add_subtask` com horas → 1 lançamento no diário, snapshot de cliente lido do card no momento (setar `client` no card ANTES, se relevante).
- Auditoria: rotas de subtarefa têm AuditLog próprio e limpo — **não** disparam o bug do PUT parcial de `/api/demandas` (ver Dependencies).

## Edge Cases
- `list_user_tasks` com usuário sem match → retorna lista vazia + mensagem acionável (não erro).
- `complete_subtask` com subtaskId inexistente → 404 acionável.
- Resposta grande (ex.: Leonardo tem ~50 cards) → reusar o truncamento por CHARACTER_LIMIT (25k) já existente em `tools.ts`.

## Data Contract
- **add_subtask** → `POST /api/demandas/[id]/subtasks` (Bearer; aceita `title`, `position?`, `estimatedMinutes?`, `spentMinutes?`).
- **complete_subtask** → `PUT /api/demandas/[id]/subtasks/[subtaskId]` (Bearer; `completed`).
- **list_subtasks** → ler subtarefas do card. ⚠️ CONFIRMAR na impl se existe `GET /api/demandas/[id]` Bearer com subtasks; se não, filtrar do `GET /api/demandas`. Fallback garantido, sem deploy.
- **list_user_tasks** → `GET /api/demandas` (+ filtro client-side por `assignee`/`assignedToId` e por empresa).

## Acceptance Criteria
- [x] `add_subtask` cria subtarefa; com horas, aparece no diário; com `completed`, nasce ✓.
- [x] `complete_subtask` marca/reabre.
- [x] `list_subtasks` devolve ids usáveis em `complete_subtask`.
- [x] `list_user_tasks("Leonardo", "Defenz")` devolve os cards do Leonardo em Defenz.
- [x] As 4 tools existentes seguem funcionando. `npm test` (vitest do MCP) + `npm run build` verdes.

## Implementação (2026-06-24)
- `client.ts`: tipo `Subtask` + campos `subtasks[]`/`user`/`spentMinutes`/`estimatedMinutes` em `Demanda`; métodos `createSubtask(demandaId, input)` (POST `/api/demandas/:id/subtasks`) e `updateSubtask(demandaId, subtaskId, input)` (PUT `/api/demandas/:id/subtasks/:subtaskId`).
- `tools.ts`: 4 handlers + 4 schemas Zod + registro. `add_subtask` faz POST e, com `completed:true`, um PUT subsequente (o POST de subtask não aceita `completed`). `list_subtasks` e `list_user_tasks` são **client-side** sobre `client.list()` — o `GET /api/demandas` já embute `subtasks[]` (orderBy position) e o relation `user{name,email}`, então **nenhum endpoint novo / sem deploy do app**. `list_user_tasks` casa o responsável por substring normalizada (sem acento/caixa) contra `assignee`, `user.name` e `user.email`; empresa resolvida via `resolveCompanyId` ANTES da chamada (empresa desconhecida → erro sem request). Truncamento por `CHARACTER_LIMIT` reaproveitado (`renderItems`).
- **Gate:** 52 testes MCP (eram 39, +13: 2 client + 11 handlers), `type-check` + `build` verdes. Smoke: server registra as 8 tools.
- **Ativação:** `npm run build` no pacote feito. **Requer restart do Claude Code** para o MCP `defenz` recarregar as tools novas. Sem deploy do app.

## Technical Decisions
- Só mudanças em `mcp/defenz-mcp/` — **não precisa deploy do app**. Ativa com `npm run build` no pacote + restart do Claude Code.
- `DefenzClient` ganha `createSubtask`/`updateSubtask`/`listSubtasks` (e reuso de `list`). Schemas Zod + handlers em `tools.ts`; registro das 4 novas tools.
- Testes vitest com `fakeClient` (padrão de `tools.test.ts`): 1 happy + 1 sad por tool nova.

## Dependencies
- Depends on: `feature-defenz-mcp` (base) + `feature-demanda-company-selector` (mapa `companies.ts`).
- Relacionado: **bug do AuditLog em PUT parcial** (`diffChanges` loga campos ausentes como `→ null` em chamadas parciais do MCP/curl) — registrado como tarefa à parte; NÃO afeta as rotas de subtarefa, mas afeta `move_demanda`/`update_demanda`. Corrigir junto seria bom.
