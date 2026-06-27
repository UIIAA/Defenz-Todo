# Feature: Menu "Service Desk" (tickets) — integrado ao Kanban Defenz
**Status:** v1 Implemented (em dev/localhost) → **Redesign v2 APROVADO em design (2026-06-25), pendente implementação** — ver seção "Redesign v2" abaixo. Deploy Vercel ainda não feito.
**Priority:** P2
**Date:** 2026-06-24 (design fechado após brainstorming + pesquisa multi-agente de 6 ferramentas renomadas)

> Histórico do brainstorming, opções A/B/C cruas e a pesquisa completa: ver `docs/PROGRESS.md` (sessão 2026-06-24) e a memória `project_session_2026_06_24`. Este doc é o design **fechado**.

## Objective
Uma ferramenta de **Service Desk** própria da Defenz para abrir/triar/resolver **tickets** de atendimento, medir o fluxo (volume, interações, tempo aberto, escalonamento) e **vincular ao Kanban de Demandas** quando o ticket vira trabalho de execução — sem duplicar o trabalho nem poluir o board.

---

# Redesign v2 (2026-06-25) — Kanban Defenz-only com WIP, aging e "Abrir Demanda"
> Esta seção **supersede** as partes correspondentes da v1 (lista simples + modal central). A v1 (modelo `Ticket`/`TicketMessage`, 6 rotas, métricas) é a **base** — o v2 muda UI (lista→Kanban), gating (multi-empresa→Defenz-only), o campo de cliente, e adiciona aging/WIP/"Abrir Demanda". Brainstorming + crítica do 1º pensamento registrados na sessão 25/06 (memória `project_session_2026_06_24b`).

## Objetivo do redesign
Transformar o Service Desk numa ferramenta **interna da Defenz** (a agência), com os tickets organizados em **Kanban** (Solicitado → Em atendimento → Concluído), limite de **WIP**, **card que envelhece de cor** conforme o tempo na coluna, e um botão **"Abrir Demanda"** que cria uma Demanda já com os dados do cliente do ticket — conexão natural entre atendimento (ticket) e execução (demanda).

## Decisões fechadas (brainstorming 25/06)
1. **Defenz-only.** O Service Desk é exclusivo da Defenz (a agência). `Ticket.companyId` é **sempre Defenz**, resolvido/forçado no servidor (não vem do cliente). Removido o seletor de empresa-tenant da criação. O menu só aparece p/ quem acessa Defenz.
2. **Cliente atendido = campo `client` (texto livre + autocomplete).** NÃO é a empresa-tenant. Espelha `Demanda.client`; autocomplete com os clientes já usados (Holanda, Magalu, Vivo, Bevicred…). É o dado que flui pro "Abrir Demanda". (Rejeitado: dropdown fixo / reusar CRM `Client` — over agora.)
3. **Kanban 3 colunas:** `solicitado | em_atendimento | concluido` (migra os v1 open→solicitado / paused→em_atendimento / resolved→concluido). Drag-and-drop com `@dnd-kit` (padrão do board de Demandas). "Pausado" deixa de ser coluna; "aguardando N2" vira **badge** de escalado, não coluna.
4. **WIP soft.** Limite por coluna (default só "Em atendimento", ex.: 5). Ao estourar: contador "6/5" + coluna destacada (vermelho), mas **deixa arrastar** (nudge, não trava). Limite configurável numa config simples.
5. **Aging por `columnChangedAt`** (NÃO `updatedAt` — que reseta a cada edição). Novo campo setado **só na troca de status**. Cor progride **verde → âmbar → PRETO** (não vermelho — o vermelho fica reservado p/ o estouro de WIP, sinal diferente) por `agora − columnChangedAt` vs **limiares por coluna**; "Concluído" não envelhece. Card mostra selo "há Xd".
6. **"Abrir Demanda" cria, mas não move o ticket.** Cria `Demanda{companyId:Defenz, client:ticket.client, title:ticket.subject, description, status:'solicitada'}` + linka 1:1 (`ticket.demandaId`). **Não** muda a coluna do ticket (Marcos move manual). Mantém "vincular demanda existente" como ação secundária.
7. **Detalhe em drawer lateral (Sheet), não modal central** — corrige o bug "menu some ao clicar no ticket" (o Radix Dialog modal faz scroll-lock e briga com o layout flex do sidebar).

## Mudanças no modelo (Prisma)
```prisma
model Ticket {
  // ... campos v1 mantidos (subject, description, priority, channel, requester,
  //     escalatedAt, escalatedTo, firstReplyAt, resolvedAt, assignedToId, demandaId, messages) ...
  status          String    @default("solicitado")  // solicitado | em_atendimento | concluido
  client          String?                            // NOVO: cliente atendido (texto livre, autocomplete; ≠ company)
  columnChangedAt DateTime  @default(now())          // NOVO: quando entrou na coluna atual (motor do aging)
  companyId       String                             // sempre Defenz (forçado server-side)
  // @@index([companyId, status]) já existe
}
```
- **Migração de dados:** `db push` (aditivo: `client`, `columnChangedAt`). Backfill: `columnChangedAt = updatedAt` para os tickets existentes; status `open→solicitado`, `paused→em_atendimento`, `resolved→concluido` (1 ticket de teste hoje).
- **Touch-points de status (checklist obrigatório — literais `open/paused/resolved` hardcoded em ~7 pontos):**
  1. `src/lib/validations/ticket.ts` — enum/`default` do status.
  2. `prisma/schema.prisma` — `@default("open")` → `@default("solicitado")`.
  3. `src/lib/tickets-server.ts` — `computeTicketTimestamps` + `backlog = status !== 'resolved'`.
  4. `src/app/api/service-desk/metrics/route.ts` — qualquer comparação de status.
  5. `src/app/dashboard/service-desk/page.tsx` — filtros/colunas do board.
  6. `src/app/dashboard/service-desk/relatorio/page.tsx` — labels/“backlog”.
  7. Testes (`tickets-server.test.ts` etc.) — fixtures usam `open/resolved`.
  ⚠️ Esta migração é **HARD BLOCK** da F2 (portal grava `status='solicitado'`).
- `computeTicketTimestamps` passa a: setar `columnChangedAt=now` em **toda** troca de status; `resolvedAt=now` ao ir p/ `concluido`; limpar `resolvedAt` ao sair de `concluido`. `firstReplyAt` inalterado.
- Métricas: `backlog = status !== 'concluido'`; resto igual.

## Config (constante, sem tabela — YAGNI)
`src/lib/service-desk-config.ts`:
```ts
export const WIP_LIMITS = { solicitado: null, em_atendimento: 5, concluido: null } // null = sem limite
// limiares de aging em horas, por coluna: [verde<warn, warn<=âmbar<crit, vermelho>=crit]
export const AGING_HOURS = {
  solicitado:    { warn: 24,  crit: 72 },
  em_atendimento:{ warn: 48,  crit: 96 },
  concluido:     null, // não envelhece
}
```
Helper puro `ageColor(status, columnChangedAt, now)` → 'green'|'amber'|'black' (testável). 'black' = mais envelhecido (passou de `crit`); aplicado como fundo/borda escurecendo o card.

## Rotas (deltas sobre a v1)
- `POST /api/tickets` — remove `companyId` do contrato; resolve Defenz server-side (helper `defenzCompanyId()` por nome, cacheado). Aceita `client`.
- `PUT /api/tickets/[id]` — troca de status seta `columnChangedAt`. Aceita `client`.
- `POST /api/tickets/[id]/open-demanda` — **NOVA**: cria a Demanda a partir do ticket (Defenz, client/subject/description), seta `ticket.demandaId`, AuditLog `LINK`. (Reaproveita validação de tenant; a Demanda nasce em Defenz.)
- `GET /api/tickets/clients` — **NOVA** (ou param no GET): lista de `client` distintos (Demandas + Tickets de Defenz) p/ o autocomplete.
- `GET /api/service-desk/metrics` — relabel backlog; resto igual.
- Gating: todas as rotas de ticket exigem acesso a Defenz (admin sempre; demais se Defenz no conjunto) — senão 403.

## UI (deltas)
- `/dashboard/service-desk` vira **board Kanban** (3 colunas DnD), substituindo a lista. Header de coluna com contador/WIP. Card: assunto, cliente, badges (escalado N2, prioridade), selo de aging colorido, contador de interações. Botão "Novo ticket" (sem seletor de empresa; com campo Cliente autocomplete).
- Detalhe do ticket = **Sheet lateral** (substitui `TicketModal`): meta + thread (resposta/nota) + ações (escalar N2, **Abrir Demanda**, vincular existente). Mover de coluna = drag no board (ou select no drawer).
- `/dashboard/service-desk/relatorio` — só relabel dos status.
- Nav: item Service Desk visível só p/ quem acessa Defenz.

## Acceptance Criteria (v2)
- [ ] `Ticket.companyId` forçado a Defenz no servidor; criação sem seletor de empresa; não-acesso-Defenz → 403/menu oculto.
- [ ] Campo `client` (autocomplete) na criação e no card; persiste.
- [ ] Board Kanban 3 colunas com DnD que muda o status; `columnChangedAt` atualiza na troca (não em outras edições).
- [ ] WIP soft: coluna mostra "N/limite" e destaca ao estourar, sem travar o drop.
- [ ] Aging: `ageColor` puro testado (verde/âmbar/**preto** por coluna); card escurece + "há Xd".
- [ ] "Abrir Demanda" cria Demanda em Defenz com `client`/`title`/`description` do ticket, linka 1:1, **não** move o ticket; chip clicável abre a demanda.
- [ ] Detalhe em Sheet lateral — clicar no ticket **não** some com o menu (bug v1 corrigido; verificar no navegador).
- [ ] `npm run build && npx tsc --noEmit && npm test` verdes; testes proporcionais.

## Fora do redesign (fase 2)
- WIP hard (bloquear drop); aging/WIP configuráveis por UI; clientes como entidade; auto-mover ticket no "Abrir Demanda"; multi-empresa no Service Desk.

---

## Decisões fechadas (brainstorming 2026-06-24)
1. **Arquitetura = Opção B enxuta.** `Ticket` é entidade própria, com vínculo **1:1 opcional** a uma `Demanda` (`demandaId?`). O ticket mede o atendimento (SLA, canal, escalonamento); quando vira trabalho, **linka/gera uma Demanda** que toca o board + diário de horas existentes. Tickets que não geram execução não precisam de Demanda. (Rejeitada a Opção A = Ticket=Demanda, porque infla o "tempo aberto" e não tem campos canônicos de atendimento.)
2. **"Nível 2" = parceiro/fornecedor EXTERNO** (ex.: SecuriSoft / Bitdefender N2), não um tier interno. Escalonar = **encaminhar pra fora**. Modelado por `escalatedAt` (quando) + `escalatedTo` (a quem). A métrica "% repassado pro N2" = `count(escalatedAt≠null)/total`, com breakdown por parceiro.
3. **Sem contadores materializados.** Interações são derivadas por `COUNT(TicketMessage)`. Motivo: o codebase já sofreu com mutação parcial (bug do AuditLog PUT) e a operação via Prisma direto fura hooks de increment.
4. **3 estados** (`open | paused | resolved`), calendar time puro para "tempo aberto" (sem partição pending/on_hold no MVP). Escalonamento auditado pelo **`AuditLog` existente** (`action='ESCALATE'`, `entityType='Ticket'`) — sem tabela de eventos nova.
5. **Horas NÃO reusam `logTimeDelta`** diretamente no Ticket. `logTimeDelta` (`src/lib/time-entries-server.ts:13`) exige `demandaId` (FK obrigatória). Horas vivem na **Demanda vinculada**; o ticket não tem diário de horas próprio.

## Behavior
1. **Abrir ticket (interno, MVP):** um membro do time registra um ticket de atendimento — `subject`, `description?`, `requester?` (quem pediu, texto livre), `channel?` (email/whatsapp/telefone/chat), `priority`. Nasce `status='open'`, `companyId` = empresa ativa.
2. **Interagir:** cada resposta/anotação é um `TicketMessage` (`kind='reply'` conta como interação; `kind='note'` é nota interna que **não** conta). A 1ª `reply` de um agente grava `firstReplyAt`.
3. **Escalonar pro Nível 2:** ação "Encaminhar ao N2" → grava `escalatedAt=now` + `escalatedTo` (parceiro) e cria `AuditLog(action='ESCALATE')`. Idempotente: re-encaminhar não sobrescreve `escalatedAt` (mantém o 1º), mas pode atualizar `escalatedTo`.
4. **Vincular a Demanda:** ação "Gerar/Linkar Demanda" → cria uma `Demanda` (herda `companyId`, `client`←`requester`, título←`subject`) ou linka uma existente, setando `Ticket.demandaId`. A execução e as **horas** passam a viver na Demanda.
5. **Resolver:** `status='resolved'` grava `resolvedAt=now` (fecha o relógio do ticket). `paused` é estado intermediário (aguardando terceiro/cliente) que **não** pausa o relógio no MVP (calendar time).
6. **Relatórios:** página `/dashboard/service-desk` (e sub-aba de relatório) mostra volume, backlog, interações/ticket, tempo médio aberto/resolução e % escalado — tudo scoped por empresa, no estilo visual da aba `/dashboard/demandas/horas`.

## Business Rules
- **Multi-tenant:** `Ticket.companyId` é **NOT NULL**. Todas as rotas usam `companyScopeWhere`/`assertCompanyAccess` (`src/lib/auth.ts`). admin cruza empresas; gerência/user hard-scoped ao conjunto.
- **Link Ticket↔Demanda valida empresa:** ao setar `demandaId`, a Demanda alvo **tem que estar no mesmo escopo de empresa** do ticket (`assertCompanyAccess(demanda.companyId, user)`). Sem isso, gerência de empresa A linkaria ticket a demanda de B (viola regra crítica 6 do CLAUDE.md).
- **Timestamps de relógio (`firstReplyAt`/`escalatedAt`/`resolvedAt`) são gravados num ÚNICO ponto de service-layer** (transição de status/ação), nunca espalhados por múltiplos handlers — assim escrita por caminho alternativo (MCP/script Prisma) não deixa o ticket "eternamente aberto" inflando o MTTR. Derivar `resolvedAt` da transição `→resolved`.
- **Interações = fonte da verdade `COUNT(TicketMessage WHERE kind='reply')`.** Nunca um contador cacheado no MVP.
- **Escalonamento ≠ origem:** `escalatedAt` é setado **só na ação de encaminhar**, nunca na criação. Assim "% que foi pro N2" é honesto (não conta tickets que já nasceram com parceiro).
- **Audit:** criar/atualizar/escalonar/resolver/linkar grava `AuditLog` via `createAuditLog` + `diffChanges`.

## Edge Cases
- Encaminhar ao N2 um ticket já escalado → mantém o `escalatedAt` original (idempotente), atualiza `escalatedTo` se mudou.
- Resolver um ticket vinculado a Demanda **não** depende do status da Demanda: o relógio do **ticket** fecha com `resolvedAt` do ticket. (Dois conceitos de "resolvido": o do ticket fecha o SLA de atendimento; o da Demanda fecha a execução. Independentes.)
- Reabrir (resolved → open) → limpa `resolvedAt` (o relógio volta a correr). Auditado.
- Ticket sem `demandaId` é normal (dúvida resolvida sem virar trabalho) — não força Demanda.
- Resposta grande na listagem → paginar/limitar (reusar padrão de cap das outras rotas).
- Deletar a Demanda vinculada (`onDelete: SetNull` em `Ticket.demandaId`) → o ticket sobrevive com `demandaId=null` (histórico preservado).

## Data Contract
**Modelos Prisma novos** (seguindo convenções Defenz — cuid, createdAt/updatedAt, `@@index`, `@@map` snake_case, onDelete explícito):

```prisma
model Ticket {
  id           String    @id @default(cuid())
  subject      String
  description  String?
  status       String    @default("open")   // open | paused | resolved
  priority     String    @default("media")  // alta | media | baixa
  channel      String?                       // email | whatsapp | telefone | chat | outro
  requester    String?                       // solicitante (texto livre; espelha o padrão do campo Demanda.client)

  // --- escalonamento p/ Nível 2 EXTERNO ---
  escalatedAt  DateTime?                      // setado SÓ na ação de encaminhar; null = nunca foi ao N2
  escalatedTo  String?                        // parceiro destino (ex.: "SecuriSoft", "Bitdefender N2")

  // --- relógio (calendar time) ---
  firstReplyAt DateTime?                      // 1ª resposta de agente (kind='reply')
  resolvedAt   DateTime?                      // fecha o relógio do ticket

  // --- atribuição & multi-tenant ---
  assignedToId String?                        // FK User (agente responsável)
  assignedTo   User?     @relation("TicketAgent", fields: [assignedToId], references: [id], onDelete: SetNull)
  companyId    String                         // NOT NULL — tenant scope (companyScopeWhere)
  company      Company   @relation(fields: [companyId], references: [id])

  // --- vínculo 1:1 OPCIONAL com o Kanban ---
  demandaId    String?   @unique              // null = ticket sem execução vinculada
  demanda      Demanda?  @relation(fields: [demandaId], references: [id], onDelete: SetNull)

  createdById  String
  createdBy    User      @relation("TicketCreator", fields: [createdById], references: [id])
  messages     TicketMessage[]
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([companyId, status])
  @@index([companyId, createdAt])
  @@index([escalatedAt])
  @@index([assignedToId])
  @@index([demandaId])
  @@map("tickets")
}

model TicketMessage {
  id        String   @id @default(cuid())
  ticketId  String
  ticket    Ticket   @relation(fields: [ticketId], references: [id], onDelete: Cascade)
  kind      String   @default("reply")        // reply (conta como interação) | note (interna, não conta)
  authorId  String?
  author    User?    @relation(fields: [authorId], references: [id], onDelete: SetNull)
  body      String
  createdAt DateTime @default(now())

  @@index([ticketId, createdAt])
  @@map("ticket_messages")
}
```
(`Demanda` ganha o lado inverso `ticket Ticket?`; `User` ganha as relações inversas `TicketAgent`/`TicketCreator`/mensagens; `Company` ganha `tickets Ticket[]`.)

**Rotas (Zod em `src/lib/validations/ticket.ts`, `handleApiError`/`successResponse`/`ApiError`):**
- `GET/POST /api/tickets` — listar (scoped + filtros: status, escalado, agente, canal, período) / criar.
- `GET/PUT/DELETE /api/tickets/[id]` — detalhe / atualizar (status, escalonar, linkar demanda) / excluir.
- `POST /api/tickets/[id]/messages` — adicionar reply/note (grava `firstReplyAt` se for a 1ª reply de agente).
- `POST /api/tickets/[id]/escalate` — encaminhar ao N2 (`escalatedTo`), grava `escalatedAt` + AuditLog ESCALATE.
- `POST /api/tickets/[id]/link-demanda` — gerar ou linkar Demanda (valida `assertCompanyAccess`).
- `GET /api/service-desk/metrics` — as 4 agregações (cada uma um `prisma.aggregate`/`count` separado), já scoped por `companyScopeWhere`, com filtros de período/empresa; retorna JSON consumido pela página de relatório.

## Acceptance Criteria
- [x] CRUD de Ticket scoped por empresa (admin cruza; gerência/user só seu conjunto); sad path empresa fora do escopo → 403.
- [x] `TicketMessage` reply incrementa as interações (derivado por COUNT); `note` não conta.
- [x] Ação escalonar grava `escalatedAt` + `escalatedTo` + AuditLog; idempotente (não sobrescreve `escalatedAt`).
- [x] Linkar Demanda valida empresa (mesma company) — sad path cross-company → 403.
- [x] `GET /api/service-desk/metrics` retorna: volume (criados no período), backlog (status≠resolved), interações/ticket (média), tempo médio aberto/resolução (calendar time), % escalado (escalatedAt≠null/total) + breakdown por `escalatedTo`.
- [x] Página `/dashboard/service-desk` renderiza o board/lista de tickets + sub-relatório no estilo da aba Horas (Recharts), nav com role gating.
- [x] `npm run build && npx tsc --noEmit && npm test` verdes; testes proporcionais (1 happy + 1 sad por rota/função nova).
- [x] `db push` aplicado no Neon (tabelas `tickets`/`ticket_messages` criadas, aditivo) + **E2E autenticado 14/14** contra o Neon (criar→reply/note→escalar→vincular demanda→resolver→métricas→lista, com cleanup). Deploy Vercel **pendente** (decisão do Marcos).

## Implementação (2026-06-24)
Backend (TDD, mocks de prisma): schema `Ticket`+`TicketMessage` (`prisma/schema.prisma`); `src/lib/validations/ticket.ts`; service layer puro `src/lib/tickets-server.ts` (`computeTicketTimestamps` single-source + `computeServiceDeskMetrics`); rotas `GET/POST /api/tickets`, `GET/PUT/DELETE /api/tickets/[id]`, `POST .../messages`, `POST .../escalate`, `POST .../link-demanda`, `GET /api/service-desk/metrics`; `audit.ts` ganhou `action` ESCALATE/LINK. UI: nav (dropdown Service Desk), `/dashboard/service-desk` (lista+criar+seletor de empresa p/ admin), `TicketModal` (thread+ações), `/dashboard/service-desk/relatorio` (cards+Recharts). **40 testes novos (571 total)**, build+tsc verdes. **Schema NÃO aplicado no Neon ainda** (rotas falham até `db push`).

## Revisão adversarial (2026-06-24)
20 agentes (5 dimensões → verify), 13 achados confirmados, **todos endereçados** (commit "fix(service-desk): correcoes da revisao adversarial"):
- **2 HIGH segurança:** `assignedToId` cross-company (POST+PUT) — adicionado guard `db.user.findUnique` + `assertCompanyAccess` no responsável (espelha demandas), +2 testes sad path.
- **HIGH correção:** filtro de período das métricas migrado p/ **America/Sao_Paulo (−03:00)** (igual aba Horas; antes UTC mis-atribuía tickets da noite).
- **HIGH UX:** criar ticket pro admin multi-empresa (Marcos, sem empresa primária) falhava silencioso → `CompanySelector` no modal + `toast` de erro.
- **MED:** `TicketModal` mostra erro e só limpa input no sucesso; `GET /api/tickets` ganhou `take:500`; `capped` via sentinela (take CAP+1) + `orderBy` determinístico.
- **Decisão de coorte (métricas):** o relatório é **coorte por data de CRIAÇÃO** do ticket (rotulado na UI: "Tickets criados no período", fuso SP). `avgResolution`/% escalado são "dos tickets criados no período" — viés de borda conhecido e documentado (achados #5/#6 medium); refinamento (filtrar por `resolvedAt`/`escalatedAt`) fica p/ fase 2 se necessário.
- **LOW:** link-demanda 409 amigável; Logs ganham labels ESCALATE/LINK.

## Technical Decisions
- **Reuso real (verificado no código):** `companyScopeWhere`/`assertCompanyAccess` (`auth.ts`), `createAuditLog`/`diffChanges` (`audit.ts`), `handleApiError`/`successResponse` (`api-helpers.ts`), o **layout + Recharts** da aba `/dashboard/demandas/horas` (apenas o layout — a lógica de relatório é diferente: 4 agregações distintas, não um groupBy).
- **Relatório:** `GET /api/service-desk/metrics` faz 4 queries Prisma `aggregate`/`count`/`groupBy` separadas (volume, interações, tempo, escalado) — não reusa a lógica de `time-entries.ts` (que é groupBy+sum sobre uma tabela só), apenas o look-and-feel da página.
- **Schema aplicado no Neon** via `db push` (aditivo, ADR-008) no deploy — coordenar como nas features anteriores.

## Dependencies
- Reaproveita: multi-tenant (`auth.ts`), audit, design system + layout da aba Horas, `Demanda` (vínculo).
- **Não** reaproveita `logTimeDelta` (horas vivem na Demanda vinculada).
- Possível overlap com `Defenz_Chief` (suporte Bitdefender MSSP) — este Service Desk é o **atendimento interno da agência**, não o pipeline de relatório do Chief. Escopos distintos; alinhar antes de qualquer intake externo.

## Fora do MVP (fase 2 — YAGNI agora)
- Intake por e-mail (Resend → ticket) e portal público de abertura.
- Business hours / partição de relógio (descontar tempo pausado) + SLA policies.
- CSAT/satisfação, FCR, reopen rate, mediana de resolução (MVP = média/AVG).
- Contadores materializados (só se um relatório provar lento — não vai, no volume Defenz).
- Tool MCP `escalate_ticket`/`create_ticket` (Bearer).
- `escalatedTo` como tabela de parceiros (no MVP é string livre/enum).
