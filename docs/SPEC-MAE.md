# SPEC MÃE — Defenz To-Do, ponta a ponta

**Versão:** 1.1 · **Revisada adversarialmente em 2026-08-09** (dois revisores: precisão factual e lacunas de uso)
**Escopo:** o produto inteiro. Supersede [`SPEC.md`](SPEC.md) (v0.2.0, abril, cobria só Demandas).
**Guias-filhos vivos:** [`service-desk-GUIA.md`](features/service-desk-GUIA.md) · [`feature-portal-defenz.md`](features/feature-portal-defenz.md) · [`feature-portal-proposta.md`](features/feature-portal-proposta.md)

---

## 0. O que muda seu comportamento no primeiro minuto

**Um banco só.** Dev e produção usam o mesmo Neon (ADR-008). Não existe base de
desenvolvimento. Rodar seed, script ou `db push` na sua máquina **escreve em
produção**.

**E o deploy também mexe no schema.** O `vercel-build` é
`prisma generate && prisma db push --skip-generate && next build` — ou seja, o schema
do commit que você deployar vira o schema de produção. Duas consequências que não são
óbvias:

> ⚠️ **Rollback é `git revert` + push, NUNCA redeploy de commit antigo.** Redeployar
> um commit anterior faz o build empurrar o schema **velho** contra o banco novo: sem
> `--accept-data-loss` o build quebra; com ele, apagaria tabelas.

> ⚠️ **Antes de qualquer `db push`, rode o diff** (§8) e leia o que ele vai fazer.
> Aditivo é seguro. Renomear, remover ou trocar tipo de coluna que o código deployado
> lê **quebra a produção na hora, sem deploy nenhum**.

**Estado hoje (13/08):** produção e `main` estão **em dia** — os 42 commits do lote
Service Desk + Portal + Ana + Proposta subiram. Confira sempre, nunca confie em número
escrito aqui:

```bash
git log --oneline origin/main..main | wc -l   # commits não deployados
git status --short                            # trabalho em voo
```

`defenz-todo.vercel.app` roda hoje o produto inteiro: kanban, Service Desk, Portal
(POPs, Biblioteca, Ana) e Proposta. O deploy de 13/08 foi precedido do diff de schema
contra `origin/main` — puramente aditivo, 2 enums e 7 tabelas, nenhum `DROP` — e o
build aplicou tudo sem incidente.

### 0.1 Quem é fonte de verdade de quê

Cinco documentos, cinco papéis. Se dois discordarem, vale esta tabela.

| Documento | Dono de | Muda quando |
|---|---|---|
| **SPEC-MAE.md** (este) | o produto inteiro, invariantes, decisões transversais, runbook | uma decisão muda |
| **PROGRESS.md** | onde parei, o que faço amanhã, blockers do dia | toda sessão |
| `features/<slug>.md` | o detalhe **e o estado** de uma feature | aquela feature anda |
| CHANGELOG.md | o que já foi feito | a cada entrega |
| ARCHITECTURE.md | os ADRs | uma decisão arquitetural nasce |

**Regra derivada:** estado por feature mora na spec-filha; esta spec **só linka**.
Duplicar estado aqui cria dois lugares para desatualizar — foi o que aconteceu com as
pendências da Proposta, escritas em três arquivos ao mesmo tempo.

---

## 1. O que é o produto

Uma plataforma interna da Defenz que começou como kanban de demandas e virou três
coisas com o mesmo login, o mesmo multi-tenant e o mesmo banco:

1. **Demandas** — o kanban de trabalho, hoje também o livro-razão de horas das frentes.
2. **Service Desk** — tickets e solicitações, para sustentar a oferta de suporte 8x5.
3. **Portal Defenz** — o conhecimento da casa: POPs, Biblioteca, a IA (Ana) e a **Proposta comercial**.

Usuários: o time da Defenz (vendas, operação, gerência) e — em **uma única superfície
pública**, `/abrir-ticket` — o cliente final abrindo chamado.

---

## 2. Estado por módulo

Contagens envelhecem; comandos não. Para números atuais: `npm test`,
`find src/app/api -name route.ts | wc -l`.

| Módulo | Implementado | Em produção | Observação |
|---|---|---|---|
| Demandas (kanban, subtarefas, links, import) | ✅ | ✅ | núcleo maduro |
| Multi-empresa (`Company`/`Team`/`UserCompany` N:N) | ✅ | ✅ | admin cruza; demais hard-scoped |
| Auth invite-only + roles | ✅ | ✅ | NextAuth v4, JWT, sem signup aberto |
| Audit log | ✅ | ✅ | ⚠️ incompleto e com bug — §5 I6, §6 |
| Horas (`TimeEntry`, delta-on-save) | ✅ | ✅ | `/dashboard/demandas/horas` |
| API Bearer + MCP `defenz` | ✅ | ✅ | 8 tools, todas em produção desde 13/08 |
| Relatório executivo (Gemini) | ✅ | ✅ | |
| Reminders por e-mail (cron) | ✅ | ⚠️ **morto** | `CRON_SECRET` não existe na Vercel; o guard falha fechado, então o cron toma 401 todo dia às 11:00 UTC e **nenhum lembrete jamais saiu**. Desligado de propósito por ora (Marcos, 12/08) |
| **Service Desk F1** (Kanban v2) | ✅ | ✅ | deployado 13/08 |
| **Service Desk F2** (portal `/abrir-ticket`) | ✅ | ✅ | live; falta o subdomínio `suporte.` + DNS |
| **Service Desk F3** (notificações) | ❌ | ❌ | "Futuro" no GUIA |
| **Service Desk F4** (sync Zoho) | ❌ | ❌ | só o seed "Cliente Teste" |
| **Service Desk F5** (SLA, horário comercial, CSAT) | ❌ | ❌ | "Futuro" no GUIA |
| **Portal F1** (POPs + frescor) | ✅ | ✅ | 22 playbooks respondendo em prod; ⚠️ R1 do hotlink do Drive nunca testado |
| **Portal — Biblioteca** | ✅ | ✅ | 14 fichas à mão; nada re-sincroniza |
| **Portal — Ana** (A1/A2/A3) | ✅ | ✅ | `GEMINI_API_KEY` criada 13/08; modo web (A4) pendente |
| **Portal — Proposta F1–F5** | ✅ | ✅ | ⚠️ geração de PDF (Chromium em Lambda) **ainda não exercitada em prod** — é o único caminho não coberto pelo smoke; F5 inerte sem o webhook do n8n |
| Playbooks/Manuais (spec antiga) | — | — | **absorvido pelo Portal**; spec morta |
| CRM, métricas M&A, AI Insights | arquivado | — | schema presente, UI fora — §3.2 |

> ⚠️ **"F5" é ambíguo:** Service Desk F5 = SLA/CSAT; Proposta F5 = arquivamento no
> OneDrive. Sempre qualifique.

---

## 3. Arquitetura

### 3.1 Seis regras

1. **Multi-tenant por conjunto.** `admin` vê tudo; `gerencia`/`user` enxergam
   `[companyId primária, ...UserCompany]`. Helpers em `src/lib/auth.ts`:
   `accessibleCompanyIds`, `companyScopeWhere`, `resolveActiveCompany`, `assertCompanyAccess`.
2. **Escopo combina por `AND`, nunca por spread.** Um filtro com `OR` próprio (busca
   em título OU corpo) espalhado sobre a cláusula de tenant **engole o escopo em
   silêncio** — sem erro, sem teste que pegue. Já quase aconteceu (C3 do review do
   Portal). Monte `{ AND: [escopo, ...filtros] }`.
3. **Contrato de rota único:** `handleApiError` / `successResponse` / `ApiError` +
   Zod em `src/lib/validations/`.
4. **Dois modos de auth que não se misturam.** Rotas de dados aceitam sessão **ou**
   Bearer (`resolveActor`). Rotas que emitem documento comercial ou consomem LLM em
   nome da Defenz — `/api/portal/ask`, `/api/portal/propostas` — aceitam **só sessão**
   (`getCurrentUser`): token de serviço permanente que gera proposta é exposição sem rastro.
5. **LLM interpreta, JS calcula.** Nenhum número que vai para cliente sai de modelo.
6. **Banco único Neon.** Ver §0.

### 3.2 Modelo de dados — o que é vivo e o que é cemitério

O `schema.prisma` tem ~38 modelos e **metade é morta**. Saber quais ignorar economiza
horas.

**Vivos:** `Company` · `Team` · `UserTeam` · `UserCompany` · `User` · `Demanda` ·
`Subtask` · `DemandaLink` · `TimeEntry` · `AuditLog` · `InviteToken` · `ApiToken` ·
`NotificationPreferences` · `EmailLog` · `Ticket` · `TicketMessage` ·
`AuthorizedClient` · `TicketSequence` · `Playbook` · `Proposta` · `PropostaSequence`.

**Mortos** (não usar; não apagar sem migration deliberada): `Client` · `Opportunity` ·
`Interaction` · `Activity` · `ActivityComment` · `ActivityInsight` · `DailyActivityLog` ·
`MarketingList` · `BusinessMetric` · `FinancialMetric` · `CustomerMetric` ·
`EngagementMetric` · `ProductHealthMetric` · `SalesMetric`.

### 3.3 Onde mora o quê

| Assunto | Caminho |
|---|---|
| Auth, tenant, escopo | `src/lib/auth.ts`, `auth-config.ts` |
| Contrato de rota, validação | `src/lib/api-helpers.ts`, `src/lib/validations/` |
| Demandas | `src/app/dashboard/demandas/`, `src/app/api/demandas/` |
| Horas | `src/lib/time-entries*.ts`, `src/lib/duration.ts` |
| Service Desk | `src/lib/{tickets-server,service-desk-server,service-desk-config,service-desk-badge}.ts`, `src/app/dashboard/service-desk/`, `src/app/api/{tickets,service-desk,public/tickets}/` |
| Portal — POPs/Biblioteca | `src/lib/playbook-{scope,freshness}.ts`, `src/app/dashboard/portal/`, `src/app/api/portal/playbooks/` |
| Portal — Ana | `src/lib/portal/{ask,retrieve,ana-persona}.ts`, `src/app/api/portal/ask/` |
| Portal — Proposta | `src/lib/proposta/` (`tabela-precos`, `calculo`, `numeracao`, `pdf`, `arquivamento`, `proposta-server`, `templates/`, `assets/`) |
| MCP | `mcp/defenz-mcp/` (toolchain própria, **fora** do vitest da raiz) |
| Scripts operacionais | `scripts/` |
| ⚠️ Dead code | `src/lib/ai/` — o pipeline da Ana vive em `src/lib/portal/` |

---

## 4. Os módulos que ainda não estão em produção

### 4.1 Service Desk
Guia mestre: [`service-desk-GUIA.md`](features/service-desk-GUIA.md) — **ler antes de
tocar qualquer coisa de SD.** Kanban de 3 colunas com DnD, WIP soft e aging
verde→âmbar→preto; portal público `/abrir-ticket` que valida CNPJ+e-mail contra
`AuthorizedClient` e devolve protocolo atômico `SD-2026-000001`; "Abrir Demanda" 1:1.
**Falta:** subdomínio `suporte.defenz.com.br` (host-rewrite + DNS hoje na YCORN),
sync do Zoho, e o deploy.

### 4.2 Portal Defenz
Quatro abas: **POPs · Biblioteca · IA Defenz · Propostas**.
- **POPs** — markdown no app; o diferencial é o **frescor**: todo POP tem dono e prazo,
  vencido muda de cor e o dono recebe e-mail. 6 rascunhos publicados com prefixo
  `[RASCUNHO]`, esperando validação.
- **Biblioteca** — 14 fichas apontando para o OneDrive, criadas à mão. **Nada
  re-sincroniza sozinho.**
- **Ana** — Gemini 3.6 Flash (`ANA_MODEL`). Retrieve em JS (termos sem acento +
  ranking), contexto repartido por *max-min fair share*, citações validadas contra o
  conjunto recuperado, admite quando não sabe. Modo web (A4) aparece desabilitado —
  hoje o motivo está só num `title` de hover, o que é fraco para I4/I11.

### 4.3 Proposta comercial
Spec e estado detalhado: [`feature-portal-proposta.md`](features/feature-portal-proposta.md) §15.

Botão sempre à mostra → formulário curto → **confirmação que mostra o preço antes de o
documento existir** → PDF A4 impresso por Chromium headless a partir de HTML
versionado → registro numerado, buscável e reimprimível.

**O achado que a justificou, e sua reviravolta:** o unitário mensal da terceira coluna
dividia o preço de 3 anos por **48** meses em toda proposta já enviada. Parecia erro de
conta — e a spec-filha o tratou assim até 12/08, quando o Marcos esclareceu que é a
oferta **36+12**: paga 36 meses, cobre 48. A conta estava certa; **o rótulo é que
mentia**, dizendo "36 meses". Hoje a coluna se chama "36+12 meses", o documento explica
o bônus, e o código separa `anos` (o que se paga) de `mesesCobertura` (o que divide).
A lição que fica: *um número que parece errado pode ser um rótulo errado — confirme a
intenção comercial antes de "corrigir" a aritmética.*

> ⚠️ **É estruturalmente MONOPRODUTO.** Existe um `enum PropostaTipo`, mas o
> acoplamento é profundo: `quantidade` é validada em 5–999 *porque é o alcance da
> tabela Bitdefender*, `planos` é o enum das 3 SKUs GravityZone, `FAIXAS` são faixas de
> licença e o `precoSnapshot` tem forma de investimento por plano×vigência. Um segundo
> tipo (MDR) exige generalizar `createPropostaSchema`, `tabela-precos.ts`, `calculo.ts`
> e um template novo — **e está bloqueado antes disso:** o modelo
> `proposta-mdr-defenz.pptx` vive no OneDrive do Fernando, fora da pasta do Portal.
> Decisão de produto pendente: propostas MDR consomem a mesma numeração `DFZ-`?
> (o `PropostaSequence` é um contador único, não por tipo).

---

## 5. Invariantes — as classes de bug já pagas

Toda feature nova herda esta lista. **Esta seção é a dona das invariantes do projeto**;
a §9 do `service-desk-GUIA.md` guarda só o que é específico de ticket.

Marcadas com 🎯 as que o código **cumpre**; com ⚠️ as que são **meta, ainda não realidade**.

| # | Invariante | Estado |
|---|---|---|
| I1 | **Tenant isolation em toda rota que toca dado scoped** | 🎯 gerência já editou usuário de outra empresa uma vez |
| I2 | **Escopo por `AND`, nunca spread** | 🎯 |
| I3 | **Fuso é São Paulo, não UTC** | 🎯 data aparecia um dia antes |
| I4 | **Sem erro silencioso na UI** — a tela diz por que o backend recusou | 🎯 |
| I5 | **`take`/cap em toda listagem** | 🎯 fechada em 12/08. Portal 200; `users`/`teams`/`companies`/`invites` 500; relatório executivo 500 (vira prompt do Gemini); board 2000 **com tripwire** — truncar kanban em silêncio some com card, então além do log o cliente recebe `X-Demandas-Truncated` e a UI pode avisar |
| I6 | **AuditLog em toda mutação de Demanda** (ADR-003) | 🎯 fechada em 12/08 para Demanda: o `import` passou a usar `createManyAndReturn` e gravar um log por linha (`action: 'IMPORT'`). ⚠️ Fora de Demanda ainda falta: `teams`, `companies`, `user/profile` não logam |
| I7 | **PWA/SW:** `CACHE_NAME` sobe a cada release **e** o SW não é registrado na superfície pública | 🎯 manual, sem teste que force. Hoje `defenz-v5` em `public/sw.js` |
| I8 | **Superfície pública é uma só** (`/abrir-ticket`) e é burra: 422 uniforme anti-enumeração, honeypot, rate-limit | 🎯 |
| I9 | **Nenhum número que vai para cliente sai de LLM** | 🎯 o ÷48 |
| I10 | **Recurso de documento é embutido, nunca buscado na rede** | 🎯 fonte que não carrega gera PDF quebrado *em silêncio* |
| I11 | **Aba morta é promessa quebrada** — só entra no menu o que leva a tela viva | 🎯 |

---

## 6. Riscos, pendências e dívida

### Decisões que só o Marcos pode tomar
1. ⚠️ **VALIDADE-DA-TABELA — qual tabela de preço vale.** Arquivo "Dez.2026", capa 2024, corpo
   29/11/2024. Carimbado `2024-11-29`. **Bloqueia mandar proposta para cliente real.**
2. ✅ **RESOLVIDO em 12/08 — a coluna virou 36+12.** Era a pergunta "por que o
   destaque em crimson aponta para a opção mais cara por mês?". Resposta: porque não
   é. Com os 12 meses de bônus explícitos, a coluna longa é a mais barata por mês em
   **todas** as faixas, e o destaque volta a fazer sentido. ⚠️ **O que passou a valer:**
   o 36+12 é promessa contratual em toda proposta emitida — os 12 meses extras
   precisam existir no contrato com a SecuriSoft ou ser custo absorvido.
3. **Validar os 6 POPs `[RASCUNHO]`** — cada um tem uma seção "⚠️ a confirmar".
4. **Deploy:** o que sobe primeiro, e quando.

### Dívida técnica
- ✅ **AuditLog em PUT parcial — CORRIGIDO em 12/08.** `diffChanges` agora ignora campo
  ausente do payload (checa a **presença da chave**, então `{assignee: null}` explícito
  continua sendo registrado). Verificado ao vivo: um PUT só de `status` grava só
  `status`, e não as seis mudanças fantasma de antes. O diff de objetos completos em
  `PUT /api/tickets/[id]` **fica**, e virou o padrão: `PUT /api/demandas` adotou o
  mesmo. É o que captura o que o servidor deriva sozinho — ao reabrir uma demanda
  concluída, `dateDone` é limpo, `dateStarted` é setado e a descrição ganha "Reaberta
  em …" sem nada disso vir no body. Diffar só o payload deixaria a auditoria muda
  exatamente na mudança mais relevante (pego na revisão do próprio fix).
- ✅ **`demandas/import` grava AuditLog** (12/08) — `createManyAndReturn` + um log por
  linha com `action: 'IMPORT'`. Ganhou também teto de 1000 itens por lote.
- ⚠️ **Fora de Demanda ainda não há audit:** `teams`, `companies`, `user/profile`.
- **`prisma/migrations/` existe mas o projeto usa `db push`.** As 5 migrations estão
  arbitrariamente atrás do banco. **Não rode `migrate deploy`** sem reconciliar antes
  — e a Fase 2 do `assignee-fk`, escrita em cima de `migrate`, precisa ser reescrita
  em `db push` ou o histórico precisa ser baselined.
- **`assignee-fk` Fase 2** nunca rodou em prod. Sem regressão parada: o código tem
  fallback por string.
- **`src/lib/ai/` é dead code.**
- **R1 do Portal** — hotlink de imagem do Drive nunca testado; precisa do Marcos subir
  um print. Hoje o `<PortalMarkdown>` mostra placeholder explícito.
- **`[TESTE ONEDRIVE] KPIs`** (19k chars) polui o ranking da Ana.
- **README.md stale** (fala Next.js 15 / SQLite / "Activity"). Os 7 `.md` obsoletos da
  raiz foram para `docs/archive/`; `LEARNINGS.md` é válido.
- **`prisma/dev.db*`** são resquício do SQLite (gitignorados, inofensivos).

### Variáveis de ambiente ausentes em produção (conferido em 12/08)
- **`CRON_SECRET`** — sem ela o cron de lembretes é 401 diário. **Decisão do Marcos: fica assim
  por enquanto**, e-mail de lembrete não é prioridade. Quando for, criar a var **antes** de
  anunciar a feature como viva.
- **`EMAIL_FROM` / `EMAIL_FROM_NAME`** — o que sai hoje usa o fallback `onboarding@resend.dev`,
  não um endereço `@defenz.com.br`.
- **`GEMINI_API_KEY`** — sem ela a Ana sobe respondendo erro. ⚠️ Mudança de env var na Vercel
  **só vale no próximo deploy**: criar a variável ANTES do push, senão são dois deploys.

### Dependências externas que não existem
Quatro webhooks de n8n, todos o mesmo tipo de trabalho: **arquivar proposta** no
OneDrive · **sync da Biblioteca** · **Ana modo web** · **sync do Zoho** para
`AuthorizedClient`.

---

## 7. Roadmap

**Marco 1 — fechar a Proposta.** VALIDADE-DA-TABELA respondida → decisão do destaque dos 36 meses → deploy.
**Marco 2 — colocar em produção o que já existe.** Ver o runbook (§8.2).
**Marco 3 — o que depende do n8n.** Os quatro webhooks rendem mais feitos juntos.
**Marco 4 — fechar pontas.** POPs validados · subdomínio `suporte.` · AuditLog
(bug + import) · caps de listagem · Fase 2 do assignee-fk · README.

---

## 8. Operação

### 8.1 Do zero

```bash
npm ci            # exige .npmrc com legacy-peer-deps=true (ADR-007)
cp .env.example .env
```

⚠️ **O `DATABASE_URL` aponta para o Neon de PRODUÇÃO** — não existe banco de dev
(ADR-008). O `prisma/dev.db` que você vê é lixo de 2025.
Para gerar PDF em dev é preciso **Chrome instalado** (ou `CHROME_EXECUTABLE_PATH`).
**Login é invite-only, sem signup** — peça um convite ao Marcos.

```bash
npm run dev                                       # "subir" = localhost:3000, nunca deploy
npm run build && npx tsc --noEmit && npm test     # gate obrigatório antes de "done"
npx tsx scripts/smoke-proposta-pdf.ts saida.pdf   # PDF da proposta sem tocar no banco
npx prisma migrate diff --from-schema-datasource prisma/schema.prisma \
  --to-schema-datamodel prisma/schema.prisma --script   # ⚠️ SEMPRE antes de db push
```

**Armadilhas de teste:**
- Todo `*.test.tsx` novo precisa do docblock `// @vitest-environment jsdom`. O
  `environmentMatchGlobs` do config não vale mais no Vitest 4.
- `mcp/**` está **excluído** do vitest da raiz — os testes do MCP rodam dentro de
  `mcp/defenz-mcp/`. A contagem da suíte principal não os inclui.
- `npm run build` roda `prisma generate` antes, então o gate depende do `DATABASE_URL`.

### 8.2 Deploy

**Deploy = `git push` para `main`.** A Vercel auto-deploya. Não há botão.

1. **Gate verde** e árvore de trabalho limpa (`git status`).
2. **Conferir o diff de schema** (§8.1) — o build vai aplicá-lo em produção.
3. **Env vars presentes na Vercel** antes do push: `DATABASE_URL`, `DIRECT_URL`,
   `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `CRON_SECRET`, `GEMINI_API_KEY`, `ANA_MODEL`,
   `RESEND_API_KEY`/`EMAIL_FROM`. Os `N8N_*` são opcionais — sem eles as features
   ficam **inertes por design**, não quebradas.
4. **Subir o `CACHE_NAME`** em `public/sw.js` (I7).
5. **Push.**
6. **Smoke autenticado depois:** `/dashboard/service-desk` · `/dashboard/portal` ·
   **gerar uma proposta de ponta a ponta** — é o único caminho que exercita o Chromium
   em Lambda, e o que tem mais chance de falhar só em produção.

⚠️ **Rollback é `git revert` + push.** Nunca redeploy de commit antigo (§0).
⚠️ **Se o PDF falhar em produção**, o primeiro botão é memória/duração da função:
`vercel.json` → `functions` (o path para projeto com `src/` é
`src/app/api/portal/propostas/route.ts`; um glob que não casa **quebra o build**, então
confirme no log). O `maxDuration = 120` já vem do próprio route handler.
⚠️ **A chave do Gemini precisa de teto de gasto:** o `checkRateLimit` roda em memória
do lambda e **não segura custo**.

**Vocabulário do Marcos:** "subir" = `npm run dev`. Horas em relógio (1.15 = 1h15).

---

## 9. ADRs

ADR-001..008 em [`ARCHITECTURE.md`](ARCHITECTURE.md) (multi-tenant, invite-only, audit,
pgbouncer, Zod, Gemini, NextAuth, **banco único**). SD-ADR-001..007 no guia do Service
Desk. ADR-009..012 (Gemini na Ana, PDF via Chromium, OneDrive em vez de Blob,
reimprimir do snapshot) também em `ARCHITECTURE.md`.
