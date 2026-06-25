# Feature: Menu "Playbooks / Manuais Defenz"
**Status:** Approved (design) — pendente implementação (implementar DEPOIS do Service Desk)
**Priority:** P2
**Date:** 2026-06-24 (design fechado após brainstorming + pesquisa multi-agente de Confluence/Notion/Guru/Tettra/Slab/GitBook/Document360/Zendesk Guide)

> Histórico do brainstorming + pesquisa completa: `docs/PROGRESS.md` (sessão 2026-06-24) e memória `project_session_2026_06_24`.

## Objective
Menu de **base de conhecimento interna** para **consulta rápida** da equipe: procedimentos, runbooks, guias (ex.: acesso ao Business Manager da Sheila, onboarding de cliente, esteira de habilitação Meta). Hoje esses materiais ficam espalhados (Drive, PDFs, skills) — este menu centraliza, deixa **buscável e legível** dentro do To-Do, e — o diferencial — **mantém o conteúdo confiável** com um sinal de frescor (dono + verificado + "precisa revisão").

## Insight central (da pesquisa)
O diferencial de uma KB confiável **não é o editor — é o FRESCOR**. Guru/Tettra/Slab/Zendesk convergem no mesmo padrão: `owner → verificar → TTL → des-verifica → notifica → rebaixa na busca`. Isso cabe em ~5 campos no model. Tudo o mais (engine de blocos, versionamento git, editor colaborativo realtime, multi-idioma, rollups) é **YAGNI** para uma agência enxuta.

## Decisões fechadas (brainstorming 2026-06-24)
1. **Conteúdo = Markdown editável no app** (não upload de PDF). Buscável, editável inline, render **sanitizado**. Os PDFs atuais migram pra markdown aos poucos. (Anexo como LINK pro Drive fica pra fase 2.)
2. **Busca full-text Postgres no MVP** (`to_tsvector` sobre `title+body` + índice GIN). Sem busca no corpo, a equipe não acha o procedimento e volta pro Drive — fere o objetivo central. Resolve também o payload do Cmd+K (busca server-side, retorna só id/título/snippet/frescor).
3. **2 models** (não 4): `Playbook` + `PlaybookCategory`. Tags como `String[]` nativo do Postgres (corta `Tag` + `PlaybookTag`). `isArchived` boolean (não 3 estados de publicação). `isStale` **derivado** de `reviewDueAt` (não persiste `verificationStatus`).
4. **`companyId` NULLABLE:** `null` = playbook **GLOBAL Defenz** (visível a todos); setado = por-empresa/cliente (scope igual Demanda). Via helper **NOVO** `playbookScopeWhere` (NÃO estender `companyScopeWhere`, que retorna cláusula única e quebraria os callers de Demanda).
5. **Sanitização obrigatória** (XSS stored é vetor cross-tenant). Usar `isomorphic-dompurify` (já no `package.json`) + `rehype-sanitize`, e desabilitar HTML cru no `react-markdown`.

## Behavior
1. **Criar/editar playbook:** admin/gerência escreve `title` + `body` (markdown) + `categoryId?` + `tags[]` + `ownerId`. Render com `react-markdown`/`remark-gfm` **sanitizado**.
2. **Verificar:** o `owner` clica "Verificar" → grava `verifiedAt=now`, `verifiedById`, `reviewDueAt = now + reviewIntervalDays`, **reseta `reviewReminderSent=false`**. Badge **VERIFICADO** (verde).
3. **Staleness (frescor):** o estado "precisa revisão" é **DERIVADO** em runtime (`reviewDueAt != null && reviewDueAt < now`), não um campo persistido — o badge **PRECISA REVISÃO** (âmbar) aparece automático e o item cai na ordenação da busca. O cron diário (`/api/cron/reminders`, passo isolado em try/catch) é só o **gatilho de notificação**: encontra `reviewDueAt <= hoje AND reviewReminderSent=false`, emaila o `owner` (Resend) e seta `reviewReminderSent=true` (evita reenvio até re-verificar). Não grava status.
4. **Editou-sem-ser-dono → precisa revisão:** no PUT, se quem edita ≠ `ownerId`, **zera `verifiedAt`** (o badge VERIFICADO não pode mentir). Um `if` no handler.
5. **Consultar (o caso principal):** rota `/dashboard/playbooks` mostra árvore de categorias + busca; Cmd+K ganha grupo "Playbooks" (busca server-side leve). Abrir `/dashboard/playbooks/[id]` renderiza o markdown com, **no topo**, "Verificado por X em DD/MM" ou "Precisa revisão — última verificação há N dias".

## Business Rules
- **Multi-tenant com global:** `playbookScopeWhere(user)` = `{ OR: [ companyScopeWhere(user), { companyId: null } ] }`. Usuário vê os globais (`null`) **+** os da(s) sua(s) empresa(s); **nunca** os de outra empresa.
- **Permissão (default):** **só admin** cria/edita playbooks **globais** (`companyId=null`); gerência cria/edita os da própria empresa; `user` só lê (escopo + globais). Toda mutação grava `AuditLog` (`entityType='Playbook'`).
- **Frescor determinístico:** gatilhos no MVP = (a) tempo (`reviewDueAt<=hoje` no cron) e (b) editou-sem-ser-dono. `reviewIntervalDays=null` → nunca expira (evergreen).
- **Re-verificar reseta `reviewReminderSent=false` + `reviewDueAt`** (senão o 2º ciclo de staleness nunca reavisa — bug latente identificado na pesquisa contra `reminders/route.ts:88`).
- **Sanitização** do `body` no render é critério de aceite, não opcional.

## Edge Cases
- Playbook nunca verificado (`verifiedAt=null`) → sem badge (estado "none" derivado), não conta como stale.
- `reviewIntervalDays=null` (evergreen) → `reviewDueAt=null` → nunca vira stale, nunca emaila.
- Deletar Company com playbooks por-empresa: `onDelete` — **decisão**: usar `Restrict`/arquivar em vez de `Cascade` para não destruir runbooks do cliente ao arquivar a empresa (a confirmar na impl; default conservador = não cascatear).
- Markdown com `<script>`/`javascript:`/`onerror` → neutralizado pela sanitização (teste de XSS dedicado).
- Busca sem resultado → mensagem amigável (e, fase 2, logar o termo como knowledge gap).
- Tenant isolation: teste sad path explícito — usuário de A vê globais + A, **nunca** B.

## Data Contract
**Modelos Prisma novos** (convenções Defenz):

```prisma
model Playbook {
  id           String    @id @default(cuid())
  title        String
  body         String                          // markdown (sanitizado no render)
  isArchived   Boolean   @default(false)
  tags         String[]  @default([])          // nativo Postgres (dual-filing: cliente E canal/tema)

  // --- multi-tenant: null = GLOBAL Defenz; setado = por-empresa ---
  companyId    String?
  company      Company?  @relation(fields: [companyId], references: [id], onDelete: Restrict)
  categoryId   String?
  category     PlaybookCategory? @relation(fields: [categoryId], references: [id], onDelete: SetNull)

  // --- FRESCOR (o diferencial) ---
  ownerId            String?
  owner              User?     @relation("PlaybookOwner", fields: [ownerId], references: [id], onDelete: SetNull)
  verifiedAt         DateTime?
  verifiedById       String?
  verifiedBy         User?     @relation("PlaybookVerifier", fields: [verifiedById], references: [id], onDelete: SetNull)
  reviewIntervalDays Int?                       // null = evergreen; default 90 na criação
  reviewDueAt        DateTime?                  // = verifiedAt + reviewIntervalDays (motor do staleness)
  reviewReminderSent Boolean   @default(false)

  createdById  String
  createdBy    User      @relation("PlaybookCreator", fields: [createdById], references: [id])
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([companyId, isArchived])
  @@index([categoryId])
  @@index([ownerId])
  @@index([reviewDueAt, reviewReminderSent])    // query do cron de frescor
  @@map("playbooks")
}

model PlaybookCategory {
  id        String   @id @default(cuid())
  name      String
  parentId  String?                              // adjacency-list (árvore N-níveis, barata)
  parent    PlaybookCategory?  @relation("PlaybookCatTree", fields: [parentId], references: [id], onDelete: SetNull)
  children  PlaybookCategory[] @relation("PlaybookCatTree")
  companyId String?                              // null = global; setado = por-empresa
  company   Company? @relation(fields: [companyId], references: [id], onDelete: Restrict)
  playbooks Playbook[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([companyId])
  @@index([parentId])
  @@map("playbook_categories")
}
```
Índice **full-text GIN** sobre `to_tsvector('portuguese', title || ' ' || body)` aplicado por SQL na migration (Prisma não expressa tsvector nativamente — `db execute`/migration raw).

**Rotas (Zod em `src/lib/validations/playbook.ts`):**
- `GET/POST /api/playbooks` — listar (scoped via `playbookScopeWhere` + filtros categoria/tag/arquivado) / criar.
- `GET/PUT/DELETE /api/playbooks/[id]` — ler / editar (com regra editou-sem-ser-dono) / arquivar/excluir.
- `POST /api/playbooks/[id]/verify` — verificar/re-verificar (reseta relógio + reviewReminderSent).
- `GET /api/playbooks/search?q=` — busca full-text server-side, retorna payload **leve** (id/title/snippet/frescor/categoria) p/ Cmd+K e página.
- `GET/POST /api/playbook-categories` — gerir a árvore.

## Acceptance Criteria
- [ ] CRUD de Playbook com `playbookScopeWhere`: usuário vê globais + sua empresa, **nunca** outra (sad path testado).
- [ ] Render markdown **sanitizado** (teste de XSS: `<script>`/`javascript:` neutralizados).
- [ ] Busca full-text retorna por termo no **corpo** (não só título); payload leve.
- [ ] Verificar grava `verifiedAt/verifiedById/reviewDueAt` e reseta `reviewReminderSent`; badge muda.
- [ ] Cron marca stale (`reviewDueAt<=hoje`) e emaila o owner; ciclo completo verify→stale→email→re-verify→stale→email(2ª vez) funciona (teste do reset).
- [ ] Editar sendo ≠ owner zera `verifiedAt` (badge não mente).
- [ ] Cmd+K mostra grupo Playbooks com badge de frescor; abrir `/playbooks/[id]` mostra status de verificação no topo.
- [ ] Permissão: só admin edita globais; gerência só a própria empresa; user só lê. Nav com role gating.
- [ ] `npm run build && npx tsc --noEmit && npm test` verdes; testes proporcionais.

## Technical Decisions
- **Reuso verificado:** `assertCompanyAccess` (tenant), `createAuditLog`/`diffChanges`, `sendEmailWithChecks` (Resend), `isomorphic-dompurify`/`dompurify` (já instalados), o cron `/api/cron/reminders` (passo isolado em try/catch p/ não derrubar os lembretes de Demanda).
- **NÃO reusar `companyScopeWhere` diretamente** (cláusula única) — criar `playbookScopeWhere` que compõe `{OR:[...]}`. Não tocar o helper compartilhado (risco de regressão em Demanda).
- **Markdown render é wiring novo** (as deps existem mas têm zero uso em `src/`): componente `<PlaybookMarkdown>` com `react-markdown` + `remark-gfm` + `rehype-sanitize`, HTML cru desabilitado.
- Schema aplicado no Neon via `db push` + migration raw para o índice GIN.

## Defaults a confirmar na revisão da spec (decisões menores)
- Intervalo de verificação default = **90 dias** + toggle "evergreen (nunca expira)".
- Verificador = **User** individual no MVP (Team/Group fica fase 2).
- Quem edita globais = **só admin** (gerência só a própria empresa).
- `onDelete` da Company nos playbooks = **Restrict** (não destruir runbooks ao arquivar empresa).

## Dependencies
- Independente do Kanban. Vínculo `Playbook↔Demanda` (N:N, chip clicável no modal) = **fase 2**.

## Fora do MVP (fase 2)
- Vínculo Playbook↔Demanda; anexos como link (Drive/PDF); versionamento com diff/restore (MVP cobre via `AuditLog.changes`); log de buscas-sem-resultado; templates instanciáveis; trust score por categoria; respostas com IA sobre a KB (pipeline Gemini); verifier = Team; tool MCP de playbooks; permissão granular por playbook.
