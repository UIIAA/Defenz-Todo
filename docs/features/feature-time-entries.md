# Feature: Lançamento de horas por pessoa (timesheet) + aba "Horas"
**Status:** Draft
**Priority:** P1
**Date:** 2026-06-07

> Evolui [[feature-time-tracking]] (que introduziu o `spentMinutes` único por card) para um
> **diário de lançamentos por pessoa/data**, mantendo o Kanban (board) intacto. Cliente = Empresa
> (multi-empresa). Aprovado via brainstorming (Opção 1: diário = fonte da verdade).

## Objective
Permitir que cada pessoa lance horas trabalhadas em cada card (Demanda), de forma **atribuída** (quem) e **datada** (quando), e extrair/visualizar essas horas **agrupadas** por cliente (empresa), pessoa, equipe, área e card, com filtro de período — numa nova aba "Horas". O total de horas do card passa a ser a **soma dos lançamentos** (número único e coerente).

## Behavior
1. No **modal** de um card (board inalterado), a área de horas vira uma seção **"Lançamentos de horas"**: lista (data, quem, horas, descrição) + formulário "Lançar horas" (horas decimais, data=hoje por default, descrição opcional).
2. Por padrão o lançamento é atribuído ao **usuário logado**. Admin/gerência podem lançar/editar/excluir **por outra pessoa do seu escopo** (select).
3. Ao criar/editar/excluir um lançamento, o servidor **recalcula** `Demanda.spentMinutes` = soma dos lançamentos do card. O badge do card e o `totalSpentMinutes` continuam funcionando (agora alimentados pelos lançamentos).
4. A aba **"Horas"** (`/dashboard/demandas/horas`, ao lado de Análises/Relatório) lista e **agrupa** os lançamentos com filtros (período, empresa/cliente, equipe, pessoa): totais por pessoa, por cliente, por equipe, por área e por card.
5. Escopo de tenant por **conjunto** (multi-empresa): admin vê tudo; gerência/user só das suas empresas.

## Business Rules
- **`TimeEntry` é a fonte da verdade** das horas gastas no nível do card. `Demanda.spentMinutes` é cache derivado (= Σ lançamentos do card), recalculado a cada mutação.
- **Subtarefas ficam fora do v1**: `Subtask.spentMinutes`/`estimatedMinutes` permanecem como estão (estimativa manual). A aba "Horas" reporta apenas lançamentos de card. O badge do card mantém a fórmula atual (`spentMinutes` do card + Σ subtarefas) — o `spentMinutes` do card agora vem dos lançamentos.
- **`estimatedMinutes` (estimativa) continua manual** no modal (separado do realizado).
- **Cliente = Empresa**: agrupar "por cliente" = agrupar pelo `companyId` do card. Sem campo "projeto".
- **Permissão de lançamento**: `user` lança/edita/exclui só lançamentos **próprios** (em qualquer card que ele acessa). `admin`/`gerencia` podem lançar/editar/excluir por qualquer pessoa do **seu conjunto** de empresas.
- **Resiliência a exclusão de usuário**: o lançamento guarda `userName` (snapshot) e o FK `userId` é `SetNull` ao deletar o usuário — os dados históricos de horas **não se perdem**.
- **Visibilidade**: a **lista de lançamentos de um card** (no modal, e `GET /api/demandas/[id]/time-entries`) é visível a **qualquer pessoa que acessa o card** (transparência — todos veem quem lançou o quê), mas cada um só **edita/exclui** os próprios (admin/gerência: do escopo). A **aba "Horas"** (visão agregada de todos os cards, `GET /api/time-entries`) é restrita a `admin` + `gerencia`, escopada ao conjunto. (Lançar horas continua disponível a todos no modal.)
- Sem exportação no v1 (só visualização) — pode ser adicionada depois.

## Edge Cases
- Lançar em card de empresa fora do conjunto (não-admin) → 403.
- Lançar por outra pessoa fora do escopo (não-admin) → 403; `user` tentando lançar por outro → 403 (só self).
- Minutos ≤ 0 ou não-inteiro → 400.
- Card sem empresa (`companyId` null) → agrupa em "Sem cliente".
- Usuário deletado → lançamentos preservados via `userName` (FK null).
- Recompute idempotente: deletar todos os lançamentos → `spentMinutes` = 0.

## Data Contract
- **TimeEntry** (Prisma, novo):
  - `id`, `demandaId` FK→Demanda (Cascade), `userId?` FK→User (SetNull), `userName String` (snapshot),
    `minutes Int` (>0), `workedOn DateTime` (data do trabalho), `description String?`,
    `createdBy String?` (quem registrou), `createdAt`.
  - índices: `demandaId`, `userId`, `workedOn`.
  - relações: `Demanda.timeEntries TimeEntry[]`, `User.timeEntries TimeEntry[]`.
- **Migração**: `db push` aditivo (ADR-008). Backfill `scripts/backfill-time-entries.ts` (idempotente): p/ cada Demanda com `spentMinutes>0` e sem lançamentos, cria 1 lançamento inicial (userId=assignedToId||userId, userName=nome, minutes=spentMinutes, workedOn=updatedAt, description="Lançamento inicial (migração)").
- **APIs** (família demanda — aceitam sessão **e** Bearer via `resolveActor`, tenant-scoped):
  - `GET /api/demandas/[id]/time-entries` — lista do card.
  - `POST /api/demandas/[id]/time-entries` `{minutes, workedOn?, description?, userId?}` → cria + recompute + AuditLog.
  - `PUT /api/demandas/[id]/time-entries/[entryId]` `{minutes?, workedOn?, description?}` → edita + recompute.
  - `DELETE /api/demandas/[id]/time-entries/[entryId]` → exclui + recompute.
  - `GET /api/time-entries?from&to&companyId&teamId&userId` — lançamentos filtrados (admin/gerência, escopo por conjunto via relação demanda), p/ a aba agregar. Cap de itens com aviso.
- **Validação**: `src/lib/validations/time-entry.ts` (Zod).
- **Helper puro**: `sumMinutes(entries)` e agregadores (`groupBy`) testáveis em `src/lib/time-entries.ts`.

## Acceptance Criteria
- [ ] Modelo `TimeEntry` criado; `Demanda.spentMinutes` recalculado como Σ lançamentos em cada mutação.
- [ ] POST cria lançamento (self por default; admin/gerência por outro do escopo); 403 fora do conjunto (empresa ou pessoa); 400 minutos inválidos.
- [ ] PUT/DELETE respeitam permissão (próprio, ou admin/gerência no escopo) e recalculam `spentMinutes`.
- [ ] `GET /api/demandas/[id]/time-entries` e `GET /api/time-entries` são tenant-scoped por conjunto.
- [ ] Modal do card: seção de lançamentos (lista + form), board do Kanban inalterado.
- [ ] Aba "Horas" agrupa por pessoa, cliente, equipe, área e card, com filtro de período; escopada.
- [ ] Backfill converte `spentMinutes` existentes em lançamentos iniciais (idempotente).
- [ ] Mutações gravam AuditLog. Lockstep do mock `auth.ts` mantido.

## Technical Decisions
- **Opção 1 (fonte da verdade)** escolhida no brainstorming: um único número de horas, rastreável; vs. manter `spentMinutes` paralelo (descartado por gerar dois conceitos divergentes).
- **Snapshot `userName`** + FK `SetNull`: preserva relatórios após exclusão de usuário ("dados importantes").
- **Sem denormalizar companyId/teamId** no lançamento: filtra/agrupa via relação `demanda` (sempre correto; `companyId` é imutável, `teamId`/`classification` lidos ao vivo).
- **Escopo por conjunto** reusa helpers de `src/lib/auth.ts` (`assertCompanyAccess`, `companyScopeWhere`, `accessibleCompanyIds`) — consistente com Fase D.
- **Bearer na família demanda**: APIs de time-entry aceitam token (futuro: MCP lançar horas).
- **Agregação client-side** na aba (a partir de lançamentos filtrados) → flexível p/ múltiplos eixos; cap de itens p/ não estourar contexto.

## Build order (TDD, proporcional)
1. Schema `TimeEntry` + relações; `npx prisma validate` + `db push`; mock prisma ganha `timeEntry`.
2. Zod `time-entry.ts` + helper puro `time-entries.ts` (sum/group) — testes.
3. `recomputeSpentMinutes(demandaId)` helper (server) — teste.
4. API `/api/demandas/[id]/time-entries` (GET/POST) — testes (self, admin-for-other, 403 escopo, recompute).
5. API `[entryId]` (PUT/DELETE) — testes (permissão, recompute).
6. API agregada `/api/time-entries` (GET) — testes (escopo + filtros).
7. UI: seção de lançamentos no modal da Demanda (substitui input manual de horas gastas).
8. UI: página `/dashboard/demandas/horas` + item de nav; agrupamentos + filtros.
9. Backfill `scripts/backfill-time-entries.ts` (idempotente).
10. Gate: `npm run build && npx tsc --noEmit && npm test`. Validar na UI.

## Dependencies
- Depende de: [[feature-time-tracking]] (spentMinutes), [[feature-multi-company-membership]] (escopo por conjunto), [[feature-tenant-isolation]] (helpers).
