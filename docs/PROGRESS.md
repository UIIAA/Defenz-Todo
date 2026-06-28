# PROGRESS — Defenz To-Do

**Last updated:** 2026-06-27
**Version:** 0.3.0
**Branch:** main

## Current focus
**Service Desk F1 + F2 IMPLEMENTADOS e verificados em localhost — NÃO deployados pro Vercel (decisão do Marcos: validar local primeiro). DB (Neon, dev=prod) já tem o schema aplicado.** Sessão de 25–27/06: MCP Subtasks (commit `f6ed430`), fix do bug PWA/Service Worker (menu "some/aparece" — era SW servindo app shell velho, commit `fix(pwa)`), **GUIA mestre do Service Desk** + spec do portal (revisão adversarial de 48 achados aplicada), **F1** (Kanban v2 + migração de status, commit `feat(service-desk): F1`) e **F2** (portal público `/abrir-ticket`, commit `feat(service-desk): F2`). Orquestração: Sonnets em paralelo p/ build + Opus p/ review, gate (build/tsc/test + smoke no navegador) pelo main loop. **666 testes verdes.**

> ⚠️ **Para um contexto novo entender o Service Desk:** ler `docs/features/service-desk-GUIA.md` (guia mestre — visão, modelo de dados, **Invariantes §9**, roadmap, ADRs). F1 = `feature-service-desk.md`, F2 = `feature-service-desk-portal.md`.

**Specs — ver `docs/features/`:**
- `feature-defenz-mcp-subtasks.md` — **DONE** (commit `f6ed430`): 4 tools novas no MCP. **Requer restart do Claude Code** p/ recarregar (já reconectou nesta sessão).
- `service-desk-GUIA.md` — **GUIA MESTRE (vivo)** do Service Desk. Fonte de verdade. ADRs 001–007.
- `feature-service-desk.md` (F1) — **IMPLEMENTADO local** (Kanban v2, migração status, "Abrir Demanda"). db push feito. Não deployado.
- `feature-service-desk-portal.md` (F2) — **IMPLEMENTADO local** (portal `/abrir-ticket`). db push + seed feitos. Não deployado. **Subdomínio `suporte.` + DNS = pendente.**
- `feature-playbooks-manuais.md` — **APROVADA (design)**, não implementada. KB markdown. Próxima feature de produto candidata.

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
**Ler primeiro `docs/features/service-desk-GUIA.md` (§9 Invariantes são obrigatórias).** Service Desk F1+F2 estão prontos em local, schema no Neon, mas NÃO no Vercel. Opções (Marcos escolhe):
1. **Subdomínio do portal** (F2 polish): `suporte.defenz.com.br` = mesma app Vercel via **host-rewrite** (middleware/`vercel.ts`) → `/abrir-ticket`, mesmo origin (sem CORS); **bloquear `/dashboard` no host `suporte.`**; DNS hoje na **YCORN** → migrar p/ Cloudflare/Vercel p/ gerir via prompt. (Spec já tem a seção "Domínio / hospedagem".)
2. **F4 — Sync do Zoho** p/ popular `AuthorizedClient` de verdade (hoje só o seed `scripts/seed-portal.ts` com "Cliente Teste"). Criar a spec `feature-service-desk-zoho-sync.md` sob o GUIA.
3. **Deploy pro Vercel** quando Marcos validar (schema já está no Neon dev=prod, então só `git push`). Lembrar: SW `CACHE_NAME` já está em `defenz-v3`.
4. **`feature-playbooks-manuais`** (aprovada, não implementada) — KB markdown. Outra feature de produto.
5. **Bug do AuditLog em PUT parcial** (chip, ainda aberto): `diffChanges` loga campos ausentes como `→ null` (afeta MCP `move/update_demanda` + curl). Fix: ignorar campos ausentes do payload. TDD em `src/lib/audit.ts`. (GUIA §9.6 lembra: o fix do ticket vive na rota, não centralizado.)
6. Deploy ordenado da Phase 2 do assignee-fk (independente; ver abaixo).

### Como testar o portal F2 (localhost)
`npm run dev` → `http://localhost:3000/abrir-ticket` → CNPJ `11.222.333/0001-81` · e-mail `teste@cliente.com.br` · nome qualquer → abre ticket + protocolo `SD-2026-...`. Qualquer outro CNPJ/e-mail → 422 genérico (anti-enumeração). Ticket aparece em `/dashboard/service-desk` (Solicitado). Seed: `npx tsx scripts/seed-portal.ts` (idempotente). Usuário-sistema: `portal@defenz.com.br`.

## Como operar dados em prod (resumo p/ contexto novo — detalhe em memória `project_api_access`)
- **Token**: `marcos-mcp` (admin, 4 empresas) está ativo e persistente em `~/.claude.json` → `projects["<repo>"].mcpServers.defenz.env.DEFENZ_API_TOKEN`. Scripts leem dele.
- **Banco único** dev=prod (Neon, ADR-008): `npx tsx scripts/<x>.ts` rodando da raiz do repo atinge prod. Padrão usado: criar card via `POST /api/demandas` (Bearer) e **horas de card via Prisma** (`demanda.update spentMinutes` + `timeEntry.create`) p/ NÃO disparar o bug do AuditLog (PUT parcial). Horas de **subtarefa** via `POST /api/demandas/[id]/subtasks` (limpo, lança no diário). IDs úteis: Defenz `cmn8wi8ze00003ouacf33hseb`, PSI `cmq3yyutf0000jo04bv6a5kmg`, Marcos `cmn7fk7u800013oi9yzq17egq`.
- **Padrão de log diário** preferido do Marcos: itens novos → 1 card "Atividades DD/MM" (concluída, cliente Defenz) com subtarefas ☑; itens que já têm card → subtarefa `[DD/MM]` no card existente (checar antes p/ não duplicar).

## In progress
- (nada em código aberto) — Service Desk F1+F2 implementados e commitados **local**; aguardam **deploy pro Vercel** (decisão do Marcos). Schema já no Neon (dev=prod).
- Pendente de produto: subdomínio `suporte.` (host-rewrite+DNS), F4 sync Zoho, Playbooks.
- feature-assignee-fk-migration continua aguardando deploy ordenado (independente).
- Bug AuditLog PUT parcial: ainda aberto (chip).

## Recently completed (last 5)
- 2026-06-25→27 **Service Desk: MCP Subtasks + fix PWA/SW + GUIA + F1 + F2** (commits `f6ed430`, `fix(pwa)`, `e59448e` specs, `feat(service-desk): F1`, `feat(service-desk): F2`, + docs). **MCP Subtasks** (4 tools). **Fix PWA/Service Worker**: o "menu some/aparece" era o SW servindo app shell cacheado — dev autodesregistra + `CACHE_NAME` bump + stale-while-revalidate + SW fora da rota pública. **GUIA mestre** do Service Desk + spec do portal (revisão adversarial 48 achados aplicada). **F1** (Kanban v2: 3 colunas DnD, WIP soft vermelho, aging verde→âmbar→**preto**, campo `client`+autocomplete, drawer, "Abrir Demanda" 1:1, migração status open/paused/resolved→solicitado/em_atendimento/concluido, Defenz-only). **F2** (portal público `/abrir-ticket`: verifica CNPJ+e-mail contra `AuthorizedClient`, ticket Defenz `source=portal`, protocolo atômico `TicketSequence`, usuário-sistema `portal@defenz.com.br`, endpoint burro + anti-enumeração 422 uniforme + honeypot + rate-limit; badge "novos"). Orquestração Sonnet(∥)+Opus(review), gate main loop. **666 testes, tsc+build verdes. db push + seed no Neon. Smoke E2E navegador OK** (F1: board/aging/PUT status; F2: protocolo SD-2026-000001, 4 falhas→422 idêntico, ticket no board). **NÃO deployado pro Vercel.**
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
0c. **Service Desk** — agora tem **GUIA MESTRE**: [`docs/features/service-desk-GUIA.md`](features/service-desk-GUIA.md) (visão, modelo de dados canônico, métricas, **Invariantes §9** = bugs já pagos, roadmap de features, ADRs). Ler SEMPRE antes de tocar Service Desk. Pipeline:
   - **F1 Core** ✅ **IMPLEMENTADO** (commit `feat(service-desk): F1`) — Kanban 3 colunas (DnD/WIP soft/aging verde→âmbar→preto), campo `client` + autocomplete, drawer lateral, "Abrir Demanda" (POST `/api/tickets/[id]/open-demanda` 1:1), migração status v1→v2. Defenz-only (gate server-side). **604 testes, tsc+build verdes. db push + backfill no Neon feitos. Smoke E2E no navegador OK** (board, WIP 0/5, aging "há 2d" âmbar, open-demanda 200, PUT status concluir/reabrir). **NÃO pushado pro Vercel** (validar local 1º). Revisão Opus (12 achados) aplicada.
   - **F2 Portal público** ✅ **IMPLEMENTADO** (commit `feat(service-desk): F2`) — página **`/abrir-ticket`** (pública, sem auth, branding Defenz): verifica CNPJ+e-mail contra `AuthorizedClient` → cria ticket Defenz `source=portal` com protocolo atômico (`TicketSequence`, ex.: SD-2026-000001) via usuário-sistema `portal@defenz.com.br`. Endpoint burro + anti-enumeração (422 uniforme) + honeypot + rate-limit. Badge "novos" no board. **666 testes, tsc+build verdes. db push + seed feitos. Smoke E2E navegador OK** (protocolo na tela, 4 falhas → 422 idêntico, ticket no board c/ "Cliente Teste"). **Subdomínio `suporte.` + DNS = pendente** (host-rewrite depois). **NÃO pushado pro Vercel.** Seed de teste: CNPJ `11222333000181` / `teste@cliente.com.br`.
   - **Fix SW/PWA** (commit `fix(pwa)`) JÁ FEITO — era a causa do "menu some/aparece".
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
