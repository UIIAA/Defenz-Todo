# CHANGELOG

Formato: semver. Entradas mais recentes primeiro.

## [Unreleased]
### Added
- **API Service Token (Bearer) — Solução A (alimentar Kanban de fora)**: novo modelo `ApiToken` (SHA-256 do token, `tokenPrefix`, `userId` FK, `expiresAt?`/`revokedAt?`/`lastUsedAt?`). Helper `resolveActor(request)` em `src/lib/auth.ts` autentica via `Authorization: Bearer <token>` (lookup por hash → SessionUser do usuário dono, herdando role + empresas + teams), com fallback para sessão NextAuth quando não há header; header presente e inválido → 401 (sem fallback silencioso). Aceito na família demanda: `GET/POST/PUT/DELETE /api/demandas`, subtasks e links (POST/PUT/DELETE). Mutações gravam `AuditLog` com o `userId` do dono do token. Script `scripts/create-api-token.ts` (`--role`/`--email`, `--name`, `--expires`) gera o token, imprime o plaintext UMA vez e persiste só o hash (rotação por `--name`). Formato `defz_`+56hex (224 bits → SHA-256, padrão PAT GitHub/Stripe). Specs: `docs/features/feature-api-service-token.md`, `docs/features/feature-external-kanban-feed.md`. 14 testes novos (resolveActor + rota Bearer end-to-end).
- **Multi-empresa por usuário (fundação)**: novo modelo `UserCompany` (N:N, aditivo) — `User.companyId` permanece a empresa **primária** (branding/default). Sessão JWT carrega `companyIds[]`. Helpers de tenant em `src/lib/auth.ts` passam a operar por **conjunto** acessível (`accessibleCompanyIds`, `assertCompanyAccess`, `companyScopeWhere`, `resolveActiveCompany`), com backward-compat total (single-company → comportamento atual; sem backfill necessário pois a primária está sempre no conjunto). Schema aplicado no Neon via `db push` (aditivo). Spec: `docs/features/feature-multi-company-membership.md`. 14 testes novos (impl real como fonte da verdade + mock em lockstep). **Pendente:** atualizar as ~12 rotas restantes para o conjunto + UI Configurações→Usuários (multi-select) + configurar Marcos + gerar token do Marcos.
- **Dependências entre Demandas (dependencies-v1 finalizada)**: edição via combobox "Depende de" no modal da Demanda (busca por título, multi-seleção com badges). API POST/PUT de Demanda agora aceita/persiste `dependsOn` (JSON string) com guardas tenant-scoped: **self-dependency**, **ID inválido** e **ciclo** (DFS) → erro 400 pt-BR + toast no modal. `detectCycle` extraído para `src/lib/dependency-graph.ts` (reutilizável). **Dependências clicáveis**: o badge de deps no card abre a tarefa da dependência (1 dep → direto; várias → abre a própria demanda); no modal, o título de cada badge navega para a dependência. Visualização (badge no card, overlay SVG no Kanban, setas no Gantt) já existia e passa a ser alimentada pela edição. Módulo `activities` órfão (protótipo de referência não montado em página) **removido** (`api/activities`, `components/activities` e testes). Coluna `Activity.dependsOn` permanece no schema (remoção exigiria migration destrutiva; débito anotado). Spec: `docs/features/feature-demanda-dependencies.md`. Testes: grafo (ciclo 2/3 nós), validação, API (self/ciclo/inválido).
- **Controle de horas gastas (time tracking)**: novas colunas `estimatedMinutes Int?` + `spentMinutes Int @default(0)` em `Demanda` e `Subtask` (persistência canônica em minutos; UI em horas decimais pt-BR). Horas estimadas opcionais + gastas obrigatórias, nos dois níveis. Total do card é aditivo (`spentMinutes` da demanda + Σ subtarefas). KanbanCard ganha badge de relógio (`1,5/8h`, vermelho quando gasto > estimado); modal de Demanda ganha inputs de horas estimadas/gastas; cada subtarefa ganha input compacto de horas (salva via PUT no blur/Enter). API: POST/PUT demanda e subtask persistem os campos; alterações de Demanda entram no AuditLog. Helpers `parseHoursToMinutes`/`minutesToHoursLabel`/`minutesToHoursInput` em `src/lib/duration.ts`; agregação `totalSpentMinutes`/`totalEstimatedMinutes` em `helpers.ts`. 44 testes novos (validação, helpers, API, render do card em todas as 5 colunas + stress de valores extremos e 500 subtarefas) — 419 total. Spec: `docs/features/feature-time-tracking.md`. Schema aplicado no Neon dev via `prisma db push` (colunas aditivas; migration formal fica para o deploy coordenado com `add_assignee_fk`).
- **Assignee como FK (Phase 2)**: nova coluna `Demanda.assignedToId` (FK para `User`, `ON DELETE SET NULL`) torna-se a fonte de verdade do responsável da demanda. POST/PUT aceitam `assignedToId`; servidor faz lookup do User, valida `companyId` (não-admin não pode atribuir cross-company) e auto-popula `Demanda.assignee` (string) como display cache denormalizado. GET para role `user` filtra `OR: [{ teamId IN [...] }, { assignedToId: user.id, companyId: user.companyId }, { assignee: key, companyId, assignedToId: null }]` — FK + tenant guard, com fallback string para legacy. PUT/DELETE auth: FK match com tenant guard, fallback string só quando `assignedToId IS NULL`. Frontend `demanda-modal.tsx` agora envia `User.id` no `<SelectItem>` em vez de `name||email`. Migration SQL: `prisma/migrations/20260428180000_add_assignee_fk/`. Backfill: `scripts/backfill-assignee.ts` (idempotente, loga não-resolvidos). 13 testes novos cobrindo POST FK, PUT FK, GET tri-OR, tenant guard, legacy fallback, cross-company assignment block (331 total).
  - **Próximos passos para deploy**: (1) `prisma migrate deploy` (DIRECT_URL) em staging; (2) `tsx scripts/backfill-assignee.ts`; (3) revisar `unresolved_assignees.log`; (4) deploy do código; (5) repetir em prod.

### Fixed
- **Assignee não via a própria demanda (P0)**: role `user` filtrava demandas apenas por `teamId ∈ user.teamIds` em GET/PUT/DELETE de `/api/demandas`. O campo `assignee` (string) nunca entrava no `where`. Resultado: ao atribuir Leonardo (team B) numa demanda criada por Marcos (team A), Leonardo não conseguia ver/editar/deletar a demanda. Fix: GET monta `where.OR = [{ teamId in [...] }, { assignee: (user.name ?? user.email), companyId: user.companyId }]`. PUT/DELETE autorizam `inOwnTeam || isAssignee` com tenant guard por `companyId`. 9 testes novos (318 total). Phase 2 (`feature-assignee-fk-migration.md`) planejada para eliminar fragilidade do match por string.
- **Bug de timezone em datas (P0)**: `dateIn`, `deadline`, `dateDone`, `reminderDate` perdiam 1 dia ao salvar porque `new Date("YYYY-MM-DD")` em Node interpreta como UTC midnight e renderiza um dia antes em America/Sao_Paulo. Novo helper `parseLocalDate()` em `src/lib/date.ts` parseia como meia-noite SP. Aplicado em POST e PUT `/api/demandas`. 9 testes novos (298 total).

### Security
- **Tenant isolation fix (P0)**: gerencia/user agora são hard-scoped a `session.user.companyId`. Apenas admin cruza empresas. Corrigido em 6 rotas: `demandas/[id]/links`, `demandas/[id]/links/[linkId]`, `demandas/[id]/subtasks`, `demandas/[id]/subtasks/[subtaskId]`, `users`, `invites`, `audit-logs`. Helper central `assertCompanyAccess()` em `src/lib/auth.ts`.
- `company-selector` agora só renderiza para `admin`.

### Added
- Harness spec-driven structure: `docs/PROGRESS.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`, `docs/CHANGELOG.md`
- Feature spec `docs/features/feature-tenant-isolation.md` (P0)
- Helpers `isAdmin()`, `assertCompanyAccess()`, `companyScopeWhere()` em `src/lib/auth.ts`
- 10 novos testes cobrindo tenant isolation (289 total passando)

### Changed
- `.claude/CLAUDE.md` reescrito como mapa para `docs/` (enxuto, ~120 linhas)

---

## [0.2.0] - 2026-04-05
### Added
- Relatório executivo branded slide-based com JSON estruturado via Gemini (1c3787c)
- Relatório executivo IA para demandas concluídas (9f1e553)
- Reminder de demandas com notificação por email + alertas visuais (ad8f7c1)
- Links em demandas, CRUD de empresas na UI, permissões de navegação por role (c8ed653)
- Hierarquia multi-tenant Company > Team com branding (logo + accent color) (eebe6e9)
- Datas de lifecycle no modal e cards do Kanban (54ebad2)
- Barra de filtros compacta com dropdowns (9b3b77a)
- Filtro de classificação, filtro de período, timezone fix (8786afb)

### Fixed
- Login e registro case-insensitive (39e19fb)

---

## [0.1.x] - 2026-01 a 2026-03
### Added
- Layout responsivo, suporte PWA, password reset, double-click protection (25ad4eb)
- Campo de classificação, revoke invites, user management, bugfix do modal + Prisma sync (4554e05)
- Kanban v2: 5 features (contrast, timeline click, WIP per user, blocked lane, gray tone) (60dcd20)
- Link Home na sidebar + transições suaves (dec1543)
- Registro invite-only + dropdown de assignee + admin user management (c916249)
- Shared team board — todos os users veem todas as demandas (b14a5ce)
- Enterprise polish — 3 sprints (5f31076)
- Profile page com preferências de notificação + integração Resend (9e5e8d4)
- Kanban/Timeline colapsáveis + scroll para 50+ demandas (d48b305)
- Memphis Corporate redesign do dashboard (b4dae19)

### Fixed
- Dropdown com texto invisível em light mode (a8ea9be)
