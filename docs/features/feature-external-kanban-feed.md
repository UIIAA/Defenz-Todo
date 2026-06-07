# Feature: Alimentar o Kanban Defenz de fora (chat / projeto externo)
**Status:** Approved (decomposta em duas specs filhas — ver abaixo)
**Priority:** P1
**Date:** 2026-06-07

## Decisões tomadas (2026-06-07)
- **Auth de serviço** = modelo `ApiToken` em **tabela** (não env JSON, não CRON_SECRET). Token vinculado a 1 usuário, autentica "como" ele. → [[feature-api-service-token]]
- **Entrega**: Solução **A** (curl/Bearer na API) PRIMEIRO; depois Solução **B** (MCP `defenz-mcp`). Opção C (n8n) descartada por ora.
- **Multi-empresa por usuário** via `UserCompany` N:N; aplicar ao Marcos. → [[feature-multi-company-membership]]
- Dois tokens iniciais: **admin** (acesso total) + **Marcos** (empresas dele).
- Os acceptance criteria deste rascunho são cobertos pelas duas specs filhas.

## Objective
Permitir criar, atualizar e mover cards (Demandas) do Kanban Defenz a partir de uma conversa com o Claude (chat) e/ou de outro projeto/automação — sem abrir o navegador. Ex.: "crie o card Teste e mova para Em Andamento".

## Problema atual (o blocker)
As rotas em `/api/demandas` só autenticam via **sessão NextAuth** (cookie/JWT de navegador). Não há forma de um chamador **máquina-a-máquina** (Claude via curl, n8n, outro app) se autenticar. Toda a lógica de negócio (POST criar, PUT mover status, subtasks, dependências, horas) **já existe** — falta só o caminho de auth para não-navegador.

## Decisões a tomar (brainstorm)
### 1. Modelo de autenticação de serviço
- Adicionar um **token de serviço** (env, ex. `DEFENZ_API_TOKEN`) aceito via header `Authorization: Bearer ...`, ao lado da sessão NextAuth, nas rotas de demanda.
- O token precisa mapear para um **escopo de tenant**: `companyId` (obrigatório, multi-tenant), `teamId` default e um `userId` criador (para audit/`createAuditLog`). Definir como configurar isso (env JSON? tabela `ServiceToken`?).
- Padrão existente de referência: `CRON_SECRET` no `/api/cron/reminders`.

### 2. Forma de entrega
- **Opção A — curl na API atual (rápido):** com o token, o Claude chama `POST /api/demandas` (criar) e `PUT /api/demandas` (mover status) direto do chat via Bash. Mínimo esforço; funciona já.
- **Opção B — MCP server Defenz (melhor UX):** um servidor MCP `defenz-mcp` com tools `create_demanda`, `move_demanda`, `update_demanda`, `list_demandas` que envolvem a API (com o token). Aí em qualquer chat eu tenho tools nativas e o usuário só conversa. Mais trabalho, melhor experiência. (Ver skill `mcp-builder`.)
- **Opção C — n8n:** webhook → chama a API. Bom para automações disparadas por evento, menos para chat.

### 3. Escopo de operações no v1
- Mínimo: criar card, mover status (solicitada/selecionada/em_andamento/concluida/bloqueada), setar prioridade/responsável.
- Depois: subtasks, horas, dependências.

## O que o usuário precisa fornecer/decidir
- **Qual empresa + equipe** a automação deve alimentar (escopo do token). Ex.: company `X`, team `Y`, criador `user Z`.
- Aprovar: (a) adicionar auth por token de serviço; (b) escolher entrega A (curl) e/ou B (MCP).

## Data contract (já existe)
- Criar: `POST /api/demandas` body `{ title, status?, priority?, classification?, assignedToId?, deadline?, dependsOn?, spentMinutes?, estimatedMinutes? }`.
- Mover/atualizar: `PUT /api/demandas` body `{ id, status, ... }` (status = a coluna destino).
- Auth atual: sessão NextAuth. **A criar:** Bearer token de serviço com tenant scope.

## Acceptance Criteria (rascunho)
- [ ] Token de serviço autentica chamadas a `/api/demandas` (POST/PUT) com escopo de company/team/criador.
- [ ] Pelo chat, criar o card "Teste" e movê-lo entre colunas funciona end-to-end.
- [ ] Mutações via token gravam AuditLog com o usuário de serviço.
- [ ] Tenant isolation preservada (token não cruza empresas).

## Notas de segurança
- Token nunca commitado (env / Vercel, como `DATABASE_URL`).
- Rate limit no caminho do token (reusar `src/lib/rate-limit.ts`).
- Banco Neon é único dev/prod (ADR-008) — testar em localhost = mexer em prod; cuidado.
