# Feature: Diário de horas automático (delta-on-save) + campo Cliente + aba "Horas"
**Status:** Draft
**Priority:** P1
**Date:** 2026-06-07

> Evolui [[feature-time-tracking]] (que introduziu o `spentMinutes` de livre edição). Aprovado via
> brainstorming (**Desenho B**): as horas continuam de **livre edição** (modal inalterado); o diário
> é **alimentado automaticamente** pelo delta a cada Salvar, sem mudar a UX. "Cliente atendido" é uma
> dimensão NOVA, distinta da Empresa-tenant do multi-empresa.

## Conceitos (a distinção que motiva tudo)
- **Empresa (tenant)** = quem usa o app / dono do Kanban (Defenz, Cow Cycling…). Já existe (multi-empresa). Define o **escopo/tenant**.
- **Cliente (atendido)** = para quem o trabalho foi feito (clientes da Defenz). **Não existe hoje** no modelo. Novo campo de **texto livre** no card (vira lista gerenciável no futuro). É o eixo principal do relatório.

## Objective
Permitir extrair "quem atuou, para qual cliente, por quanto tempo, em que período" **sem mudar a edição de horas** que já existe. As horas seguem de livre edição (card + subtarefas); a cada Salvar que altera horas, o servidor grava um **lançamento (delta)** num diário, atribuído ao **Responsável** do card e datado no momento do Salvar. A aba "Horas" agrega o diário.

## Behavior
1. Editar horas no modal (card ou subtarefa) **continua exatamente como hoje** (livre edição). Modal só ganha um campo **"Cliente"** (texto livre).
2. Ao **Salvar** uma alteração de horas, o servidor calcula o **delta** (novo − antigo). Se ≠ 0, grava 1 linha no diário: `{ card, Responsável (quem), cliente (snapshot), minutos = delta, quando = agora, origem = card|subtask }`.
3. **Independe do status/movimentação do card** — conta no Salvar, não na conclusão. Correção posterior grava delta negativo (o total sempre fecha).
4. **Subtarefas também contam**: editar/criar/excluir horas de subtarefa grava delta (atribuído ao Responsável do card, mesmo cliente).
5. **Período fica exato** (cada lançamento é datado no Salvar; orienta-se preencher ~1x/dia).
6. **Aba "Horas"** (`/dashboard/demandas/horas`, admin/gerência, escopada): filtra (período, cliente, responsável, equipe) e agrupa por **Cliente, Responsável, Equipe, Área e Card**.

## Business Rules
- **Horas continuam de livre edição e fonte autoritativa do card** (`spentMinutes` do card e da subtarefa inalterados). O diário (`TimeEntry`) é **derivado/aditivo** — não troca a fonte da verdade, não há recompute, não trava input.
- **Atribuição ("quem atuou") = Responsável do card** (`assignedToId`); se o card não tiver responsável, atribui ao **editor** (quem salvou). `userName` é gravado como **snapshot** (resiliente a exclusão de usuário; FK `SetNull`).
- **Cliente** é **snapshot** no lançamento (texto livre no momento do Salvar) — o diário é um registro imutável de evento. Equipe/Área/Título são lidos **ao vivo** do card no relatório (estrutura org atual).
- **Sem CRUD manual de lançamentos**: o diário é só leitura (gerado por ações). Correções se fazem editando as horas do card/subtarefa (gera delta). Não há tela de "lançar horas".
- **Consistência**: soma dos deltas de um card (incluindo seed inicial) = `totalSpentMinutes` do card (card + subtarefas). Edição fora do app (script/DB direto) não gera delta (débito anotado).
- **Escopo de tenant por conjunto**: a aba/relatório (`GET /api/time-entries`) é `admin` + `gerencia`, escopado via `companyId` do card (helpers de `src/lib/auth.ts`). A gravação do delta é server-side em quem já pode editar a Demanda (sem permissão nova).
- Sem exportação no v1 (só visualização).

## Edge Cases
- `data.spentMinutes` igual ao atual → delta 0 → **não grava**.
- Card sem responsável → atribui ao editor; sem cliente → agrupa em "Sem cliente".
- Subtarefa criada com horas → delta = +horas; subtarefa excluída → delta = −horas.
- Usuário deletado → lançamentos preservados (`userName` snapshot, FK null).
- Delta negativo (correção) some corretamente no agregado.
- Edição via Bearer (MCP/curl) também gera delta (gravação é server-side, independe do caminho de auth).

## Data Contract
- **Demanda**: novo campo `client String?` (texto livre, "Cliente atendido"). Entra em `createDemandaSchema`/`updateDemandaSchema` e no modal.
- **TimeEntry** (Prisma, novo — o diário):
  - `id`, `demandaId` FK→Demanda (Cascade), `userId?` FK→User (SetNull), `userName String` (snapshot),
    `minutes Int` (delta; pode ser negativo), `client String?` (snapshot), `source String` ("card"|"subtask"),
    `subtaskId String?` (rastreio), `createdById String?` (editor), `createdAt DateTime @default(now())`.
  - índices: `demandaId`, `userId`, `createdAt`.
  - relações: `Demanda.timeEntries TimeEntry[]`, `User.timeEntries TimeEntry[]`.
- **Migração**: `db push` aditivo (ADR-008). Seed `scripts/backfill-time-entries.ts` (idempotente): p/ cada Demanda com `totalSpentMinutes>0` e sem lançamentos, cria 1 lançamento inicial (`minutes = totalSpentMinutes`, `userId=assignedToId`, `userName=assignee`, `client=demanda.client`, `createdAt=updatedAt`, `source="seed"`).
- **Gravação do delta** (server-side, sem endpoint novo):
  - `PUT /api/demandas`: se `data.spentMinutes !== undefined` e `≠ current.spentMinutes` → grava delta (origem "card").
  - `POST/PUT/DELETE /api/demandas/[id]/subtasks*`: delta do `spentMinutes` da subtarefa (origem "subtask"), atribuído ao Responsável do card pai.
- **Leitura** (aba): `GET /api/time-entries?from&to&client&teamId&userId` — lançamentos filtrados, escopados por conjunto (via relação `demanda`), com `demanda` (title/teamId/classification) incluído. Cap de itens com aviso (`log`).
- **Helpers puros** (`src/lib/time-entries.ts`): `computeDelta(oldMin, newMin)`, `groupBy(entries, keyFn)`, `sumMinutes(entries)` — testáveis.

## Acceptance Criteria
- [ ] Campo `Demanda.client` (texto livre) criado, no schema Zod e no modal.
- [ ] `PUT /api/demandas` grava lançamento de delta quando `spentMinutes` muda (não grava se delta 0); atribui ao Responsável (fallback editor); snapshot de cliente + userName.
- [ ] Subtarefa (POST/PUT/DELETE) grava lançamento de delta atribuído ao Responsável do card pai.
- [ ] `GET /api/time-entries` é tenant-scoped por conjunto (admin/gerência); filtros período/cliente/equipe/responsável.
- [ ] Aba "Horas" agrupa por Cliente, Responsável, Equipe, Área e Card; filtro de período (datado no Salvar = exato).
- [ ] Edição de horas no modal **inalterada** (livre); board do Kanban inalterado.
- [ ] Seed backfill idempotente; soma dos lançamentos = `totalSpentMinutes` do card.
- [ ] Lockstep do mock `auth.ts`/`prisma.ts` mantido; gate verde (build+tsc+test).

## Technical Decisions
- **Delta-on-save (Desenho B)**: o diário é alimentado pela ação de Salvar, preservando a livre edição — vs. (a) diário como fonte da verdade travando o input (rejeitado), (b) diário manual com CRUD (rejeitado — muda a UX).
- **Cliente ≠ Empresa-tenant**: dimensão nova, texto livre v1 (lista gerenciável depois). Snapshot no lançamento.
- **Atribuição ao Responsável** (não ao editor) reflete "quem atuou"; `userName` snapshot p/ resiliência.
- **Append-only / sem recompute**: zero risco ao fluxo de horas atual; consistência garantida por seed + deltas.
- **Reaproveita** `resolveActor`/helpers de tenant (Fase D) e `minutesToHoursLabel`/`totalSpentMinutes` existentes.
- **AuditLog permanece** p/ auditoria geral; `TimeEntry` é o log dedicado e otimizado p/ relatório de horas.

## Build order (TDD, proporcional)
1. Schema: `Demanda.client` + `TimeEntry` + relações; `prisma validate` + `db push`; mock prisma ganha `timeEntry`.
2. `src/lib/time-entries.ts` (computeDelta/groupBy/sumMinutes) + Zod `client` na demanda — testes.
3. Helper server `logTimeDelta(...)` (monta o lançamento) — teste.
4. Hook no `PUT /api/demandas` (delta card) — testes (grava em mudança, ignora delta 0, atribui responsável/fallback, snapshot cliente).
5. Hook nos subtasks routes (delta subtask) — testes (create/update/delete → delta).
6. `GET /api/time-entries` (escopo + filtros) — testes.
7. UI modal: campo "Cliente" (texto livre). Board inalterado.
8. UI aba `/dashboard/demandas/horas` + nav; agrupamentos + filtros.
9. Seed `scripts/backfill-time-entries.ts`.
10. Gate: `npm run build && npx tsc --noEmit && npm test`. Validar na UI.

## Dependencies
- Depende de: [[feature-time-tracking]] (spentMinutes livre edição), [[feature-multi-company-membership]] (escopo por conjunto), [[feature-tenant-isolation]] (helpers), [[feature-api-service-token]] (Bearer também gera delta).
