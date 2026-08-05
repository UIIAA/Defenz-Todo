# Feature: Service Desk — Portal público de abertura de ticket
**Status:** **IMPLEMENTADO + POLIDO em local (2026-06-28)** — página `/abrir-ticket` + endpoint `POST /api/public/tickets` + `AuthorizedClient`/`TicketSequence` + usuário-sistema. db push + seed no Neon. **668 testes** + smoke E2E navegador OK (protocolo SD-2026-000001; anti-enum 4×422). **Subdomínio `suporte.` + DNS = PENDENTE.** **Deploy Vercel NÃO feito.** Revisão adversarial de 48 achados na spec + 8 da impl + **rodada de polish 28/06** (fix do guard anti-bot `_t`: o form envia delta-desde-render, mas a rota lia como timestamp absoluto → guard nunca disparava; corrigido + fixtures; smoke: `_t=500` → 422 sem escrita) aplicadas. Ver CHANGELOG `Fixed (2026-06-28)`.
**Priority:** P1
**Date:** 2026-06-25
**Guia:** [`service-desk-GUIA.md`](service-desk-GUIA.md) — herda TODAS as invariantes da §9.

## Objective
Permitir que o **cliente** abra um ticket numa página pública (`suporte.defenz.com.br`), após o sistema **verificar** que ele é um contato autorizado (CNPJ + e-mail-na-console + nome) contra uma tabela local sincronizada do Zoho — **sem coletar senha**. O ticket cai na fila interna (Defenz, `source='portal'`) e dispara **notificação na tela** do time (e-mail/push = futuro).

## Behavior
1. Cliente acessa `suporte.defenz.com.br` (host mapeia p/ `/abrir-ticket`, público, sem login).
2. Preenche: **CNPJ**, **e-mail (o que está na console)**, **nome**, **assunto**, **descrição** (prioridade default `media`; canal `portal`).
3. `POST /api/public/tickets`:
   a. **Rate-limit por IP** (`checkRateLimit`, antes de parsear o body). Estouro → 429 genérico.
   b. Valida com `publicCreateTicketSchema.strict()` (Zod) — **não** usa o `handleApiError` padrão (que vazaria o campo via `details[]`).
   c. Anti-bot: honeypot `_hp` vazio + `_t` (tempo desde render) ≥ limiar.
   d. Normaliza CNPJ (só dígitos) e e-mail (lowercase/trim).
   e. Dedup por janela (query no banco, 60s; ver Business Rules).
   f. `verifyAuthorizedClient(db, {cnpj,email})` → match exige `active=true` e par CNPJ+e-mail na Defenz.
   g. **Match:** cria `Ticket` (ver Data Contract) com `createdById = <usuário-sistema portal>`, `companyId = DEFENZ_COMPANY_ID`, `status='solicitado'`, `source='portal'`, `client = authorizedClient.clientName`, `requester = nome`, `requesterEmail = email`, `protocol` atômico. Grava AuditLog (ator-sistema; `source`+`authorizedClientId` em `changes`).
   h. **Qualquer falha de admissão** (no-match, honeypot, `_t` baixo, CNPJ/e-mail inválido) → **mesma** resposta 422 genérica (anti-enumeração).
4. Sucesso → página mostra confirmação com o **protocolo** (`SD-2026-000123`). Falha → erro genérico **sem limpar o formulário**.
5. No `/dashboard/service-desk`, o time vê o ticket novo + **badge "novos"** (polling). E-mail/push = fase posterior.

## Business Rules
- **Defenz-only por CONFIG:** `companyId` resolvido por `DEFENZ_COMPANY_ID` (env; fallback cuid `cmn8wi8ze00003ouacf33hseb`), **nunca** por string de display do body.
- **Endpoint burro (não confia no body):** schema dedicado `publicCreateTicketSchema.strict()` — campos de controle (`status`, `companyId`, `assignedToId`, `escalatedTo`, `source`, `createdById`) **não existem** no schema; `.strict()` rejeita extras. O handler seta esses valores server-side, ignorando o que vier.
- **Ator session-less = usuário-sistema:** a rota **não** chama `resolveActor`. `Ticket.createdById` e `AuditLog.userId` (ambos NOT NULL) usam um **User-sistema** semeado (`portal@defenz.com.br`, role `user`, Defenz, sem credencial utilizável). Decisão: SD-ADR-006. (Mantém o schema **aditivo** — não precisa tornar `createdById` nullable.)
- **`client` vem do verificado:** `Ticket.client = authorizedClient.clientName` (NÃO o que o usuário digitar livre). Nome do solicitante é `requester` (registrado, **não** é chave de verificação — evita travar por grafia divergente).
- **Idempotência (anti-double-click):** dedup por **query no banco** (não memória — serverless reseta): antes de criar, se existe Ticket com mesmo `requesterEmail`+`client`+`subject` em < **60s**, retorna o protocolo existente. É best-effort anti-duplo-clique, **não** defesa anti-spam.
- **Write-once nesta fase:** abertura via portal **não** cria `TicketMessage` — a descrição vira `Ticket.description`, logo Interações (`count kind='reply'`) nasce em 0. Cliente não responde pelo portal (follow-up bidirecional = futuro F3).

## Edge Cases
- CNPJ com máscara/espaços → normalizar; ≠ 14 dígitos → 422 genérico (não revela motivo).
- E-mail caixa/espaços → lowercase/trim.
- `active=false` → tratado como **sem match** (mesma 422). `verifyAuthorizedClient` filtra `active=true` na query.
- Vários `AuthorizedClient` no mesmo CNPJ (vários contatos) → o par CNPJ+e-mail (`@@unique`) desambígua.
- Rate-limit estourado → 429 genérico ("tente novamente em instantes").
- Honeypot preenchido OU `_t` < limiar → **422 genérico** (mesma resposta; não "ensina" o bot).
- Zoho fora do ar → **não afeta** (verificação é contra a tabela local).
- `AuthorizedClient` vazio (go-live) → portal nega 100%. **Bloqueante** (ver Dependencies + AC).

## Mudanças no modelo (Prisma) — aditivas (ADR-008, `db push` no Neon dev=prod)
```prisma
model Ticket {
  // ...campos existentes...
  client         String?  // empresa atendida (alinha com Demanda.client) — usado por F1 v2 também
  requesterEmail String?  // e-mail do solicitante (portal)
  source         String   @default("interno")  // interno | portal
  protocol       String?  @unique               // SD-<ano>-<seq>, só p/ exibição ao cliente
  // @@index([source]) p/ breakdown de métricas
}

model AuthorizedClient {
  id          String   @id @default(cuid())
  companyId   String                              // Defenz
  company     Company  @relation(fields: [companyId], references: [id])
  cnpj        String                              // normalizado (só dígitos)
  email       String                              // lowercase
  clientName  String                              // empresa atendida → vira Ticket.client
  contactName String?
  active      Boolean  @default(true)
  zohoId      String?
  syncedAt    DateTime?
  createdAt   DateTime @default(now())
  @@unique([cnpj, email])
  @@index([companyId, active])
  @@map("authorized_clients")
}

model TicketSequence {  // geração ATÔMICA do protocolo por ano (não count+1)
  year    Int @id
  lastSeq Int @default(0)
  @@map("ticket_sequences")
}
```
- **Seed obrigatório:** (1) User-sistema `portal@defenz.com.br` (Defenz); (2) ≥1 `AuthorizedClient` ativo (senão o portal nega tudo). Documentar script de seed.

## Data Contract
- **Input** (`POST /api/public/tickets`, JSON, `publicCreateTicketSchema.strict()`): `{ cnpj, email, name, subject, description, priority?, _hp?, _t? }` com caps (subject ≤ 200, description ≤ 5000, sem HTML — texto puro).
- **Output sucesso:** `{ success: true, data: { protocol } }` (NÃO devolver o ticket nem ids internos).
- **Output qualquer falha de admissão:** `{ success: false, error: 'Não foi possível validar seus dados. Confira o CNPJ e o e-mail cadastrado na console.' }`, **status 422 uniforme** (mesmo corpo p/ no-match, honeypot, validação). 429 só p/ rate-limit.
- **Protocolo (atômico):** `db.$transaction` → `update` em `TicketSequence` do ano (`lastSeq++` retornando o novo) → `protocol = `SD-${year}-${String(seq).padStart(6,'0')}``. Nunca `count(*)+1`. (Aceita-se que o número revela volume aproximado — risco baixo, interno; registrado.)
- **AuditLog (session-less):** `createAuditLog({ action:'CREATE', entityType:'Ticket', entityId, userId: systemUser.id, userEmail:'portal@defenz.com.br', changes:{ subject:{from:null,to}, source:{from:null,to:'portal'}, authorizedClientId:{from:null,to:client.id} } })`. (Não há coluna `authorizedClientId` — vai dentro de `changes`.)

## Segurança (superfície pública — herda GUIA §6/§9.9)
- **Anti-enumeração (resposta):** todas as falhas de admissão → 422 idêntico (acima). A rota **não** usa o `handleApiError`/ZodError default.
- **Timing uniforme:** **fora de escopo no MVP** (custo alto p/ ganho marginal sem business-hours). Registrado como aceite consciente; revisitar se houver abuso.
- **Rate-limit:** reusar `src/lib/rate-limit.ts` (`checkRateLimit`) — IP, ex.: **5/min** (alinhado ao login), **antes** de parsear o body. Por-CNPJ: a dedup-DB de 60s cobre duplo-clique; throttle durável por-CNPJ (KV/Upstash) = Fase 2 (memória serverless não é confiável — documentado).
- **Anti-bot:** honeypot `_hp` + tempo-mínimo `_t`. Captcha = Fase 2 se necessário.
- **Sanitização/XSS:** armazenar **texto puro**; Zod rejeita HTML em `subject`/`description`; o dashboard renderiza como texto (confia no escape padrão do React, sem injeção de HTML cru).
- **CSRF:** token **não** necessário (rota stateless, sem cookie/sessão) — decisão registrada.
- **PII/LGPD:** `AuthorizedClient` (cnpj/email/clientName/contactName) e `requester*` são PII de terceiro via superfície pública. Nunca logar e-mail/CNPJ em `console.error`; sem PII em querystring. Base legal/retention = nota p/ F4.
- **PWA/SW:** ⚠️ `<ServiceWorkerRegister/>` está no **root layout** (escopo `/`) → `/abrir-ticket` **seria** controlado pelo SW. **Não registrar o SW no host `suporte.`/na rota pública** (gate por host/path no `ServiceWorkerRegister`). Bump de `CACHE_NAME` ao shipar UI nova (GUIA §9.8).

## Notificação na tela (MVP)
- Reusar o hook existente **`src/hooks/use-polling.ts`** (feature-realtime-polling) — **não** introduzir TanStack Query (o `QueryClientProvider` não está montado).
- **Badge "novos":** `lastSeen` por usuário em `localStorage` (chave `sd:lastSeen:<userId>`); badge = `count(tickets.createdAt > lastSeen)` computado client-side sobre a lista já carregada; ao abrir o board, atualiza `lastSeen`.
- Evitar custo: o board já faz `findMany take:500`; o polling reusa o mesmo fetch (sem segundo mecanismo). Endpoint leve de contagem = otimização opcional, não MVP.

## Domínio / hospedagem
- **`suporte.defenz.com.br` = mesma app Vercel** via host-rewrite (`middleware`/`vercel.ts`) p/ `/abrir-ticket`; **mesmo origin** que `/api/public/tickets` → sem CORS.
- **Isolamento do host:** no host `suporte.` o middleware só serve `/abrir-ticket` + `/api/public/*` + assets; **bloqueia `/dashboard`** e rotas autenticadas. Cookie de sessão não vale no portal.
- **DNS:** hoje na **YCORN**; plano de migrar a zona p/ **Cloudflare/Vercel** (gestão via prompt). Pré-requisito da automação de DNS (zona + API token), não da feature. Até lá, `CNAME suporte → Vercel` manual.

## Acceptance Criteria
- [ ] `suporte.defenz.com.br` (host-rewrite → `/abrir-ticket`) renderiza sem sessão; `/dashboard` bloqueado nesse host.
- [ ] CNPJ+e-mail batendo num `AuthorizedClient` ativo → cria Ticket (`companyId=DEFENZ`, `source='portal'`, `client`=verificado, `status='solicitado'`, `protocol` único, `createdById`=usuário-sistema) e devolve só o `protocol`.
- [ ] Dados que não batem / honeypot / `_t` baixo / CNPJ inválido → **mesma** 422 genérica; **nenhum** ticket criado; formulário **não** é limpo.
- [ ] Body com `assignedToId`/`status`/`companyId`/`source` extras → `.strict()` rejeita (ou ignora server-side); nunca persistem.
- [ ] Protocolo gerado **atomicamente** (`TicketSequence`), sem colisão sob 2 submits concorrentes (teste do helper).
- [ ] AuditLog do portal grava com `userId` do usuário-sistema + `source`/`authorizedClientId` em `changes` (FK válida).
- [ ] Rate-limit por IP retorna 429 após o limite (teste unitário do `checkRateLimit`).
- [ ] **Bloqueante go-live:** smoke pós-deploy verifica ≥1 `AuthorizedClient` ativo na Defenz (senão portal nega tudo).
- [ ] `/dashboard/service-desk` mostra badge "novos" via `usePolling` (sem TanStack); `lastSeen` por usuário.
- [ ] PWA: SW não registrado no host/rota pública; `CACHE_NAME` bumpado ao shipar.
- [ ] TDD: happy (match cria) + sad (no-match não cria, resposta genérica) + helpers puros (`verifyAuthorizedClient`, `normalizeCnpj/Email`, gerador de protocolo). `build`+`tsc`+`test` verdes.

## Dependencies
- **Blocked by (HARD):** **F1 migração de status v1→v2** (open/paused/resolved → solicitado/em_atendimento/concluido) já aplicada — o portal grava `status='solicitado'`, que não existe no enum/Kanban v1. Inclui os ~7 touch-points hardcoded (`validations/ticket.ts`, `tickets-server.ts`, `metrics/route.ts`, UI). Ver F1.
- **Depends on:** F1 core (modelo `Ticket`, board, campo `client`). Novos modelos/colunas desta feature: `AuthorizedClient`, `TicketSequence`, `Ticket.{client?,requesterEmail,source,protocol}`, seed do usuário-sistema (tudo aditivo).
- **Pré-requisito de dados:** carga inicial de `AuthorizedClient` (seed manual ou sync Zoho mínimo) — senão o portal nega tudo.
- **Relacionado/futuro:** F3 (notificação e-mail/push, follow-up bidirecional), F4 (sync Zoho ao vivo + UI de `AuthorizedClient` + LGPD/retention).

## SD-ADRs tocados (ver GUIA §11)
- **SD-ADR-006** (novo): escrita session-less (portal) usa **usuário-sistema** semeado p/ satisfazer `createdById`/`AuditLog.userId` (NOT NULL) — mantém schema aditivo. Origem via `source` + `authorizedClientId` em `changes`.
- **SD-ADR-007** (novo): protocolo gerado por `TicketSequence` (atômico), não `count(*)+1`.
- **SD-ADR-003** (existente): verificação por CNPJ+e-mail+nome, sem senha.
