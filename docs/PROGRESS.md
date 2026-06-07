# PROGRESS — Defenz To-Do

**Last updated:** 2026-06-07
**Version:** 0.2.0
**Branch:** main

## Current focus
**Fases B+D COMMITADAS localmente (commit `1fb3fcf`, NÃO deployadas).** Próximo trabalho aprovado:
**implementar `feature-time-entries` (Desenho B — diário de horas delta-on-save).**

- **Spec aprovada e commitada** (`087eaa2`): [feature-time-entries.md](features/feature-time-entries.md). Resumo: "Cliente atendido" é dimensão NOVA (texto livre no card) ≠ Empresa-tenant. Horas seguem **livre edição** (modal inalterado); ao Salvar, servidor grava **delta** num diário `TimeEntry` (quem=Responsável, quando=agora, cliente snapshot, origem card|subtask), independente do status do card. Subtarefas também geram delta. **Sem CRUD manual, sem trocar a fonte da verdade.** Aba "Horas" (admin/gerência, escopada) agrega por cliente/responsável/equipe/área/card com período (exato, datado no Salvar). Seed backfill idempotente. **Seguir o "Build order" da spec com TDD.**

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
0. **IMPLEMENTAR `feature-time-entries` (Desenho B)** — APROVADA, ainda não codada. Ler [feature-time-entries.md](features/feature-time-entries.md) e seguir o **Build order** com TDD: (1) schema `Demanda.client` + `TimeEntry` + relações, `db push`, mock prisma `timeEntry`; (2) helper `src/lib/time-entries.ts` (computeDelta/groupBy/sumMinutes) + Zod `client`; (3) helper server `logTimeDelta`; (4) hook delta no `PUT /api/demandas`; (5) hooks delta nos subtasks routes; (6) `GET /api/time-entries` (escopo+filtros); (7) campo Cliente no modal (board inalterado); (8) aba `/dashboard/demandas/horas` + nav; (9) seed `scripts/backfill-time-entries.ts`; (10) gate + validar UI. **Regra de ouro: NÃO mudar a edição livre de horas nem o board do Kanban.**
1. **Deploy de B+D** (decisão do usuário): `git push` na main → Vercel auto-deploya. Backward-compatible e validado (517 testes, build verde). Sem migration nova (schema da Fase A já aplicado). Pós-deploy: testar UI autenticada em prod (multi-select Empresas) + MCP contra prod.
2. **Gerar o token do Marcos p/ o MCP** (quando for plugar): UI (Configurações→Usuários→🔑) ou `npx tsx scripts/create-api-token.ts --email marcos@defenz.com.br --name marcos-mcp`. Depois `cd mcp/defenz-mcp && npm install && npm run build` e `claude mcp add` (ver `mcp/defenz-mcp/README.md`).
3. Deploy ordenado da Phase 2 do assignee-fk (independente; ver abaixo).

## In progress
- (nada em código aberto) — Fases B e D fechadas localmente, aguardando push/deploy.
- feature-assignee-fk-migration continua aguardando deploy ordenado (independente).

## Recently completed (last 5)
- 2026-06-07 **Spec `feature-time-entries` (Desenho B)** APROVADA + commitada (`087eaa2`) via brainstorming. Diário de horas delta-on-save, campo Cliente (≠ Empresa-tenant), aba Horas. **A implementar na próxima sessão** (ver item 0). Iterou por 2 reframes: descartado "diário como fonte da verdade" e "diário manual" → ficou delta-on-save (livre edição preservada).
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
0. **Alimentar o Kanban de fora (chat/projeto externo)** — ver `docs/features/feature-external-kanban-feed.md`. Decidir: (a) auth de serviço (token + escopo company/team), (b) entrega via curl na API atual ou via MCP server Defenz. Brainstorm no início da próxima sessão.
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
