# PROGRESS — Defenz To-Do

**Last updated:** 2026-06-24
**Version:** 0.2.0
**Branch:** main

## Current focus
**Operação ativa via MCP/API + 3 features de produto no pipeline.** O `feature-demanda-company-selector` foi **DEPLOYADO** (commits `befcfde`+`15fa70a`, Vercel READY; E2E de move empresa→empresa verificado em prod). O MCP `defenz` está **plugado no Claude Code** (token persistente `marcos-mcp`, prefix `defz_066db3eb`, em `~/.claude.json` do projeto — ativa só após restart) e ganhou o param `company` (nome→id). Durante 17–24/06 alimentei MUITOS cards via API (token marcos-mcp) em Defenz e PSI.SheilaCarvalho (esteiras Meta, Apollo, LinkedIn, Sales AÍ, logs diários "Atividades DD/MM", etc.).

**Specs — ver `docs/features/`:**
- `feature-defenz-mcp-subtasks.md` — **DONE (2026-06-24)**: 4 tools novas no MCP (`add_subtask`/`complete_subtask`/`list_subtasks`/`list_user_tasks`), só pacote `mcp/defenz-mcp/`, **sem deploy do app**. 52 testes MCP, build+type-check verdes. **Requer restart do Claude Code** para recarregar as tools.
- `feature-service-desk.md` — **IMPLEMENTADA (código, 2026-06-24)** — `db push` no Neon + E2E + deploy PENDENTES (toca prod, aguarda OK do Marcos). Opção B enxuta: `Ticket`+`TicketMessage`, vínculo 1:1 opcional a Demanda, N2=parceiro externo (`escalatedAt`+`escalatedTo`), 3 estados, service-layer puro (timestamps+métricas), 6 rotas + `/api/service-desk/metrics`, UI (nav+lista+TicketModal+relatório Recharts). 38 testes novos (**569 total**), build+tsc verdes. Plano: `docs/plans/2026-06-24-service-desk.md`. **⚠️ Rotas falham até o `db push` (tabelas `tickets`/`ticket_messages` ainda não existem no Neon).**
- `feature-playbooks-manuais.md` — **APROVADA (design, 2026-06-24)**. KB markdown-no-banco (sanitizado, dompurify+rehype-sanitize), 2 models (Playbook+PlaybookCategory, tags String[]), `companyId` nullable (global vs empresa via helper NOVO `playbookScopeWhere`), frescor (owner+verifiedAt+reviewDueAt, isStale derivado, reset reviewReminderSent no re-verify, editou-sem-dono→revisão), **busca full-text Postgres no MVP**, Cmd+K. Implementar **depois** do Service Desk.

### Histórico anterior
**`feature-time-entries` (Desenho B) DEPLOYADA em prod (commit `8d22216`).** O push também levou as **Fases B+D** (commit `1fb3fcf`, MCP + multi-empresa) que estavam pendentes.

- **feature-time-entries DONE + DEPLOYADO:** diário de horas delta-on-save + campo `Demanda.client` + aba `/dashboard/demandas/horas`. 31 testes novos (**523 total**), `tsc`+`build` verdes. Revisão adversarial multi-agente (2 rodadas) → achados corrigidos. **Deploy:** `prisma db push` no Neon (coluna `client` + tabela `time_entries`); backfill rodado (5 baseline); E2E autenticado em dev (GET admin → 200 c/ 5 lançamentos); push → Vercel (prod live). Ver [feature-time-entries.md](features/feature-time-entries.md).
- **Pós-deploy a observar:** validar a aba Horas autenticado em prod (clique real). Demandas existentes ainda não têm `client` (campo novo) → preencher Cliente nos cards conforme uso. Fases B+D agora em prod — testar MCP/multi-empresa contra prod quando for plugar o token do Marcos.

### Fases B e D (commit `1fb3fcf`, local, não deployado)
- **Fase B — MCP `defenz-mcp`**: pacote standalone em `mcp/defenz-mcp/` (Node/TS ESM, `@modelcontextprotocol/sdk` + `zod`, fetch nativo, stdio). 4 tools (`list/create/update/move_demanda`) sobre `/api/demandas` via Bearer; escopo resolvido pelo token. 31 testes + smoke E2E stdio. README + `.env.example` + `.gitignore`. Toolchain isolada (root `tsconfig`/`vitest` excluem `mcp/`).
- **Fase D — resto do multi-empresa**: rotas convertidas p/ escopo por **conjunto** (`demandas` GET/POST/PUT/DELETE, `users` GET, `users/[id]` PUT c/ `companyIds[]` sync, `teams`, `companies`, `invites`, `audit-logs`, `report/executive`, `demandas/import`). UI Configurações→Usuários ganhou multi-select "Empresas adicionais". Validação `src/lib/validations/user.ts`.
- **Revisão adversarial multi-agente** do diff (Fase B+D) → 4 findings confirmados, **todos corrigidos com TDD**: (CRÍTICO) gerência podia editar/resetar-senha/deletar usuário de outra empresa — adicionado guard de tenant no alvo (PUT+DELETE); (ALTO) `teamIds` não escopado → cross-tenant team bind, agora valida empresa da equipe; (MÉDIO) PUT não setava `dateDone` ao concluir → corrigido server-side (espelha `dateStarted`, beneficia MCP/curl); (BAIXO) `companyId` primária virava linha `UserCompany` redundante → strip da primária. Re-revisão focada dos fixes executada.
- **Gate**: 486 testes app + 31 MCP = **517**, `npm run build` + `npx tsc --noEmit` verdes. **Não deployado** — aguarda decisão de push.
- **Validação de UI**: estática + runtime smoke (todas as rotas alteradas → 401 não 500; página renderiza). Clique autenticado não feito (sem credencial de dev / token não mintável em prod por guardrail). Usuário aceitou considerar validado.

### Histórico imediato (Fase A)
**Solução A (Bearer token) SHIPADA E DEPLOYADA** (commit `0dc7117`, prod verificada). Fundação multi-empresa shipada junto (`UserCompany`, helpers set-based, `companyIds` na sessão). Schema aplicado no Neon (aditivo, ADR-008).

**Config de usuários aplicada (2026-06-07, via `scripts/setup-marcos-admin.ts`):**
- `marcos@defenz.com.br` → **role=admin** + membro (UserCompany) das 4 empresas (Defenz, Cow Cycling, Grafono, PSI.SheilaCarvalho). Senha não alterada (já era a do admin).
- `marcos.v.cruz222@gmail.com` → **novo admin de recuperação**, senha = a do admin existente ("Admin Defenz", mesma conta do token `admin-cli`).
- Empresas existentes no banco: **Defenz | Cow Cycling | Grafono | PSI.SheilaCarvalho**.
- Token admin ativo: `admin-cli` (prefix `defz_2e03fd88`), atado à conta "Admin Defenz".

**UI de gestão de tokens SHIPADA E DEPLOYADA (commit `8b53062`):** Configurações → Usuários → ação 🔑 "API Tokens" por usuário (**admin-only**) — gerar (plaintext 1x), listar, revogar. API `GET/POST/DELETE /api/users/[id]/api-tokens` (session-only, admin). Helpers em `src/lib/api-token.ts`. 442 testes. (Não depende mais de CLI/chat para gerar token.)

## ▶️ PRÓXIMA SESSÃO — começar aqui
1. ✅ **`feature-defenz-mcp-subtasks` IMPLEMENTADA (2026-06-24)** — 4 tools novas, 52 testes MCP, build verde. Confirmado: não há `GET /api/demandas/[id]` Bearer; `list_subtasks`/`list_user_tasks` usam o GET geral (que já embute `subtasks[]` + `user`). **Pendente do Marcos: restart do Claude Code** para recarregar as tools.
2. **Brainstorming dos 2 menus novos** (specs Draft): `feature-playbooks-manuais` e `feature-service-desk` (este último: decidir o vínculo Ticket↔Demanda — ler a análise das 3 opções na spec, lean = Opção C híbrida). **Em andamento: pesquisa multi-agente de ferramentas renomadas + modelos.**
3. **Corrigir o bug do AuditLog em PUT parcial** (tarefa registrada via chip): `diffChanges` loga campos ausentes como `→ null` quando o body é parcial (MCP `move_demanda`/`update_demanda`, curl). Fix: ignorar campos ausentes do payload. TDD em `src/lib/audit.ts` + `src/app/api/demandas/route.ts`.
4. Deploy ordenado da Phase 2 do assignee-fk (independente; ver abaixo).

## Como operar dados em prod (resumo p/ contexto novo — detalhe em memória `project_api_access`)
- **Token**: `marcos-mcp` (admin, 4 empresas) está ativo e persistente em `~/.claude.json` → `projects["<repo>"].mcpServers.defenz.env.DEFENZ_API_TOKEN`. Scripts leem dele.
- **Banco único** dev=prod (Neon, ADR-008): `npx tsx scripts/<x>.ts` rodando da raiz do repo atinge prod. Padrão usado: criar card via `POST /api/demandas` (Bearer) e **horas de card via Prisma** (`demanda.update spentMinutes` + `timeEntry.create`) p/ NÃO disparar o bug do AuditLog (PUT parcial). Horas de **subtarefa** via `POST /api/demandas/[id]/subtasks` (limpo, lança no diário). IDs úteis: Defenz `cmn8wi8ze00003ouacf33hseb`, PSI `cmq3yyutf0000jo04bv6a5kmg`, Marcos `cmn7fk7u800013oi9yzq17egq`.
- **Padrão de log diário** preferido do Marcos: itens novos → 1 card "Atividades DD/MM" (concluída, cliente Defenz) com subtarefas ☑; itens que já têm card → subtarefa `[DD/MM]` no card existente (checar antes p/ não duplicar).

## In progress
- (nada em código aberto) — `feature-demanda-company-selector` deployado; 3 specs aguardando implementação/brainstorming.
- feature-assignee-fk-migration continua aguardando deploy ordenado (independente).

## Recently completed (last 5)
- 2026-06-17→24 **`feature-demanda-company-selector` DEPLOYADO** (commits `befcfde`+`15fa70a`) — seletor Empresa/Projeto no modal (admin) + PUT move entre empresas (limpa teamId, AuditLog), E2E move verificado em prod. MCP `defenz` plugado (token `marcos-mcp`) + estendido c/ param `company`. 531 testes app + 39 MCP. Depois: muitos cards alimentados via API em Defenz/PSI (esteiras Meta/Apollo/LinkedIn/Sales AÍ + logs diários "Atividades DD/MM"). 3 specs novas criadas (mcp-subtasks aprovada; playbooks + service-desk draft). Relatório de horas do Leonardo (Defenz, 2 sem) — achados 3 outliers (36/36/28h) prováveis erros de lançamento.
- 2026-06-08 **`feature-time-entries` (Desenho B) DEPLOYADA** (commit `8d22216`, push) — diário de horas delta-on-save + campo `Demanda.client` + aba `/dashboard/demandas/horas`. Schema (`Demanda.client`, modelo `TimeEntry`), helpers puros + `logTimeDelta`, hooks de delta em `PUT /api/demandas` + 3 rotas de subtarefa, `GET /api/time-entries` (admin/gerência, escopo por conjunto + filtros + TZ SP + cap 5000), modal c/ campo Cliente (board/horas inalterados), nav admin/gerência, seed `backfill-time-entries.ts` (baseline auto-corretivo). **31 testes novos (523 total), tsc+build verdes.** Revisão adversarial multi-agente (6 dims → verify, 2 rodadas) → 1 alto + 2 médios + baixos, todos corrigidos. **Deploy:** `db push` no Neon + backfill (5 baseline) + E2E autenticado dev (200 c/ 5 lançamentos) + push → Vercel (prod live). **O mesmo push levou Fases B+D (`1fb3fcf`) a prod.** Specs: feature-time-entries.
- 2026-06-07 **Spec `feature-time-entries` (Desenho B)** APROVADA + commitada (`087eaa2`) via brainstorming. Diário de horas delta-on-save, campo Cliente (≠ Empresa-tenant), aba Horas. Iterou por 2 reframes: descartado "diário como fonte da verdade" e "diário manual" → ficou delta-on-save (livre edição preservada).
- 2026-06-07 **Fase B (MCP `defenz-mcp`) + Fase D (resto multi-empresa)** (commit `1fb3fcf`) — pacote MCP standalone (4 tools, 31 testes + smoke E2E) + conversão de ~10 rotas p/ escopo por conjunto + `companyIds[]` sync em `users/[id]` PUT + UI multi-select + validação Zod `user.ts`. Revisão adversarial multi-agente → 4 fixes (1 crítico tenant: gerência editava usuário cross-company; 1 alto teamIds cross-tenant; 1 médio dateDone server-side ao concluir; 1 baixo strip primária UserCompany). 517 testes, build+tsc verdes. **Local; não deployado.** Specs: feature-defenz-mcp, feature-multi-company-membership, feature-external-kanban-feed.
- 2026-06-07 UI de gestão de API Tokens — Configurações→Usuários, ação 🔑 por usuário (admin-only): gerar/copiar(1x)/listar/revogar. API `/api/users/[id]/api-tokens`. Helpers em `src/lib/api-token.ts`. SHIPADO+DEPLOYADO (commit `8b53062`). 442 testes.
- 2026-06-07 feature-api-service-token (Solução A) + fundação multi-empresa — Bearer token (`ApiToken`+`resolveActor`) na família demanda, `UserCompany` N:N, helpers set-based, `companyIds` na sessão. SHIPADO + DEPLOYADO (commit `0dc7117`, prod verificada). Marcos→admin + memberships + recovery admin. 435 testes.
- 2026-06-03 feature-demanda-dependencies — edição de dependências de Demanda (combobox no modal) + guardas self/ciclo/inválido (detectCycle em src/lib/dependency-graph.ts) + deps clicáveis (card e modal abrem a tarefa da dependência). Módulo `activities` órfão removido. Validado em localhost. 407 testes.
- 2026-06-03 feature-time-tracking — controle de horas gastas/estimadas em Demanda + Subtask (minutos canônicos, UI horas decimais), badge no card, inputs no modal/subtarefas, AuditLog. Schema no Neon dev via `db push`. Validado em localhost.
- 2026-04-28 feature-assignee-fk-migration (código) — schema + migration SQL + backfill + POST/PUT/GET/DELETE com FK source-of-truth + Phase 1 fallback (331 testes)
- 2026-04-28 feature-bugfix-assignee-visibility (Phase 1) — user assignee passa a ver/editar/deletar demanda em qualquer team da própria company (318 testes)
- 2026-04-14 feature-bugfix-date-timezone — parseLocalDate() + fix em /api/demandas (298 testes)
- 2026-04-11 feature-tenant-isolation — 6 rotas protegidas + testes (289 passando, build OK)
- 2026-04-11 harness install — PROGRESS/SPEC/ARCHITECTURE/CHANGELOG + CLAUDE.md tighten
- 2026-04-05 feature-executive-report — relatório executivo com slides via Gemini (1c3787c)

## Next up (priority order)
0. ✅ **`feature-defenz-mcp-subtasks` DONE** — 4 tools (subtarefas + `list_user_tasks`) no MCP, 52 testes. Só restart do Claude pendente.
0b. **Menu "Playbooks / Manuais Defenz"** (`feature-playbooks-manuais`, DRAFT) — base de conhecimento interna. Brainstorming.
0c. **Menu "Service Desk" (tickets)** (`feature-service-desk`, DRAFT) — abrir/triar tickets vinculados ao Kanban. **Pensar com profundidade** o vínculo Ticket↔Demanda (3 opções na spec; lean = híbrida C). Brainstorming profundo.
0d. **Bug AuditLog PUT parcial** (chip) — `diffChanges` loga campos ausentes como `→null`. Fix em `src/lib/audit.ts`.
1. **Deploy ordenado da Phase 2** (manual, requer DIRECT_URL):
   1. `npx prisma migrate deploy` em staging
   2. `npx tsx scripts/backfill-assignee.ts` em staging
   3. Revisar `unresolved_assignees.log` — corrigir manualmente ou aceitar
   4. Deploy do código novo (Vercel)
   5. Repetir em prod
2. (Após 1+ semana de validação) PR de cleanup: dropar coluna `assignee` (string) e remover Phase 1 fallback no código
3. Auditar os `.md` antigos no root (MIGRATION_REPORT.md, EXECUTIVE_SUMMARY.md, etc.) — mover para `docs/archive/` ou deletar
4. Atualizar README.md (atualmente refere Next.js 15 / SQLite / Activity — está desatualizado)

## Known blockers / open questions
- `AuditLog` não tem `companyId` — scoping feito via `user.companyId` join. Funciona para o caso real (gerencia não vê logs de outra company), mas considerar adicionar `companyId` denormalizado no futuro para performance.
- Phase 2 ainda não rodou em staging/prod. O código está backwards-compatible via Phase 1 fallback (string match) enquanto FK ainda não está populada — ou seja: pode-se deployar o código antes do backfill sem regressão.
- Bulk import (`/api/demandas/import`) ainda escreve só `assignee` string. Demandas importadas dependem do Phase 1 fallback até alguém editar via modal. Backfill resolve via lookup name/email se houver match.

## Verify commands (DoD gate)
```bash
npm run build && npx tsc --noEmit && npm test
```

## Handoff notes
- Sempre ler este arquivo no início da sessão.
- Antes de codar qualquer feature nova: criar `docs/features/feature-<slug>.md`, obter approval, então codar.
- README.md está stale. Fontes de verdade: `.claude/CLAUDE.md` + `docs/`.
- Admin role = cross-company. `gerencia`/`user` = scoped ao `session.user.companyId` (ver feature-tenant-isolation).
- **Assignee visibility (Phase 1+2)**: source of truth é `Demanda.assignedToId` (FK). String `Demanda.assignee` é cache denormalizado para display (auto-populada server-side). Filtro GET para `user`: team OR FK-com-tenant OR string-fallback-quando-FK-null. PUT/DELETE auth: mesma lógica.
- Para criar nova demanda atribuída via API: enviar `assignedToId` (cuid do User). Servidor valida company match. Não-admin não pode atribuir cross-company (403).
