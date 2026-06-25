# Service Desk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans (inline) ou subagent-driven-development. Steps usam checkbox (`- [ ]`).

**Goal:** Menu Service Desk para abrir/triar/medir tickets de atendimento, com vínculo 1:1 opcional ao Kanban de Demandas, escopado por empresa, e relatório com as 5 métricas do Marcos (volume, interações, tempo aberto, % escalado p/ N2 externo).

**Architecture:** `Ticket` é entidade própria (Opção B enxuta) + `TicketMessage` (interações; reply conta, note não). N2 = parceiro EXTERNO (`escalatedAt`+`escalatedTo`). 3 estados (open/paused/resolved). Timestamps de relógio gravados num único service-layer. Métricas = 4 agregações Prisma diretas. Horas vivem na Demanda vinculada (NÃO reusa `logTimeDelta`). Reusa `companyScopeWhere`/`assertCompanyAccess`/`createAuditLog`/`handleApiError` e o layout/Recharts da aba Horas.

**Tech Stack:** Next 16 App Router, Prisma 6 + Postgres (Neon), Zod, NextAuth (resolveActor Bearer/sessão), Vitest, Recharts.

**Spec:** `docs/features/feature-service-desk.md`. **DB único dev=prod (ADR-008): `db push` só no deploy; testes usam mock de prisma.**

---

## File Structure
- `prisma/schema.prisma` — +`Ticket`, +`TicketMessage`, inverse rels em User/Company/Demanda.
- `src/lib/audit.ts` — estender union `action` p/ `ESCALATE`|`LINK`.
- `src/lib/validations/ticket.ts` — schemas Zod (create/update/message/escalate/link/metrics-query).
- `src/lib/tickets-server.ts` — service layer puro: transições de status + timestamps + métricas.
- `src/app/api/tickets/route.ts` — GET (lista scoped+filtros) / POST (cria).
- `src/app/api/tickets/[id]/route.ts` — GET / PUT (update+transição) / DELETE.
- `src/app/api/tickets/[id]/messages/route.ts` — POST (reply/note; 1ª reply → firstReplyAt).
- `src/app/api/tickets/[id]/escalate/route.ts` — POST (escalatedAt idempotente + escalatedTo + AuditLog ESCALATE).
- `src/app/api/tickets/[id]/link-demanda/route.ts` — POST (cria/linka Demanda; assertCompanyAccess).
- `src/app/api/service-desk/metrics/route.ts` — GET (4 agregações scoped).
- `src/app/dashboard/service-desk/page.tsx` — lista/board de tickets + criar.
- `src/app/dashboard/service-desk/relatorio/page.tsx` — relatório (estilo aba Horas).
- `src/app/dashboard/layout.tsx` — item de nav (role gating).
- Testes em `__tests__/` ao lado de cada um.

---

## Task 1: Schema Prisma (Ticket + TicketMessage)

**Files:** Modify `prisma/schema.prisma`.

- [ ] **Step 1:** Adicionar os 2 models (no fim do arquivo, antes/depois de TimeEntry) e as relações inversas:

```prisma
model Ticket {
  id           String    @id @default(cuid())
  subject      String
  description  String?
  status       String    @default("open")   // open | paused | resolved
  priority     String    @default("media")  // alta | media | baixa
  channel      String?                       // email | whatsapp | telefone | chat | outro
  requester    String?

  escalatedAt  DateTime?
  escalatedTo  String?

  firstReplyAt DateTime?
  resolvedAt   DateTime?

  assignedToId String?
  assignedTo   User?     @relation("TicketAgent", fields: [assignedToId], references: [id], onDelete: SetNull)
  companyId    String
  company      Company   @relation(fields: [companyId], references: [id])

  demandaId    String?   @unique
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
  kind      String   @default("reply")        // reply | note
  authorId  String?
  author    User?    @relation("TicketMessageAuthor", fields: [authorId], references: [id], onDelete: SetNull)
  body      String
  createdAt DateTime @default(now())

  @@index([ticketId, createdAt])
  @@map("ticket_messages")
}
```
E adicionar nas relações inversas:
- `User`: `ticketsAsAgent Ticket[] @relation("TicketAgent")`, `ticketsCreated Ticket[] @relation("TicketCreator")`, `ticketMessages TicketMessage[] @relation("TicketMessageAuthor")`.
- `Company`: `tickets Ticket[]`.
- `Demanda`: `ticket Ticket?` (lado inverso do `demandaId @unique`).

- [ ] **Step 2:** `npx prisma validate` → Expected: "The schema ... is valid 🚀".
- [ ] **Step 3:** `npx prisma generate` → Expected: client gerado (tipos Ticket/TicketMessage disponíveis). **NÃO** rodar `db push` agora (fica para o deploy; testes usam mock).
- [ ] **Step 4:** `npx tsc --noEmit` → Expected: sem erros novos.
- [ ] **Step 5:** Commit: `git add prisma/schema.prisma && git commit -m "feat(service-desk): schema Ticket + TicketMessage"`.

---

## Task 2: AuditLog action union (ESCALATE/LINK)

**Files:** Modify `src/lib/audit.ts`.

- [ ] **Step 1:** Estender a union (linha ~4): `action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'ESCALATE' | 'LINK'`.
- [ ] **Step 2:** `npx tsc --noEmit` → Expected: sem erros.
- [ ] **Step 3:** Commit: `git commit -am "feat(audit): permite action ESCALATE/LINK (coluna ja e String)"`.

---

## Task 3: Validações Zod (`src/lib/validations/ticket.ts`)

**Files:** Create `src/lib/validations/ticket.ts`, Test `src/lib/validations/__tests__/ticket.test.ts`.

- [ ] **Step 1 (RED):** Escrever testes:

```ts
import { describe, it, expect } from 'vitest'
import { createTicketSchema, escalateTicketSchema, createTicketMessageSchema } from '../ticket'

describe('createTicketSchema', () => {
  it('aceita um ticket válido com defaults', () => {
    const r = createTicketSchema.parse({ subject: 'Acesso BM' })
    expect(r.subject).toBe('Acesso BM')
    expect(r.priority).toBe('media')
  })
  it('rejeita subject vazio', () => {
    expect(() => createTicketSchema.parse({ subject: '' })).toThrow()
  })
})

describe('escalateTicketSchema', () => {
  it('exige escalatedTo não-vazio', () => {
    expect(() => escalateTicketSchema.parse({ escalatedTo: '' })).toThrow()
    expect(escalateTicketSchema.parse({ escalatedTo: 'SecuriSoft' }).escalatedTo).toBe('SecuriSoft')
  })
})

describe('createTicketMessageSchema', () => {
  it('default kind=reply; rejeita body vazio', () => {
    expect(createTicketMessageSchema.parse({ body: 'oi' }).kind).toBe('reply')
    expect(() => createTicketMessageSchema.parse({ body: '' })).toThrow()
  })
})
```

- [ ] **Step 2:** `npx vitest run src/lib/validations/__tests__/ticket.test.ts` → Expected: FAIL (módulo não existe).
- [ ] **Step 3 (GREEN):** Implementar:

```ts
import { z } from 'zod'

export const TICKET_STATUS = ['open', 'paused', 'resolved'] as const
export const TICKET_CHANNELS = ['email', 'whatsapp', 'telefone', 'chat', 'outro'] as const
const priorityEnum = z.enum(['alta', 'media', 'baixa'])

export const createTicketSchema = z.object({
  subject: z.string().min(1, 'Assunto obrigatório').max(200),
  description: z.string().max(5000).optional(),
  companyId: z.string().optional(),
  requester: z.string().max(200).optional(),
  channel: z.enum(TICKET_CHANNELS).optional(),
  priority: priorityEnum.default('media'),
  assignedToId: z.string().nullable().optional(),
})

export const updateTicketSchema = z.object({
  subject: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).nullable().optional(),
  status: z.enum(TICKET_STATUS).optional(),
  priority: priorityEnum.optional(),
  channel: z.enum(TICKET_CHANNELS).nullable().optional(),
  requester: z.string().max(200).nullable().optional(),
  assignedToId: z.string().nullable().optional(),
})

export const createTicketMessageSchema = z.object({
  body: z.string().min(1, 'Mensagem obrigatória').max(10000),
  kind: z.enum(['reply', 'note']).default('reply'),
})

export const escalateTicketSchema = z.object({
  escalatedTo: z.string().min(1, 'Informe o destino (parceiro/N2)').max(120),
})

export const linkDemandaSchema = z.object({
  demandaId: z.string().min(1),   // linka uma Demanda existente
})

export const metricsQuerySchema = z.object({
  from: z.string().optional(),    // YYYY-MM-DD
  to: z.string().optional(),
  companyId: z.string().optional(),
})
```

- [ ] **Step 4:** `npx vitest run src/lib/validations/__tests__/ticket.test.ts` → Expected: PASS.
- [ ] **Step 5:** Commit: `git add src/lib/validations/ticket.ts src/lib/validations/__tests__/ticket.test.ts && git commit -m "feat(service-desk): validacoes Zod de ticket"`.

---

## Task 4: Service layer puro (`src/lib/tickets-server.ts`)

**Files:** Create `src/lib/tickets-server.ts`, Test `src/lib/__tests__/tickets-server.test.ts`.

Responsabilidade: dado o estado atual + a mudança, calcular os timestamps de relógio (single source). Puro/testável, sem DB.

- [ ] **Step 1 (RED):** Testes:

```ts
import { describe, it, expect } from 'vitest'
import { computeTicketTimestamps, computeServiceDeskMetrics } from '../tickets-server'

const NOW = new Date('2026-06-24T12:00:00Z')

describe('computeTicketTimestamps', () => {
  it('seta resolvedAt ao ir para resolved', () => {
    const r = computeTicketTimestamps({ status: 'open', resolvedAt: null }, { status: 'resolved' }, NOW)
    expect(r.resolvedAt).toEqual(NOW)
  })
  it('limpa resolvedAt ao reabrir (resolved -> open)', () => {
    const r = computeTicketTimestamps({ status: 'resolved', resolvedAt: NOW }, { status: 'open' }, NOW)
    expect(r.resolvedAt).toBeNull()
  })
  it('não toca resolvedAt em mudança que não envolve resolved', () => {
    const r = computeTicketTimestamps({ status: 'open', resolvedAt: null }, { status: 'paused' }, NOW)
    expect(r).not.toHaveProperty('resolvedAt')
  })
})

describe('computeServiceDeskMetrics', () => {
  it('calcula volume, backlog, média de interações, tempo médio e % escalado', () => {
    const tickets = [
      { id: 't1', status: 'resolved', createdAt: new Date('2026-06-20T10:00:00Z'), resolvedAt: new Date('2026-06-20T12:00:00Z'), escalatedAt: new Date(), escalatedTo: 'SecuriSoft', replyCount: 3 },
      { id: 't2', status: 'open', createdAt: new Date('2026-06-22T10:00:00Z'), resolvedAt: null, escalatedAt: null, escalatedTo: null, replyCount: 1 },
    ]
    const m = computeServiceDeskMetrics(tickets, NOW)
    expect(m.total).toBe(2)
    expect(m.backlog).toBe(1)               // t2 não resolvido
    expect(m.escalatedCount).toBe(1)        // t1
    expect(m.escalatedPct).toBeCloseTo(50)
    expect(m.avgRepliesPerTicket).toBeCloseTo(2)   // (3+1)/2
    expect(m.escalatedByPartner).toEqual([{ partner: 'SecuriSoft', count: 1 }])
    expect(m.avgResolutionMinutes).toBeCloseTo(120) // t1: 2h
  })
})
```

- [ ] **Step 2:** Run → Expected: FAIL.
- [ ] **Step 3 (GREEN):** Implementar:

```ts
type TicketState = { status: string; resolvedAt: Date | null }
type TicketPatch = { status?: string }

/** Calcula os timestamps derivados de uma transição de status (single source of truth). */
export function computeTicketTimestamps(
  current: TicketState,
  patch: TicketPatch,
  now: Date
): { resolvedAt?: Date | null } {
  if (patch.status === undefined || patch.status === current.status) return {}
  if (patch.status === 'resolved') return { resolvedAt: now }
  if (current.status === 'resolved') return { resolvedAt: null } // reabriu
  return {}
}

export type MetricTicket = {
  id: string
  status: string
  createdAt: Date
  resolvedAt: Date | null
  escalatedAt: Date | null
  escalatedTo: string | null
  replyCount: number
}

export function computeServiceDeskMetrics(tickets: MetricTicket[], now: Date) {
  const total = tickets.length
  const backlog = tickets.filter((t) => t.status !== 'resolved').length
  const escalated = tickets.filter((t) => t.escalatedAt !== null)
  const escalatedCount = escalated.length
  const totalReplies = tickets.reduce((s, t) => s + (t.replyCount ?? 0), 0)

  const resolved = tickets.filter((t) => t.resolvedAt !== null)
  const avgResolutionMinutes = resolved.length
    ? resolved.reduce((s, t) => s + (t.resolvedAt!.getTime() - t.createdAt.getTime()), 0) / resolved.length / 60000
    : 0
  const open = tickets.filter((t) => t.status !== 'resolved')
  const avgOpenAgeMinutes = open.length
    ? open.reduce((s, t) => s + (now.getTime() - t.createdAt.getTime()), 0) / open.length / 60000
    : 0

  const byPartnerMap = new Map<string, number>()
  for (const t of escalated) {
    const k = t.escalatedTo ?? '(não informado)'
    byPartnerMap.set(k, (byPartnerMap.get(k) ?? 0) + 1)
  }
  const escalatedByPartner = [...byPartnerMap.entries()]
    .map(([partner, count]) => ({ partner, count }))
    .sort((a, b) => b.count - a.count)

  return {
    total,
    backlog,
    escalatedCount,
    escalatedPct: total ? (escalatedCount / total) * 100 : 0,
    avgRepliesPerTicket: total ? totalReplies / total : 0,
    avgResolutionMinutes,
    avgOpenAgeMinutes,
    escalatedByPartner,
  }
}
```

- [ ] **Step 4:** Run → Expected: PASS.
- [ ] **Step 5:** Commit: `git commit -m "feat(service-desk): service layer (timestamps + metricas)"`.

---

## Task 5: `GET/POST /api/tickets`

**Files:** Create `src/app/api/tickets/route.ts`, Test `src/app/api/tickets/__tests__/route.test.ts`.
Padrão: espelhar `src/app/api/demandas/route.ts` (resolveActor, companyScopeWhere, resolveActiveCompany, createAuditLog, handleApiError). Mock de prisma em `src/test/mocks/prisma`.

- [ ] **Step 1 (RED):** Testes (happy: admin cria/lista; sad: gerência cria fora do escopo → 403). Usar os mocks de prisma/auth do projeto (`src/test/mocks/`).
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3 (GREEN):** Implementar:
  - **GET:** `user = await resolveActor(req)`. `where = { ...companyScopeWhere(user), ...filtros(status, escalated=escalatedAt not null, assignedToId, channel, período createdAt) }`. `db.ticket.findMany({ where, include: { _count: { select: { messages: { where: { kind: 'reply' } } } }, assignedTo: { select: { name } } }, orderBy: { createdAt: 'desc' } })`. `successResponse`.
  - **POST:** `data = createTicketSchema.parse(body)`; `companyId = resolveActiveCompany(user, data.companyId)`; se null → ApiError 400; `db.ticket.create({ data: { ...data, companyId, createdById: user.id } })`; `createAuditLog(CREATE, 'Ticket', ...)`; `createdResponse`.
- [ ] **Step 4:** Run → PASS. Rodar `npm test` (suite cheia) → sem regressão.
- [ ] **Step 5:** Commit: `git commit -m "feat(service-desk): GET/POST /api/tickets (scoped)"`.

---

## Task 6: `GET/PUT/DELETE /api/tickets/[id]`

**Files:** Create `src/app/api/tickets/[id]/route.ts`, Test ao lado.
Padrão: espelhar `src/app/api/demandas/[id]/subtasks/[subtaskId]/route.ts` (params Promise, assertCompanyAccess).

- [ ] **Step 1 (RED):** Testes: GET detalhe; PUT muda status→resolved seta resolvedAt (via `computeTicketTimestamps`); sad PUT empresa errada → 403; DELETE.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3 (GREEN):**
  - GET: `findUnique({ where:{id}, include:{ messages:{orderBy:{createdAt:'asc'}}, assignedTo, demanda:{select:{id,title,status}} } })`; 404 se null; `assertCompanyAccess(ticket.companyId, user)`.
  - PUT: parse `updateTicketSchema`; carregar existing; `assertCompanyAccess`; `ts = computeTicketTimestamps(existing, data, new Date())`; `firstReplyAt` NÃO entra aqui (é nas mensagens); `update({ data: { ...data, ...ts } })`; `createAuditLog(UPDATE, diffChanges)`.
  - DELETE: carregar, assertCompanyAccess, delete (cascade messages), audit DELETE.
- [ ] **Step 4:** PASS + suite.
- [ ] **Step 5:** Commit.

---

## Task 7: `POST /api/tickets/[id]/messages`

**Files:** Create `src/app/api/tickets/[id]/messages/route.ts`, Test ao lado.

- [ ] **Step 1 (RED):** Testes: cria reply; se for a 1ª reply de agente e `firstReplyAt` nulo → seta firstReplyAt; note não seta.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3 (GREEN):** carregar ticket (assertCompanyAccess); `data = createTicketMessageSchema.parse(body)`; criar message; se `data.kind==='reply'` e `ticket.firstReplyAt==null` → `update({firstReplyAt:new Date()})`; audit CREATE 'TicketMessage'.
- [ ] **Step 4:** PASS + suite.
- [ ] **Step 5:** Commit.

---

## Task 8: `POST /api/tickets/[id]/escalate`

**Files:** Create `src/app/api/tickets/[id]/escalate/route.ts`, Test ao lado.

- [ ] **Step 1 (RED):** Testes: escala (seta escalatedAt+escalatedTo, AuditLog ESCALATE); re-escalar mantém escalatedAt (idempotente), atualiza escalatedTo.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3 (GREEN):** carregar (assertCompanyAccess); `{escalatedTo}=escalateTicketSchema.parse(body)`; `escalatedAt = existing.escalatedAt ?? new Date()`; `update({escalatedAt, escalatedTo})`; `createAuditLog({action:'ESCALATE', entityType:'Ticket', changes:{escalatedTo:{from:existing.escalatedTo,to:escalatedTo}}})`.
- [ ] **Step 4:** PASS + suite.
- [ ] **Step 5:** Commit.

---

## Task 9: `POST /api/tickets/[id]/link-demanda`

**Files:** Create `src/app/api/tickets/[id]/link-demanda/route.ts`, Test ao lado.

- [ ] **Step 1 (RED):** Testes: linka demanda da mesma empresa (seta demandaId); sad: demanda de outra empresa → 403 (assertCompanyAccess na demanda).
- [ ] **Step 2:** FAIL.
- [ ] **Step 3 (GREEN):** carregar ticket (assertCompanyAccess do ticket); `{demandaId}=linkDemandaSchema.parse(body)`; carregar demanda; 404 se null; `assertCompanyAccess(demanda.companyId, user)`; `update ticket {demandaId}`; audit LINK.
- [ ] **Step 4:** PASS + suite.
- [ ] **Step 5:** Commit.

---

## Task 10: `GET /api/service-desk/metrics`

**Files:** Create `src/app/api/service-desk/metrics/route.ts`, Test ao lado.

- [ ] **Step 1 (RED):** Teste: admin recebe as métricas agregadas; scoped (gerência só sua empresa). Mock retorna tickets + reply counts.
- [ ] **Step 2:** FAIL.
- [ ] **Step 3 (GREEN):** `user=resolveActor`; parse query; `where={...companyScopeWhere(user), ...período opcional}`; `tickets = db.ticket.findMany({ where, select:{id,status,createdAt,resolvedAt,escalatedAt,escalatedTo,_count:{select:{messages:{where:{kind:'reply'}}}}} })`; mapear p/ `MetricTicket` (`replyCount = t._count.messages`); `computeServiceDeskMetrics(mapped, new Date())`; cap defensivo (ex.: 5000). `successResponse`.
- [ ] **Step 4:** PASS + suite.
- [ ] **Step 5:** Commit.

---

## Task 11: UI — nav + página de tickets + relatório

**Files:** Modify `src/app/dashboard/layout.tsx` (nav); Create `src/app/dashboard/service-desk/page.tsx`, `src/app/dashboard/service-desk/relatorio/page.tsx`; componentes em `src/components/service-desk/`.

Quebrar em sub-tarefas (cada uma render-test proporcional + commit):
- [ ] **11a:** Nav: item "Service Desk" em `layout.tsx` (espelhar o bloco da aba Horas; lista visível a todos; sub-link Relatório admin/gerência). Render test.
- [ ] **11b:** `service-desk/page.tsx`: lista de tickets (fetch `/api/tickets`), badges de status/escalado, botão "Novo ticket" (modal), filtros. Reusar componentes shadcn já no projeto.
- [ ] **11c:** Modal de ticket (criar/detalhe): campos do create + thread de mensagens (reply/note) + ações escalonar / linkar demanda / resolver.
- [ ] **11d:** `service-desk/relatorio/page.tsx`: consome `/api/service-desk/metrics`; cards (volume, backlog, % escalado, tempo médio, interações/ticket) + Recharts (volume no tempo, escalado por parceiro) — **reusar o layout/estética da aba `/dashboard/demandas/horas`**.
- [ ] **11e:** Commit por sub-tarefa.

---

## Task 12: Gate final + docs
- [ ] `npm run build && npx tsc --noEmit && npm test` → tudo verde.
- [ ] Atualizar `docs/features/feature-service-desk.md` (status → Done), `docs/CHANGELOG.md`, `docs/PROGRESS.md`.
- [ ] **Deploy (separado, com confirmação):** `prisma db push` no Neon (aditivo) + push Vercel.
- [ ] Commit final.

---

## Self-review (cobertura do spec)
- Volume/backlog → Task 10 (computeServiceDeskMetrics.total/backlog). ✓
- Interações/ticket → Task 7 (TicketMessage) + Task 10 (avgRepliesPerTicket via _count reply). ✓
- Tempo aberto → Task 4/10 (avgResolutionMinutes + avgOpenAgeMinutes, calendar time). ✓
- % escalado p/ N2 → Task 8 (escalatedAt) + Task 10 (escalatedPct + escalatedByPartner). ✓
- Relatórios → Task 10 + Task 11d (página estilo Horas). ✓
- Multi-tenant (companyScopeWhere/assertCompanyAccess) → Tasks 5–10. ✓
- Link Ticket↔Demanda valida empresa → Task 9. ✓
- Audit (CREATE/UPDATE/DELETE/ESCALATE/LINK) → Tasks 2,5–9. ✓
- Timestamps single-source → Task 4/6. ✓
- Sem contador materializado (COUNT reply) → Task 5/10. ✓
- Horas não reusam logTimeDelta → vivem na Demanda (Task 9 link). ✓
