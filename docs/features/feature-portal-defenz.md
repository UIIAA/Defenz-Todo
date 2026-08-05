# Feature: Portal Defenz

**Status:** 🟢 **SPEC v2 — desenho aprovado + revisão adversarial aplicada (2026-08-05)**
**Priority:** P1 (feature de produto em implementação)
**Date:** 2026-07-20 (visão) → 2026-08-05 (D1–D5 fechadas, spec v1, crítica, v2)
**Absorve:** `feature-playbooks-manuais.md` (Approved design, 2026-06-24) — vira a **fundação técnica** da F1, não menu próprio.
**Revisão:** `feature-portal-defenz-review.md` — 4 críticos + 8 médios, disposição item a item. Ler antes de questionar qualquer decisão abaixo.

---

## 1. Objetivo

Uma página única — **Portal Defenz** — onde a equipe encontra **como se faz** e **com o quê se faz** na Defenz, sem voltar pro Drive. Três pilares numa rota só:

| # | Pilar | O que é | Onde o conteúdo mora |
|---|-------|---------|----------------------|
| 1 | **IA Defenz** | Pergunta em linguagem natural, responde sobre a base interna **ou** pesquisando a web | — |
| 2 | **POPs / Procedimentos** | Procedimentos operacionais padrão, em markdown, **com imagens** | App (texto) + Drive (imagens) |
| 3 | **Biblioteca** | Manuais, modelos de apresentação e proposta | Drive (arquivo) + ficha no app |

**Princípio que organiza tudo:** o app hospeda *conhecimento* (texto que se lê e se busca); o Drive hospeda *artefatos* (arquivo que se baixa e se edita). O app indexa os dois, garante o frescor dos dois, e a IA lê os dois.

**O diferencial não é o editor — é o FRESCOR** (herdado da pesquisa de `feature-playbooks-manuais`): `dono → verificar → TTL → des-verifica → notifica`. Sem isso, vira mais um repositório morto.

---

## 2. Decisões fechadas (§D)

**D1 · Escopo da IA** — ✅ **AMBOS** (interno + web).
> "Pode pesquisar dentro dos nossos documentos. E fora também (mas podemos usar o n8n como orquestrador)." — Marcos, 05/08

**D1b · Onde mora o cérebro** — ✅ **HÍBRIDO.**
- **Interno = no app.** Busca no Postgres + Gemini, mesmo processo → resposta rápida e **tenant isolation garantido em código**, não delegado a token externo.
- **Web = no n8n** (instância Contabo), via webhook. Itera-se o fluxo de pesquisa sem redeploy do To-Do.
- Descartados: n8n orquestrando tudo (latência + ponto único de falha + isolation via token); tudo in-app (cada ajuste de prompt vira deploy).

**D2 · Onde ficam os arquivos (imagens dos POPs e artefatos da Biblioteca)** — 🔄 **REVISADO em 2026-08-05: OneDrive, não Google Drive.**
> Primeira versão (manhã): "Podemos usar links dos Drives para que possamos criar a POP com imagens e manter no Drive."
> Revisão (tarde): **"Vamos usar o OneDrive."** — Marcos

- **Host = OneDrive/SharePoint do tenant** (`10Xd Soluções em comercio e representação LTDA`). Faz mais sentido que o Google Drive: a empresa já está em **Microsoft 365**, então quem clica no link já está autenticado e a permissão é gerida pelo próprio M365 — sem link público solto.
- **Teste feito (05/08):** pasta `.../ESTRATEGICO_VENDAS/DESCRICAO_FORMAL_CARGO/KPIs_DE_VENDAS` lida com sucesso; `KPIs_GESTAO_VISTA_V1.docx` (18.886 caracteres) extraído e carregado no Portal → **busca pelo corpo funcionando** ("CAC", "close rate" encontram o documento; termo inexistente retorna zero).
- ⚠️ **Descoberta importante:** a leitura acima foi do **diretório sincronizado local** (`~/Library/CloudStorage/OneDrive-…`). O app roda na **Vercel** e **não** tem esse diretório. Toda integração com OneDrive precisa ser por **link** ou por **API (Microsoft Graph)**.
- ⚠️ **Credencial:** hoje **não existe** credencial de OneDrive/SharePoint em lugar nenhum. O `.env.local` do `Defenz_Chief` não tem `AZURE_BOT_*` (só o placeholder no `.env.example`); o n8n tem `Marcos@Defenz` e `Fernando@defenz`, mas do tipo `microsoftOutlookOAuth2Api` (**escopo de e-mail**). Ler arquivo do OneDrive exige **credencial nova**.
- Descartado: base64 no markdown (incha o banco, mata a busca).

**D2b · Como o app alcança o OneDrive** — ✅ **DECIDIDO (Marcos, 2026-08-05): via n8n + Microsoft Graph. A credencial JÁ EXISTE.**
> "O n8n já tem credencial — vá no projeto Chief Defenz, ele já consegue inclusive escrever lá."

- **Onde estava:** workflow `TMP Upload OneDrive (resumo mensal)` (n8n `6fn2jssVT55O1V9S`). Ele faz `PUT https://graph.microsoft.com/v1.0/drives/{driveId}/root:/ADMINISTRATIVO/…/arquivo.pptx:/content` com um nó **HTTP Request** usando `authentication: predefinedCredentialType` + `nodeCredentialType: microsoftOutlookOAuth2Api` e a credencial **`Marcos@Defenz`** (`tuFzJdPvNnOt3TD3`).
- 🔑 **O ponto não-óbvio:** a credencial se chama "Outlook", mas o app registration por trás dela **tem escopo de arquivos no Graph**. Ou seja, não é preciso criar credencial nova — basta apontar o HTTP Request para o endpoint de `drives`. Não procure por uma credencial chamada "OneDrive"; ela não existe.
- **`driveId` da Defenz:** `b!U_mU5dfLRUaHL-AHPbqvGbvYNDjS5ThMkED0qj3lv1l8SgPtsIgySIbDpNp5crG2`. O caminho no Graph começa em `root:/ADMINISTRATIVO/…` (o que localmente aparece como `OneDrive-10Xd…/Defenz - ADMINISTRATIVO/…`).
- **Teste de LEITURA feito e aprovado (05/08):** workflow temporário `GET …:/children` sobre `ADMINISTRATIVO/ESTRATEGICO_VENDAS/DESCRICAO_FORMAL_CARGO/KPIs_DE_VENDAS` → devolveu os 3 arquivos com nome, tamanho e data. **Cada item traz `@microsoft.graph.downloadUrl`** (URL pré-autenticada de curta duração). Workflow de teste **apagado em seguida** (era webhook sem auth sobre arquivo da empresa).
- **Consequências para o desenho:**
  1. **Imagem inline no POP passa a ser viável de verdade** — `/api/portal/image-proxy` chama o webhook, que devolve o `downloadUrl`, e o app serve os bytes. Mata o R1 por construção (não depende de hotlink).
  2. **A Biblioteca pode indexar a pasta sozinha** — listar `:/children` e criar/atualizar as fichas. Cai o "exige disciplina de cadastro" que era o contra da Opção C do estudo original.
  3. **A IA interna pode ler os documentos** (o teste com `KPIs_GESTAO_VISTA_V1.docx` já provou que o texto extraído indexa e é encontrado pela busca).
  4. **Nenhuma credencial Microsoft entra na Vercel** — o app só conhece a URL do webhook e um segredo de header. Mesmo desenho do D1b.
- ⚠️ **A construir na implementação:** o webhook do Portal precisa de **autenticação de header** (o teste rodou sem, por ser efêmero) e de **allowlist de caminho** — o app não pode pedir um caminho arbitrário do OneDrive da empresa.

**D2c · Raiz do Portal no OneDrive** — ✅ **DECIDIDO (Marcos, 2026-08-05).**

| | |
|---|---|
| **Local (sync)** | `~/Library/CloudStorage/OneDrive-10Xd…/Defenz - ADMINISTRATIVO/BIBLIOTECA PORTAL DEFENZ` |
| **Graph** | `drives/{driveId}/root:/ADMINISTRATIVO/BIBLIOTECA PORTAL DEFENZ` |
| **driveId** | `b!U_mU5dfLRUaHL-AHPbqvGbvYNDjS5ThMkED0qj3lv1l8SgPtsIgySIbDpNp5crG2` |
| **Estado** | pasta **vazia** (criada para isto) |
| **Verificado** | `GET …:/children` → **200**, `value: []`, sem erro (05/08) |

🔑 **Mapeamento que engana:** o que o sync local mostra como **`Defenz - ADMINISTRATIVO`** é **`ADMINISTRATIVO`** no Graph — o prefixo `Defenz - ` é o nome da biblioteca, não um diretório. Confirmado em dois testes independentes. Espaços no caminho vão como `%20`.

**Esta é a allowlist (R7):** o webhook só aceita caminhos **sob essa raiz**. Qualquer requisição fora dela é rejeitada no n8n, não no app — o app não é a fronteira de segurança. Caminho arbitrário do OneDrive da empresa nunca é montável a partir do Portal.

**D3 · Público** — ✅ **INTERNO**, atrás do login.
> "Em sua maioria pessoal interno. Mas vamos ter uma página de suporte conectada (já temos algo assim), mas essa página de suporte entra por outro caminho mesmo."
- A **única superfície pública continua sendo `/abrir-ticket`** (F2 do Service Desk). O Portal **não** cria superfície pública nova (invariante §9.9 do GUIA). "Conectada" = link entre as duas, não permissão compartilhada.

**D4 · Nav** — ✅ **menu próprio "Portal Defenz"**, item de topo → `/dashboard/portal`, abas dentro. O item "Playbooks" da spec antiga **não chega a existir**.

**D5 · Conteúdo inicial** — ✅ **começar com os mais usados** (3–5 procedimentos reais). Sem migração em massa.

**D6 · Domínio do conteúdo** — ✅ **DECIDIDO (Marcos, 2026-08-05), em duas correções sucessivas:**

1. > "A console do cliente sempre vai ser da Bitdefender — é tudo relativo a Bitdefender. **Não vai haver habilitação de Tráfego e AdOps.**"
2. > "Não, essas POP vão ser sobre o **nosso processo interno**. Os problemas Bitdefender podem ficar pra depois."

**Leitura final — o Portal nasce documentando COMO A DEFENZ TRABALHA, não como se opera o produto:**

| | |
|---|---|
| ✅ **Entra agora** | **Processo interno da Defenz**: como se faz onboarding de cliente novo, como a proposta comercial é montada e enviada, como funciona o faturamento, a rotina da reunião semanal, apontamento de horas, triagem de e-mail, quem aprova o quê |
| ⏳ **Entra depois** | Procedimentos **técnicos de Bitdefender** (console do cliente, agente, políticas, licenças, suporte do fabricante) |
| ❌ **Não entra** | Tráfego pago / AdOps / Business Manager — é de outras frentes (PSI, Marketing), não do Portal |

Consequência: os exemplos, o mockup e os placeholders da UI falam de **processo interno**. Os 3–5 POPs da F2 saem daí. O documento de KPIs carregado no teste (`KPIs_GESTAO_VISTA_V1.docx`) é exatamente desse tipo — material de como a empresa se organiza — e por isso serve bem como semente.

---

## 3. Arquitetura

### 3.1 Um modelo para POP e Biblioteca

Um modelo `Playbook` com discriminador `kind`:

- `kind = POP` → conteúdo em markdown no `body`. É o que se lê.
- `kind = BIBLIOTECA` → `externalUrl` (Drive) obrigatório + `body` como **ficha** (o que é, quando usar, o que trocar). É o que se baixa.

**Por quê:** uma busca só, um sinal de frescor só, um modelo de permissão só. Um manual do Drive vira ficha buscável com botão "Abrir no Drive" — que é exatamente o valor pedido ("links diretos ou não" → **link + ficha**).

### 3.2 Busca — Prisma `contains`, sem SQL raw *(revisado: C2/M5)*

A v1 pedia índice GIN `to_tsvector('portuguese', …)` via SQL raw. **Cortado do MVP** por dois motivos que só apareceram na revisão:

1. Um `where` do Prisma **não entra** num `$queryRaw` — o escopo multi-tenant teria que ser reescrito à mão em SQL, exatamente na rota que alimenta a IA. Trocar o helper testado por SQL manual no ponto de maior risco é um mau negócio.
2. Um índice criado por SQL raw pode ser **silenciosamente derrubado** pelo próximo `db push` — em produção, já que dev = prod (ADR-008). A busca continua funcionando (só lenta), então ninguém percebe.

**MVP:** `where: { OR: [ { title: { contains: q, mode: 'insensitive' } }, { body: { contains: q, mode: 'insensitive' } } ] }`, escopado pelo helper. Busca no corpo — que é o requisito real — sem SQL raw. Na escala da Defenz (dezenas a poucas centenas de itens) o seq-scan é irrelevante.
**Evolução:** quando o volume justificar, migrar pro GIN via `prisma migrate` de verdade (não `db push`) + `playbookScopeSql()` testado.

### 3.3 Escopo multi-tenant — `scopedPlaybookWhere(user, extra)` *(revisado: C3)*

A v1 propunha `playbookScopeWhere(user)` = `{ OR: [ companyScopeWhere(user), { companyId: null } ] }`, para o caller espalhar (`{ ...scope, ...filtros }`). **Isso vaza:** qualquer filtro que também use `OR` (buscar por título **ou** corpo — ou seja, a busca) sobrescreve o escopo pelo spread, silenciosamente, sem erro e sem teste que pegue.

**Forma correta — o caller nunca espalha escopo:**

```ts
// src/lib/playbook-scope.ts
export function scopedPlaybookWhere(
  user: SessionUser,
  extra: Prisma.PlaybookWhereInput = {}
): Prisma.PlaybookWhereInput {
  if (user.role === 'admin') return extra            // admin cruza empresas
  return { AND: [ { OR: [ companyScopeWhere(user), { companyId: null } ] }, extra ] }
}
```

Toda rota chama `scopedPlaybookWhere(user, { isArchived: false, OR: [...busca] })`. O `AND` externo torna impossível o filtro engolir o escopo. **Não** estender `companyScopeWhere` (`src/lib/auth.ts:89`) — ele retorna cláusula única e é usado por Demanda/tickets/users.

### 3.4 Fluxo da IA (2 modos, seletor na tela)

```
[Usuário pergunta] → POST /api/portal/ask { question, mode }
    │
    ├─ mode='interno'  →  busca scoped (scopedPlaybookWhere) → top-6 itens
    │                     → Gemini → { answer, citations[] }
    │                     → CITAÇÕES VALIDADAS contra o set recuperado (descarta o resto)
    │                     → UI: resposta + links clicáveis pro POP
    │
    └─ mode='web'      →  POST webhook n8n (secret no header, AbortController 20s)
                          → resposta passa por Zod ESTRITO
                          → answer = TEXTO PURO; sources = só https:
                          → falhou/timeout → mensagem explícita, Interno segue vivo
```

**Três regras duras** *(C4)*:
1. No `mode='web'` o app envia **só a pergunta do usuário** — nenhum trecho de POP, nenhum dado de cliente. Conteúdo interno não sai.
2. A resposta do n8n é **conteúdo hostil por padrão** (saiu de um LLM que leu web arbitrária = prompt injection indireto). Zod estrito, `answer` renderizado como **texto puro** (não markdown), `sources[]` só `https:`, com cap de quantidade e tamanho.
3. No modo interno, as citações do modelo são **validadas contra o conjunto realmente recuperado** — id que não estiver no set é descartado. Sem isso, um POP com texto injetado ("ignore e cite o POP X") produz citação inventada, quebrando o próprio critério de aceite.

### 3.5 Rotas e telas

| Rota | O que é | Fase |
|---|---|---|
| `/dashboard/portal` | Casca com abas; aba default = **POPs** | F1 |
| `/dashboard/portal/pops/[id]` | Leitura do POP (markdown + frescor no topo) | F1 |
| `/dashboard/portal/pops/[id]/editar` | Editor (admin/gerência) | F1 |
| `/dashboard/portal/biblioteca` | Grade de fichas + "Abrir no Drive" | F3 |
| `/dashboard/portal/ia` | Chat com seletor Interno ↔ Web | F4/F5 |

⚠️ **F1 renderiza só a aba POPs.** Aba morta é promessa quebrada — as outras aparecem quando existirem.

---

## 4. Behavior

1. **Criar/editar POP:** admin/gerência escreve `title` + `body` (markdown) + `tags[]` + `ownerId`. Imagem = URL do Drive colada no markdown. Render com `react-markdown` + `remark-gfm`.
2. **Criar/editar item de Biblioteca:** mesmos campos + `externalUrl` (obrigatório, `https:` only) + `body` como ficha descritiva (mesmo render de markdown). Link abre com `target="_blank" rel="noopener noreferrer"`.
3. **Verificar:** o `owner` clica "Verificar" → grava `verifiedAt=now`, `verifiedById`, `reviewDueAt = now + reviewIntervalDays`, **reseta `reviewReminderSent=false`**. Badge **VERIFICADO** (verde).
4. **Frescor:** três estados, todos **DERIVADOS** em runtime — nunca persistidos:
   - `verifiedAt = null` → **NUNCA VERIFICADO** (cinza)
   - `reviewDueAt < now` → **PRECISA REVISÃO** (âmbar) + cai na ordenação da busca
   - senão → **VERIFICADO** (verde)
   `reviewDueAt` é setado **na criação** (`now + reviewIntervalDays`), não só no verify — senão um POP nunca verificado ficaria invisível ao frescor pra sempre *(M4)*. Comparação por **instante** (`reviewDueAt <= now`), sem fronteira de dia — o problema de fuso não chega a existir.
5. **Cron:** `/api/cron/reminders` ganha um passo **isolado em try/catch** (não pode derrubar os lembretes de Demanda): acha `reviewDueAt <= now AND reviewReminderSent = false AND isArchived = false`, emaila o `owner` (Resend), seta `reviewReminderSent = true`. Não grava status.
6. **Editou-sem-ser-dono → zera `verifiedAt`** (o badge VERIFICADO não pode mentir).
7. **Buscar:** campo no topo do Portal; busca em título **e** corpo; ordena stale primeiro; payload leve (id/título/snippet/frescor/kind).
8. **Perguntar à IA:** seletor Interno/Web; resposta interna **sempre** com citação clicável; carregando explícito; erro explícito.

---

## 5. Business Rules

- **Multi-tenant com global:** `scopedPlaybookWhere(user, extra)` (§3.3). `companyId = null` = **global Defenz**.
- **Permissão:** só **admin** cria/edita itens globais (`companyId=null`); **gerência** cria/edita os da própria empresa; **user** só lê (escopo + globais). Nav com role gating.
- **A IA respeita o escopo do usuário:** o retrieve usa o mesmo helper, com o usuário da sessão. Nunca consulta privilegiada.
- **AuditLog** em toda mutação (`entityType='Playbook'`). `diffChanges` recebe **só as chaves presentes no payload** — PUT parcial não pode logar campo ausente como `→ null` (§9.6 do GUIA; o fix vive na rota, como no ticket).
- **Validação de PUT parcial sobre o estado MERGEADO**, não sobre o payload *(M3)*: `{ ...existing, ...payload }` — senão mandar só `{ kind: 'BIBLIOTECA' }` passa sem `externalUrl`.
- **Sanitização:** `react-markdown` **sem** `rehype-raw` (HTML cru já é desabilitado por default no v10) + `urlTransform` com allowlist `https:`/`mailto:`. **DOMPurify não entra no caminho de render** — `react-markdown` devolve elementos React, não string HTML; passar por DOMPurify exigiria serializar e reinjetar HTML cru, o que *introduz* o risco em vez de remover *(M1)*. O risco residual real é URL (`javascript:`), e é isso que o `urlTransform` corta.
- **`externalUrl` e URLs de imagem:** só `https:`, validado no Zod **e** no `urlTransform`.
- **Frescor determinístico:** gatilhos = (a) tempo e (b) editou-sem-ser-dono. `reviewIntervalDays = null` → evergreen.
- **Custo/abuso da IA:** `/api/portal/ask` autenticado + `checkRateLimit` com chave **`portal-ask:${user.id}`** — ⚠️ o helper compõe `${key}:${ip}` (`src/lib/rate-limit.ts:26`), então sem a chave por usuário o balde seria compartilhado por todo mundo atrás do mesmo NAT. Caps duros: pergunta ≤ 500 chars, retrieve ≤ 6 itens, contexto ≤ 8k chars, `maxOutputTokens` fixo.
- **Soft delete:** DELETE = `isArchived = true` (não apaga linha). Mesma permissão do PUT.

---

## 6. Edge Cases

- Item nunca verificado → badge cinza próprio; conta como stale só depois de `reviewDueAt` (setado na criação).
- `reviewIntervalDays = null` → `reviewDueAt = null` → nunca stale, nunca e-mail.
- Deletar Company com itens vinculados → `onDelete: Restrict` → `P2003` → hoje vira "Referência inválida" 400 genérico (`api-helpers.ts:79-88`). 📌 Mensagem específica no DELETE de Company = fora do MVP, anotado no §11.
- Markdown com `<script>`/`javascript:`/`onerror` → HTML cru não renderiza; URL perigosa cortada pelo `urlTransform` (teste dedicado).
- **Imagem do Drive quebrada** → placeholder visível "imagem indisponível — verifique o link" + `alt`. **Nunca** quadro branco silencioso.
- `kind=BIBLIOTECA` sem `externalUrl` (inclusive via PUT parcial) → 400 no Zod sobre o estado mergeado.
- Busca sem resultado → mensagem amigável (logar o termo = fase 2).
- **IA interna sem contexto relevante** → responder "não achei isso nos nossos POPs" e oferecer o modo Web. **Nunca** inventar procedimento — é o pior modo de falha desta feature.
- **IA interna com citação inválida** (id fora do set recuperado) → citação descartada silenciosamente do payload, resposta mantida.
- **n8n fora do ar / timeout** → mensagem explícita; modo Interno segue funcionando. `maxDuration` explícito na rota + `AbortController` em 20s, para o 504 da plataforma não virar erro silencioso *(M7)*.
- Modo Web sem env var configurada → resposta traz `webEnabled: false`; UI desabilita o seletor **com explicação** (env var é server-side; o cliente não adivinha) .
- Tenant isolation: sad path explícito — usuário de A vê globais + A, **nunca** B; e a IA de A **nunca** cita POP de B.

---

## 7. Data Contract

### 7.1 Prisma (novo) *(categorias cortadas — M8)*

```prisma
enum PlaybookKind {
  POP          // conteúdo markdown no app
  BIBLIOTECA   // ficha no app + arquivo no Drive
}

model Playbook {
  id           String       @id @default(cuid())
  kind         PlaybookKind @default(POP)
  title        String
  body         String                          // POP: markdown | BIBLIOTECA: ficha
  externalUrl  String?                         // obrigatório quando kind=BIBLIOTECA (https only)
  isArchived   Boolean      @default(false)
  tags         String[]     @default([])

  // --- multi-tenant: null = GLOBAL Defenz; setado = por-empresa ---
  companyId    String?
  company      Company?  @relation(fields: [companyId], references: [id], onDelete: Restrict)

  // --- FRESCOR ---
  ownerId            String?
  owner              User?     @relation("PlaybookOwner", fields: [ownerId], references: [id], onDelete: SetNull)
  verifiedAt         DateTime?
  verifiedById       String?
  verifiedBy         User?     @relation("PlaybookVerifier", fields: [verifiedById], references: [id], onDelete: SetNull)
  reviewIntervalDays Int?      @default(90)     // null = evergreen
  reviewDueAt        DateTime?                  // setado na CRIAÇÃO e em cada verify
  reviewReminderSent Boolean   @default(false)

  createdById  String?                          // nullable + SetNull: deletar autor não trava (cf. dor do AuditLog FK)
  createdBy    User?     @relation("PlaybookCreator", fields: [createdById], references: [id], onDelete: SetNull)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([companyId, isArchived])
  @@index([kind, isArchived])
  @@index([ownerId])
  @@index([reviewDueAt, reviewReminderSent])
  @@map("playbooks")
}
```

**Back-relations obrigatórias** (senão `prisma validate` falha): em `Company` → `playbooks Playbook[]`; em `User` → `playbooksOwned`, `playbooksVerified`, `playbooksCreated` com os nomes de relação acima.

### 7.2 Rotas (Zod em `src/lib/validations/playbook.ts`)

| Rota | Método | Nota | Fase |
|---|---|---|---|
| `/api/portal/playbooks` | GET, POST | listar (scoped + filtros `kind`/tag/arquivado/`q`, `take` obrigatório) / criar | F1 |
| `/api/portal/playbooks/[id]` | GET, PUT, DELETE | ler / editar (regra editou-sem-ser-dono + validação do estado mergeado) / arquivar | F1 |
| `/api/portal/playbooks/[id]/verify` | POST | verificar (reseta relógio + `reviewReminderSent`) | F1 |
| `/api/portal/ask` | POST | `{ question, mode }` → `{ answer, citations[], sources[], webEnabled }` | F4/F5 |

### 7.3 Env vars novas

```
N8N_PORTAL_WEBHOOK_URL       # webhook da pesquisa externa/web (F5)
N8N_PORTAL_WEBHOOK_SECRET    # header compartilhado; o webhook rejeita sem ele
N8N_ONEDRIVE_WEBHOOK_URL     # webhook de leitura do OneDrive via Graph (F3) — listar/baixar
N8N_ONEDRIVE_WEBHOOK_SECRET  # header compartilhado
PORTAL_GEMINI_MODEL          # default 'gemini-3-flash-preview' (mesmo do relatório executivo)
```
`GEMINI_API_KEY` já existe. Sem as do n8n → a capacidade correspondente aparece **desabilitada com explicação** (`webEnabled: false` / Biblioteca sem sync), e o resto do Portal segue funcionando. **Nenhuma credencial Microsoft entra na Vercel** — ela fica no n8n (`Marcos@Defenz`, `tuFzJdPvNnOt3TD3`).

---

## 8. Fases

| Fase | Entrega | DoD |
|---|---|---|
| **F1 · Fundação POPs** ✅ **IMPLEMENTADA (05/08, local)** | model + `db push`, `scopedPlaybookWhere`, CRUD, verify, busca `contains`, frescor no cron, nav + aba POPs, `<PortalMarkdown>` | ✅ 711 testes, `tsc`+`build` verdes, smoke ao vivo OK · ⚠️ **R1 (hotlink Drive) ainda pendente** — precisa de 1 print real do Marcos |
| **F2 · Conteúdo** | migrar **3–5 POPs reais de operação Bitdefender** (D6) + fallback de imagem quebrada | um POP com print renderiza pra um segundo usuário |
| **F3 · Biblioteca + OneDrive** | webhook n8n de leitura (auth de header + **allowlist na raiz D2c**), sync da pasta → fichas `kind=BIBLIOTECA`, botão "Abrir no OneDrive", `/api/portal/image-proxy` via `downloadUrl`, aba nova | arquivo posto na pasta aparece no Portal e é achado pela busca; caminho fora da raiz é **rejeitado no n8n** |
| **F4 · IA interna** | `src/lib/portal/ask.ts` **novo** (não reusa `src/lib/ai/`), retrieve scoped → Gemini → resposta com citações validadas | pergunta real responde citando o POP certo; sem POP → admite que não sabe |
| **F5 · IA web (n8n)** | webhook + secret + Zod estrito + `maxDuration` + timeout + fallback | n8n fora do ar não quebra o Portal |

**R1 subiu pra F1** *(recomendação do crítico)*: o smoke test do hotlink custa cinco minutos e zero código, e o resultado decide se `body` guarda URL do Drive ou se precisa de `/api/portal/image-proxy` **desde o começo**.

---

## 9. Acceptance Criteria

- [ ] `scopedPlaybookWhere`: usuário vê globais + sua(s) empresa(s), **nunca** outra (sad path). Teste específico: **filtro com `OR` não engole o escopo**.
- [ ] Render markdown seguro: `<script>` não executa, `javascript:` em link/imagem é cortado pelo `urlTransform`.
- [ ] Busca acha por termo no **corpo**, não só no título; payload leve; stale primeiro.
- [ ] `reviewDueAt` nasce **na criação**; os 3 estados de frescor aparecem corretos.
- [ ] Verify grava `verifiedAt/verifiedById/reviewDueAt` e reseta `reviewReminderSent`; ciclo verify→stale→email→re-verify→stale→email (2ª vez) funciona.
- [ ] Editar sendo ≠ owner zera `verifiedAt`.
- [ ] PUT parcial: validação sobre estado mergeado; AuditLog **não** loga campo ausente como `→ null`.
- [ ] `kind=BIBLIOTECA` exige `externalUrl` https (sad path 400); link com `rel="noopener noreferrer"`.
- [ ] Imagem quebrada mostra placeholder explícito.
- [ ] IA interna cita a fonte, **admite quando não sabe**, e **descarta citação fora do set recuperado**.
- [ ] IA web: sem env var → `webEnabled:false` + UI explica; n8n fora → mensagem clara; `maxDuration` declarado.
- [ ] `/api/portal/ask` rate-limited com chave por **usuário**; caps de tamanho aplicados.
- [ ] Todo `findMany` com `take`; `orderBy` determinístico.
- [ ] Bump de `CACHE_NAME` em `public/sw.js` (§9.8 do GUIA).
- [ ] `npm run build && npx tsc --noEmit && npm test` verdes; TDD proporcional (1 happy + 1 sad por endpoint/helper).

---

## 10. Technical Decisions

- **Reuso verificado:** `companyScopeWhere`/`assertCompanyAccess` (`src/lib/auth.ts:89`/`:69`), `createAuditLog`/`diffChanges` (`src/lib/audit.ts`), `checkRateLimit` (`src/lib/rate-limit.ts:26`), `handleApiError`/`successResponse` (`src/lib/api-helpers.ts`), cron `/api/cron/reminders`, Resend.
- ⚠️ **`src/lib/ai/` NÃO é reusado.** É **dead code**: nenhum arquivo em `src/` o importa; é específico de `ActivityInput → ActivityAnalysis` e travado em `gemini-1.5-*` (aposentados). O padrão vivo é `src/app/api/report/executive/route.ts:138-139` — client direto + `gemini-3-flash-preview`. F4 escreve `src/lib/portal/ask.ts` novo, com o modelo em env var. *(C1 — a v1 afirmava o contrário; era falso.)*
- **Deps já no `package.json`, com zero uso em `src/`:** `react-markdown@10`, `remark-gfm@4`, `dompurify@3`, `isomorphic-dompurify@2`, `@google/generative-ai@0.21`. **`rehype-sanitize` não está instalado** — e, com a decisão do `urlTransform`, **não precisa**.
- **Sem SQL raw, sem GIN no MVP** (§3.2).
- **Schema no Neon:** `db push`. ⚠️ **dev = prod** (ADR-008) — atinge produção.
- **Nav:** novo item de topo em `src/app/dashboard/layout.tsx` (padrão dos dropdowns Demandas ~199 / Service Desk ~241).

---

## 11. Riscos abertos

| # | Risco | Mitigação |
|---|---|---|
| ~~R1~~ | ~~Hotlink bloqueado → POP sem imagem~~ | ✅ **RESOLVIDO por D2b (05/08).** Com Graph via n8n a imagem não depende de hotlink: o proxy busca o `@microsoft.graph.downloadUrl` e serve os bytes. O risco deixou de existir. |
| R7 | **Webhook do Portal no n8n vira porta dos fundos** para o OneDrive da empresa | Auth de header obrigatória + **allowlist de caminho** (o app só pede caminhos sob a raiz do Portal, nunca caminho arbitrário) + só leitura. Critério de aceite da F3. |
| R2 | **IA interna alucinar procedimento** | Prompt obriga citação; sem contexto → admite não saber; citações validadas contra o set; teste dedicado |
| R3 | **Portal nasce vazio** | D5: 3–5 POPs reais na F2 |
| R4 | **n8n como dependência externa** | Timeout + fallback + Interno independente |
| R5 | **Custo de Gemini** | Rate-limit por usuário + caps de tamanho. 📌 **Limitação conhecida:** o rate-limit é `Map` em memória do lambda — não há teto **global** em serverless. Se virar problema real, contador durável no Postgres |
| R6 | **DELETE de Company com POPs** → erro 400 genérico | 📌 aceito; mensagem específica fica fora do MVP |

---

## 12. Fora do MVP

Categorias (`tags[]` resolve nesta escala) · grupo "Portal" no Cmd+K (exigiria subir o `SearchCommand` de `dashboard/demandas/page.tsx` pro layout) · índice GIN/full-text `portuguese` · cliente enxergando conteúdo · versionamento com diff (o `AuditLog.changes` cobre) · vínculo POP ↔ Demanda · tool de MCP · log de buscas sem resultado · templates instanciáveis · verificador = Team · sync automático do Drive (rclone) · embeddings/pgvector.

---

## 13. Invariantes herdadas

Vale integralmente a checklist **§9 do `service-desk-GUIA.md`** — tenant isolation, fuso SP, sem erro silencioso na UI, `take`/cap, AuditLog (incl. o bug do PUT parcial), PWA/SW, superfície pública, gate `build`+`tsc`+`test`, revisão adversarial multi-agente antes do deploy.

## 14. Próximos passos

1. ✅ D1–D6 + D2b/D2c fechadas (05/08) · ✅ spec v1 · ✅ revisão adversarial · ✅ spec v2 · ✅ mockup aprovado
2. ✅ **F1 implementada** (commit `ef97882`, local) — 711 testes, smoke ao vivo OK
3. ✅ **OneDrive validado ponta a ponta** — leitura via Graph com a credencial do n8n; raiz do Portal confirmada
4. ⏳ **F2 · Conteúdo** — 3–5 POPs reais de operação Bitdefender (D6). Depende do Marcos indicar quais.
5. ⏳ **F3 · Biblioteca + OneDrive** — webhook de leitura + sync da raiz D2c + image-proxy.

> 🧪 **Item de teste vivo no banco:** `[TESTE ONEDRIVE] KPIs de gestão à vista — Defenz` (global, `companyId=null`), carregado a partir de `KPIs_GESTAO_VISTA_V1.docx`. **Marcos pediu para manter por enquanto** — não apagar sem confirmar com ele.
