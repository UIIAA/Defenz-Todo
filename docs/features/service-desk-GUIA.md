# GUIA MESTRE — Service Desk Defenz

**Status:** Guia vivo (living document) — atualizar a cada feature nova
**Owner:** Marcos
**Última atualização:** 2026-06-28
**Specs-filhas:** ver seção [Roadmap de Features](#roadmap-de-features)

> Este é o documento-guia do módulo **Service Desk**. Ele define a visão, o modelo de dados canônico, as métricas, e — o mais importante — as **invariantes obrigatórias** que TODA feature do Service Desk herda (as lições de bug que já pagamos). Cada feature nova ganha sua própria `docs/features/feature-service-desk-<slug>.md` e **deve** respeitar este guia. Quando algo aqui mudar, as specs-filhas seguem.

---

## 1. Visão & objetivo

A Defenz é um MSSP (canal Bitdefender). O time atende clientes (instalação de agente, exclusão de arquivo em política, health checks etc.) — hoje esse trabalho vive disperso em cards "Suporte X:" no Kanban de Demandas, sem como **medir**. O Service Desk transforma isso num fluxo de **tickets** próprio.

**O que precisamos responder, sempre (as 5 prioridades do Marcos):**
1. Quantos tickets foram **abertos** (volume, por período).
2. Quantas **interações** são feitas por ticket.
3. Quanto **tempo** os tickets ficam **abertos**.
4. Quantos tickets **repassamos ao Nível 2 (N2)**.
5. Como **gerar relatórios** sobre tudo isso.

**Princípio de produto:** robusto o suficiente pra medir e operar, sem virar um Zendesk. Pesquisa de ferramentas renomadas (Zendesk/Freshdesk/Jira SM) informa as features, mas só implementamos o que serve a essas 5 perguntas — o resto é YAGNI até pedirem.

## 2. Escopo & não-escopo

**No escopo (agora ou roadmap):**
- Tickets internos no formato **Kanban** (Solicitado · Em atendimento · Concluído), com WIP e aging.
- Campo **Cliente** identificando a empresa atendida (≠ empresa-tenant).
- Vínculo natural **Ticket → Demanda** ("Abrir Demanda" puxando os dados do cliente).
- Métricas + relatório (as 5 prioridades).
- **Portal público** de abertura de ticket pelo cliente (Feature 2).
- Sincronização de **clientes autorizados** a partir do Zoho.

**Fora do escopo (até decisão explícita):**
- Multi-tenant por cliente: o Service Desk é **Defenz-only** (tenant = Defenz). Cada cliente é um **valor do campo Cliente**, não uma Company.
- SLA com horário comercial/feriados, CSAT, base de conhecimento pública, chat ao vivo, telefonia.

## 3. Glossário

| Termo | Definição |
|---|---|
| **Empresa-tenant** | A Company do multi-tenant. No Service Desk é sempre **Defenz**. |
| **Cliente** | A empresa **atendida** (ex.: Volix, Bevicred). É um campo do ticket, não um tenant. |
| **N1 / N2** | Nível 1 (Defenz) e Nível 2 (parceiro/SecuriSoft). "Escalar" = repassar ao N2. |
| **Interação** | Uma mensagem `kind='reply'` no ticket (nota interna `kind='note'` **não** conta). |
| **Aging** | Tempo que o card está **na coluna atual** (`columnChangedAt`), não desde a criação. |
| **WIP** | Work-in-progress: limite suave de cards por coluna. |
| **Portal** | Página pública onde o cliente abre ticket (origem `source='portal'`). |

## 4. Arquitetura (visão geral)

- **Banco:** PostgreSQL (Neon), Prisma. Mesmo schema do app (regra crítica: `provider = postgresql`). Modelos do Service Desk listados na §5.
- **Rotas internas:** `/api/tickets` (CRUD, **autenticado**, escopo Defenz), `/api/tickets/[id]/*` (messages, escalate, link-demanda), `/api/service-desk/metrics`.
- **Rota pública:** `/api/public/tickets` (**não autenticado**, hardening da §6) — única porta de escrita sem sessão; só cria ticket com `source='portal'`, status forçado, sem assignee.
- **UI interna:** `/dashboard/service-desk` (Kanban), `/dashboard/service-desk/relatorio` (métricas). Segue o design system Azure Shield + dark sidebar.
- **UI pública:** servida em **`suporte.defenz.com.br`** (mesmo app Vercel via host-rewrite p/ `/abrir-ticket`; mesmo origin que `/api/public/tickets` → sem CORS). O host `suporte.` só serve o portal + API pública; bloqueia `/dashboard`. DNS hoje na YCORN, migrando p/ Cloudflare/Vercel (gestão via prompt). Sem sessão, branding Defenz leve.
- **Integrações:** Zoho (sync de clientes autorizados → tabela local). E-mail/push de notificação = **futuro**.

## 5. Modelo de dados canônico

> Os campos abaixo são o alvo. Mudanças no schema são **aditivas** (ADR-008: dev=prod no mesmo Neon). Cada feature que altera o schema documenta o `db push`.

**`Ticket`** (scoped por `companyId` = Defenz)
- `id`, `companyId` (NOT NULL), `subject`, `description`
- `status`: `solicitado | em_atendimento | concluido` (3 colunas do Kanban — ver §7)
- `priority`, `client` (string da empresa atendida — mesmo nome de `Demanda.client`), `channel`
- `requester` (nome de quem abriu), `requesterEmail`
- `assignedToId?` (FK User — **sempre** validar empresa, §9), `createdById` (**NOT NULL**; escrita session-less do portal usa **usuário-sistema** semeado — SD-ADR-006)
- `columnChangedAt` (aging — setado só na troca de status), `firstReplyAt?`, `resolvedAt?`
- `escalatedAt?`, `escalatedTo?` (parceiro/N2)
- `source`: `interno | portal`
- `demandaId? @unique` (vínculo 1:1 com Demanda)
- `protocol?` (número amigável p/ o cliente, ex.: `SD-2026-000123`)
- `createdAt`, `updatedAt`

**`TicketMessage`**
- `id`, `ticketId`, `kind`: `reply | note`, `body`, `authorId?`, `authorName`, `createdAt`
- Interações = `count(kind='reply')`.

**`AuthorizedClient`** (tabela de verificação do portal — §6)
- `id`, `companyId` (Defenz), `cnpj` (normalizado, só dígitos, indexado), `email` (lowercase, indexado), `clientName` (empresa), `contactName?`, `active` (bool)
- `zohoId?`, `syncedAt?` (origem Zoho)
- `@@unique([cnpj, email])` — uma autorização por par CNPJ+e-mail.

**`TicketSequence`** (geração atômica de protocolo — SD-ADR-007)
- `year Int @id`, `lastSeq Int @default(0)`. Incrementado em transação; `protocol = SD-<ano>-<seq>`. Nunca `count(*)+1`.

**Usuário-sistema + AuditLog session-less:** rotas sem sessão (portal) gravam `Ticket.createdById` e `AuditLog.userId` (ambos NOT NULL) com um **User-sistema** semeado (`portal@defenz.com.br`, Defenz). A origem real vai em `Ticket.source='portal'` + `authorizedClientId` dentro de `AuditLog.changes` (não há coluna dedicada). SD-ADR-006.

**Vínculo Ticket↔Demanda:** `Ticket.demandaId @unique` (1:1). "Abrir Demanda" cria a Demanda já com `client` = `Ticket.cliente`, título/descrição herdados, e seta `demandaId`. NÃO move o ticket de coluna automaticamente.

## 6. Segurança de superfície pública (resumo — detalhe na spec do portal)

A página pública é a maior superfície nova. Regras herdadas por qualquer feature pública:
- **Sem credenciais de terceiros.** Nunca coletar senha de console do cliente. Identidade = CNPJ + e-mail-na-console + nome, conferidos contra `AuthorizedClient`.
- **Anti-enumeração (resposta):** **mesma** resposta 422 genérica p/ toda falha de admissão (no-match, honeypot, validação) — não revelar se foi CNPJ ou e-mail. A rota **não** usa o `handleApiError`/ZodError default (vazaria o campo). **Tempo uniforme = fora de escopo no MVP** (custo alto, ganho marginal sem business-hours) — aceite consciente.
- **Rate-limit** reusa `src/lib/rate-limit.ts` (`checkRateLimit`, IP, ~5/min, antes de parsear o body). Por-CNPJ: dedup-DB de 60s cobre duplo-clique; throttle durável por-CNPJ = Fase 2 (memória serverless não é confiável). **Honeypot** + tempo-mínimo (anti-bot); captcha = Fase 2.
- **Endpoint público é burro:** schema `.strict()` (campos de controle nem existem nele); força `companyId` (resolvido por **CONFIG `DEFENZ_COMPANY_ID`**, nunca string de display), `status='solicitado'`, `source='portal'`, `createdById`=usuário-sistema, sem `assignedToId`/`escalatedTo`. Nunca usa `resolveActor` nem confia em campos de controle do body.
- **Zod estrito** + caps de tamanho + sanitização (sem HTML no body). Sem PII em querystring.

## 7. Ciclo de vida & status

Kanban de **3 colunas** (decisão do Marcos):

```
Solicitado  →  Em atendimento  →  Concluído
(solicitado)   (em_atendimento)    (concluido)
```

- Troca de coluna seta `columnChangedAt` (base do aging). `firstReplyAt` na 1ª resposta; `resolvedAt` ao entrar em Concluído. Ao reabrir (Concluído→outra coluna) limpa **só** o `resolvedAt`; `firstReplyAt` permanece.
- **WIP suave:** limite por coluna; estouro **destaca a coluna em vermelho** mas **não bloqueia** (soft).
- **Aging:** cor progride **verde → âmbar → PRETO** por `agora − columnChangedAt` vs limiares por coluna; "Concluído" não envelhece. (Vermelho fica reservado pro estouro de WIP — sinais distintos.)
- **Escalar ao N2:** seta `escalatedAt` + `escalatedTo` (transição N1→N2; nunca na criação). É a base da métrica de % repassado.

> **Migração:** o código v1 atual usa `status = open|paused|resolved`. O alvo canônico é `solicitado|em_atendimento|concluido`. A feature "Kanban v2" faz a migração (mapa: open→solicitado, paused→em_atendimento c/ flag, resolved→concluido) com backfill.

## 8. Métricas & relatórios

Coorte **por data de criação** do ticket (`createdAt`), com **fuso SP** (§9). Cards do relatório, rotulados com a coorte explícita:
1. **Volume** = `count(tickets no período)`, com **breakdown por `source`** (interno vs portal): "X total, dos quais Y abertos pelo cliente (portal)". `@@index([source])`.
2. **Interações/ticket** = `avg(count(messages kind='reply'))` — fonte da verdade é o COUNT, não contador materializado. (Tickets de portal nascem com 0 interações — ver spec do portal.)
3. **Tempo de resolução** = `avg(resolvedAt − createdAt)` dos resolvidos da coorte (rotular "dos criados no período"). Tempo em aberto = `avg(agora − createdAt)` dos não-resolvidos.
4. **% ao N2** = `escalados / total` da coorte (rotular "dos criados no período que subiram").
5. **Relatório** = aba estilo "Horas" (layout/Recharts reusados; lógica é agregação própria, não groupBy).

> **Caveat de coorte:** um influxo de criação numa coorte ainda jovem (de qualquer fonte — UI interna ou portal) achata transitoriamente `%N2` e o tempo médio de aberto. Rotular os cards com a coorte explícita; permitir recorte por `source`.

## 9. Invariantes & Definition of Done (HERDADAS por TODA feature)

> Estas são as classes de bug que **já pagamos** em outras features (ver `docs/PROGRESS.md` e revisões adversariais). Toda spec-filha e todo PR do Service Desk **deve** passar por esta checklist.

1. **Tenant isolation:** todo `Ticket`/`AuthorizedClient` tem `companyId` NOT NULL e é filtrado por `companyScopeWhere`. Ao gravar `assignedToId`, **sempre** `db.user.findUnique` + `assertCompanyAccess(assignee.companyId, user)` (POST **e** PUT). Ao linkar Demanda, `assertCompanyAccess(demanda.companyId, user)`.
2. **Fuso SP em filtros de período:** usar `dayStart/dayEnd` com `SP_OFFSET='-03:00'`. Hoje o offset vive em `src/lib/date.ts` e a metrics route duplica os helpers inline → **extrair `dayStart/dayEnd` p/ `src/lib/date.ts`** (fonte única) e importar nas rotas. Nunca `new Date(s+'T00:00:00')` cru.
3. **Sem erro silencioso na UI:** toda ação (criar/escalar/linkar/mensagem) lê resposta não-ok e mostra toast/inline. Só limpa o input no ramo de sucesso.
4. **Queries limitadas:** todo `findMany` tem `take`. Relatório usa sentinela (`take: CAP+1`) + flag `capped` **renderizada** na UI quando truncar. `orderBy` determinístico.
5. **Admin multi-empresa:** formulários enviam `companyId` quando relevante; tratar admin sem empresa-primária (Defenz-only mitiga: portal sempre = Defenz).
6. **AuditLog:** toda mutação loga. Escrita **session-less** (portal) usa o **usuário-sistema** (SD-ADR-006) — `userId`/`createdById` (NOT NULL) nunca ficam vazios. PUT parcial **não** pode logar campos ausentes como `→ null` (bug do `diffChanges`); ⚠️ o fix vive hoje só na rota de ticket, **não** em `audit.ts` → rotas novas **não** podem reintroduzir (idealmente centralizar no helper). Actions novas (`ESCALATE`, `LINK`) têm label/ícone na página de Logs.
7. **Métricas honestas:** rótulos explícitos sobre a coorte (`createdAt`); não prometer mediana/SLA-com-pausa no MVP.
8. **PWA / Service Worker:** mudança de UI exige bump de `CACHE_NAME` em `public/sw.js` (o `activate` purga o cache antigo de todos). Em dev o SW se autodesregistra. (Causa-raiz do "menu some/aparece".) **Rotas/host públicos** (`suporte.`, `/abrir-ticket`) **não** registram o SW — `<ServiceWorkerRegister/>` está no root layout (escopo `/`), então deve ter gate por host/path.
9. **Superfície pública:** §6 — anti-enumeração, rate-limit, honeypot, endpoint burro, Zod estrito, sem credencial de terceiro.
10. **Gate:** `npm run build && npx tsc --noEmit && npm test` verdes. TDD proporcional (1 happy + 1 sad por endpoint/helper). Revisão adversarial multi-agente antes do deploy.

## 10. Roadmap de Features

Cada item vira (ou já é) uma spec própria. Ordem sugerida:

| # | Feature | Spec | Status |
|---|---|---|---|
| F1 | Core: Kanban interno (3 colunas, WIP, aging→preto), métricas, "Abrir Demanda", drawer | `feature-service-desk.md` | **v2 implementado + polido (local; não deployado)** |
| F2 | **Portal público de abertura de ticket** (CNPJ+e-mail+nome → verifica → ticket) | `feature-service-desk-portal.md` | **Implementado + polido (local; subdomínio/DNS + deploy pendentes)** |
| F3 | Notificações (tela → depois e-mail/push) | a criar | Futuro |
| F4 | Sync Zoho ao vivo + gestão de `AuthorizedClient` na UI | a criar | Futuro |
| F5 | SLA / horário comercial / CSAT | a criar | Futuro (YAGNI até pedir) |

## 11. Decisões (ADRs do Service Desk)

- **SD-ADR-001:** Defenz-only. Cliente é campo, não tenant. (Simplicidade multi-tenant.)
- **SD-ADR-002:** Status = 3 colunas Kanban (Solicitado/Em atendimento/Concluído). Migra do v1 open/paused/resolved.
- **SD-ADR-003:** Portal verifica por **CNPJ + e-mail-na-console + nome** contra `AuthorizedClient` (tabela local sincronizada do Zoho). **Sem senha** (não coletar credencial de terceiro). OTP por e-mail = hardening de Fase 2.
- **SD-ADR-004:** Coorte das métricas = `createdAt` + fuso SP. Rótulos explícitos.
- **SD-ADR-005:** Vínculo Ticket↔Demanda 1:1 (`Ticket.demandaId @unique`); "Abrir Demanda" herda Cliente e não move a coluna. "Abrir Demanda" num ticket que já tem `demandaId` → no-op/erro amigável (nunca cria órfã).
- **SD-ADR-006:** Escrita **session-less** (portal) usa um **usuário-sistema** semeado (`portal@defenz.com.br`, Defenz) p/ satisfazer `Ticket.createdById` e `AuditLog.userId` (NOT NULL) — mantém o schema **aditivo** (não torna `createdById` nullable). Origem real via `source='portal'` + `authorizedClientId` em `AuditLog.changes`.
- **SD-ADR-007:** Protocolo do ticket gerado **atomicamente** por `TicketSequence{year,lastSeq}` em transação — nunca `count(*)+1` (corrida). Aceita-se que o nº revela volume aproximado (risco baixo, interno).
- **Migração de status (HARD BLOCK p/ F2 portal):** o v1 em produção usa `open|paused|resolved` hardcoded em ~7 pontos (`validations/ticket.ts`, `tickets-server.ts`, `service-desk/metrics/route.ts`, UI do board/relatório). A F1 v2 migra p/ `solicitado|em_atendimento|concluido` + backfill **antes** do portal (que grava `status='solicitado'`).
