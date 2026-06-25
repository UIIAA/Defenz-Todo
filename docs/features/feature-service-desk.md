# Feature: Menu "Service Desk" (tickets) — integrado ao Kanban Defenz
**Status:** Approved (design) — pendente implementação
**Priority:** P2
**Date:** 2026-06-24 (design fechado após brainstorming + pesquisa multi-agente de 6 ferramentas renomadas)

> Histórico do brainstorming, opções A/B/C cruas e a pesquisa completa: ver `docs/PROGRESS.md` (sessão 2026-06-24) e a memória `project_session_2026_06_24`. Este doc é o design **fechado**.

## Objective
Uma ferramenta de **Service Desk** própria da Defenz para abrir/triar/resolver **tickets** de atendimento, medir o fluxo (volume, interações, tempo aberto, escalonamento) e **vincular ao Kanban de Demandas** quando o ticket vira trabalho de execução — sem duplicar o trabalho nem poluir o board.

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
- [ ] CRUD de Ticket scoped por empresa (admin cruza; gerência/user só seu conjunto); sad path empresa fora do escopo → 403.
- [ ] `TicketMessage` reply incrementa as interações (derivado por COUNT); `note` não conta.
- [ ] Ação escalonar grava `escalatedAt` + `escalatedTo` + AuditLog; idempotente (não sobrescreve `escalatedAt`).
- [ ] Linkar Demanda valida empresa (mesma company) — sad path cross-company → 403.
- [ ] `GET /api/service-desk/metrics` retorna: volume (criados no período), backlog (status≠resolved), interações/ticket (média), tempo médio aberto/resolução (calendar time), % escalado (escalatedAt≠null/total) + breakdown por `escalatedTo`.
- [ ] Página `/dashboard/service-desk` renderiza o board/lista de tickets + sub-relatório no estilo da aba Horas (Recharts), nav com role gating.
- [ ] `npm run build && npx tsc --noEmit && npm test` verdes; testes proporcionais (1 happy + 1 sad por rota/função nova).

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
