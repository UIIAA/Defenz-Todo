# PROGRESS — Defenz To-Do

**Last updated:** 2026-08-23
**Version:** 0.4.0
**Branch:** main

## 🎯 RETOMAR AQUI — apresentação de soluções Bitdefender + Defenz

> **23/08 · 4 commits LOCAIS no `main`, NADA DEPLOYADO.** 873 testes verdes.
> ⚠️ **O fix do tique (`55d9fb2`) só chega ao cliente no próximo push** — até lá, quem
> gerar apresentação em produção recebe a tabela dos níveis **sem nenhum tique**.
>
> **R8 RESOLVIDO** (spec §6.2.1), medido contra a API: `googleSearchRetrieval` leva **400**
> no `gemini-3.6-flash`; a forma certa é `tools: [{ googleSearch: {} }]`, que só existe no
> `@google/genai`; e os *typings* de resposta do SDK legado têm quatro nomes com typo que
> devolvem `undefined` **sem erro**. **A F3 começa migrando o SDK.**
>
> ⚠️ **As duas chamadas viraram obrigatórias por um motivo pior que a C1 previa:**
> `googleSearch` + `responseSchema` devolve **200, JSON perfeito e `groundingMetadata`
> ausente** — caso plausível, com veículo, validando no Zod, e nenhuma atribuição.
>
> **Os dois dados fortes entraram** (único fabricante + TCO), como exceção declarada da A15
> (§7.3.2-bis), **com a redação corrigida pelo relatório primário**: "único a prevenir os 50
> cenários" é **falso como o anúncio escreve** (os 12 previnem 50/50; o exclusivo é a 1ª
> fase), e o TCO é **9,7×**, não 9,8×.
>
> **Feature nova especificada:** [`feature-calculadora-tco.md`](features/feature-calculadora-tco.md)
> — ebook + calculadora para empresas de TI. **DRAFT v2**, aguarda Q6/Q7/Q8. A v1 foi
> reescrita depois de eu olhar o `defenz.com.br`: o site é **Apache + SPA React estática** e o
> backend **já é o n8n**, com uma cotação funcionando (PDFShift → Resend → Zoho → Sheets →
> Outlook). A v1 teria construído um segundo caminho de lead ao lado de um que já funciona.
> ⚠️ **Q6 é bloqueante:** há **três cópias do site no disco**, byte-idênticas, e só
> `defenz-site` tem git confiável.
>
> **F1 da calculadora (`constantes.ts` + `calculo.ts`) não depende de nenhuma resposta** — é
> por onde dá para começar agora.

**Spec v2 escrita e criticada em 20/08.** Documentos:
[`feature-portal-apresentacao.md`](features/feature-portal-apresentacao.md) **v2** ·
crítica adversarial [`feature-portal-apresentacao-review.md`](features/feature-portal-apresentacao-review.md)
(4 críticos corrigidos, 5 médios, 3 menores). Nada implementado ainda.

⚠️ **A v2 mudou o EIXO do produto.** A v1 desenhava um deck técnico-comparativo; o Marcos
corrigiu: **a apresentação técnica já existe e é dele, usada na reunião.** O que falta é a
peça de **antes** — marca, mercado, cases — e ela é **autoexplicativa**: vai por e-mail e é
lida sem apresentador.

**E "case" mudou de significado.** A Defenz **não tem material de case nenhum** (varredura
no OneDrive: só exports do Apollo). Decisão do Marcos: **cases de problema do setor**,
buscados ao vivo, **com a vítima nunca nomeada**, cada um amarrado à necessidade que expõe
e ao recurso que responde. Números de mercado saem de **catálogo curado no repo**
(`mercado-fatos.ts`), nunca de LLM.

**Aguarda:** aprovação + as 3 pendências da §15 (semear o catálogo de mercado, papel mínimo
para gerar, e se o caso pode carregar duração/prejuízo).

⚠️ **Correções que esta seção acumulava e a leitura dos arquivos derrubou:**
- `V9_PARCEIRO_EDITAVEL_SEM_PME.pptx` **não é o modelo** — é o deck do Programa de
  Parceiros/Finder, com **a comissão do canal impressa**. Mandar para cliente final seria
  vazamento comercial. O molde real é `DEFENZ_APRESENTAÇÃO_ESTRATÉGICA.pptx`, que já nasce
  com `[Nome do Cliente] | [Data]` e já tem o slide de objeção "nunca ouvi falar".
- `TECNICO_Bitdefender_Liderança_Global.pdf` (13,5 MB) **não é legível** pelo conector: é
  PDF de imagem, retorna vazio. Não bloqueia — o papel dele está coberto.
- Decisões do Marcos (20/08): **PDF** (não PPTX) · **Gemini com Google Search grounding** ·
  dor pesquisada em **seção própria com fonte citada** · comparativo **fixo com plano
  recomendado destacado**.

<details><summary>Registro original desta seção (antes da spec)</summary>


### O que ele pediu
Um formulário curto → **apresentação institucional Bitdefender + Defenz**, com
**comparativo entre as soluções GravityZone**, para um cliente que **não conhece a
marca**. Palavras dele: *"Pense que num primeiro momento, a pessoa não conhece o
Bitdefender."*

### ⚠️ Antes de desenhar: ler três arquivos
Os materiais **já estão catalogados** na Biblioteca do Portal (tabela `Playbook`,
`kind=BIBLIOTECA`), com caminho no OneDrive em
`ADMINISTRATIVO/ESTRATEGICO_VENDAS/APRESENTAÇÕES/APRESENTAÇÃO_TÉCNICA`:

| Arquivo | Por que importa |
|---|---|
| `V9_PARCEIRO_EDITAVEL_SEM_PME.pptx` | deck de parceiro do fabricante, editável — é "o modelo" que o Marcos disse que ia trazer |
| `defenz_gravityzone_comparativo.pdf` (+ `.docx` na mesma pasta) | o comparativo entre as soluções, montado pela Defenz |
| `TECNICO_Bitdefender_Lideranca_Global_Acao_Brasil.pdf` | a ficha diz literalmente: "reunião com decisor que não conhece a marca / objeção 'nunca ouvi falar'" |

⚠️ **As fichas avisam "conteúdo ainda não indexado"** — temos o ponteiro, não o conteúdo.
**Ler os três é pré-requisito.** Foi assim que a Proposta acertou: o template saiu do
**diff de dois documentos reais**, e a medição derrubou a suposição de que o A4 era o
PPTX exportado. Desenhar sem ler repetiria o erro que já evitamos uma vez.
(O conector do OneDrive caiu no fim da sessão de 13/08; reconectou depois.)

### Decisões em aberto (são do Marcos)
1. **Formato de saída:** PDF, como a Proposta? Ou **PPTX editável**, já que o vendedor
   provavelmente quer ajustar slide antes de apresentar?
2. **O que o formulário pergunta** — e o que é derivado.
3. **Quanto do comparativo é fixo × variável** por cliente.

### O que já existe e dá para reusar
A Proposta é precedente direto e o pipeline está pronto: HTML versionado → Chromium
headless → PDF, com fonte e imagens embutidas, numeração atômica, registro auditável e
log buscável. Ver `src/lib/proposta/` e `feature-portal-proposta.md`.

### Estado do brainstorm
Iniciado com a skill `superpowers:brainstorming` e **interrompido de propósito** para
fazer o deploy. O achado dos três arquivos acima já veio dele.

</details>

---

## ✅ 20/08 — a Proposta está funcionando em produção, ponta a ponta

O PDF **gera de verdade** em produção (era o único caminho que o smoke do deploy não
cobria — e ele quebrou na primeira tentativa do Marcos).

**O que quebrou e como foi resolvido:** a função subiu com o código do navegador e sem o
navegador. `serverExternalPackages` não bastava: o Chromium são 66 MB de `bin/*.br`
abertos **por caminho** em runtime, e o rastreador do Next só segue imports. Fix =
`outputFileTracingIncludes`.

💡 **Técnica que se paga:** dá para conferir o que vai para a função **sem deployar**,
lendo `.next/server/app/api/.../route.js.nft.json`. Foi assim que confirmei 0 → 4
binários antes de subir.

⚠️ **Falha de render queima número de proposta** (a sequência é reservada antes do PDF;
a transação comita mesmo se o render explode). Contador devolvido a 1985 — **a próxima
proposta real sai como `DFZ-2026-01986`**. Inverter a ordem não resolve: o número é
impresso na capa.

### ⚠️ 21/08 — duas remoções no documento, por decisão do Marcos

**1. A página "Alguns dos nossos clientes" saiu, e saiu da base.** Página, arte
(`clientes-bd.png`), constante embutida, função de recorte: tudo apagado. Não foi remoção
de uma linha — `PAGINAS_FIXAS` caiu de 9 para 8, as seções foram renumeradas (Parceria
`05.`→`04.`, Governança `06.`→`05.`) e os rodapés andaram uma casa. **Com 3 planos o
documento passou de 12 para 11 páginas**, conferido no PDF impresso: `Página 02 de 11` até
`Página 10 de 11`, sem buraco.

⚠️ **Morreu junto a pendência da arte de baixa resolução** — não há mais arte a trocar.
E os testes de contagem de página **deixaram de espelhar Buffo e Liquos de propósito**: os
documentos de referência ainda têm a página, o que a Defenz emite não tem. Está comentado
no teste para ninguém "consertar" de volta.

**2. `iOS` e `Android` saíram da página 05.** *"Windows, Linux, Mac, iOS e Android"* virou
**"Windows, Linux e Mac"**. Não é ajuste de texto: o comparativo GravityZone tem 12
funcionalidades e **nenhuma é de mobile** — o documento prometia cobertura de celular que
não está no que o cliente compra. Protegido por teste.

**As duas valem também para as apresentações** (spec da apresentação, A16 e §7.4).

⚠️ **E a remoção quebrou a numeração das seções em produção por ~25 minutos.** As seções
fixas foram renumeradas, mas o **Investimento mora em outra função** e ficou em `07.` — o
documento pulava de `05.` para `07.`. **Quem viu foi o Marcos, não o teste**: o teste que
escrevi junto afirmava "não existe 06" e passava, porque espelhava o mesmo engano. Corrigido
com `SECOES` centralizado + teste que exige a **sequência contígua** e rodapés contíguos.

🔴 **DFZ-2026-01991 (Bacurity, 21/08 15:41) saiu com o defeito** — nasceu 4 min depois de o
build quebrado subir, e a correção só entrou 16:01. **Se já foi ao cliente, reemitir.**
Registro marcado `templateVersao: '2026-08-21-defeito'`. Mesmo vale para re-downloads feitos
entre 15:37 e 16:03.

**Também em 21/08 — dois buracos da Proposta fechados** (spec §18):
- **Emitir agora é só da Defenz** (`src/lib/emissao-documento.ts`). Antes, qualquer usuário
  de empresa-cliente com sessão emitia proposta com a marca Defenz. Impacto medido: 10 dos
  11 usuários são Defenz; o único de fora nunca emitiu.
- **Re-download deixou de mentir calado:** `templateVersao` no registro, aviso em âmbar no
  log e header `X-Proposta-Template-Divergente`. O preço já era fiel; o texto fixo não é, e
  agora isso aparece.

837 testes, `tsc` e `build` limpos.

**Também corrigido e no ar:** o borrão vermelho no diagrama XDR (box-shadow que o Skia
rasteriza como retângulo), a sobreposição de "Análise de risco" sob o círculo central, e
a ~~página de clientes agora mostra os logos~~ (arte recortada por CSS — o recorte tirou
junto o "Bitdetender" do slide, o logo Defenz duplicado e o Ferrari, que aparecia como se
fosse cliente da Defenz sem ser). ⚠️ **Superado: a página inteira saiu em 21/08** (acima),
e com ela a pendência dos ~72 dpi.

## ✅ A ANA ESTÁ RESPONDENDO (localhost, Gemini 3.6 Flash)
O Portal está **navegável nas 3 abas** e a Ana responde de verdade, com fonte clicável. Testado clicando na interface.

**Provider = Gemini** (`gemini-3.6-flash`, env `GEMINI_API_KEY` + `ANA_MODEL`) — decisão do Marcos em 09/08, contrariando a emenda D7 da spec (que pedia Claude). O argumento da D7 não foi refutado, foi **testado**: nas 2 perguntas sem resposta na base, o Gemini admitiu que não sabia mesmo recebendo 4–5 fontes irrelevantes; nas de dentro, citou o POP certo, sinalizou sozinho que é `[RASCUNHO]` e listou o que falta no procedimento. Pergunta técnica de cyber não foi bloqueada. Latência 4–9s.

⚠️ **A chave foi colada no chat** — rotacionar no Google Cloud Console. E ela precisa de **teto de gasto**: o `checkRateLimit` roda em memória do lambda e não segura custo (R5).

⚠️ **`[TESTE ONEDRIVE] KPIs de gestão à vista` (19k chars) polui o ranking** — é o maior documento da base e aparece em quase toda busca por palavra genérica. Decidir se arquiva.

## 🎯 PRÓXIMO ITEM DO ROADMAP — validar e fechar os POPs
**Os 6 rascunhos de POP estão publicados no Portal com o prefixo `[RASCUNHO]`, esperando o Marcos.** Cada um tem uma seção "⚠️ a confirmar" no fim com as perguntas que as atas deixaram em aberto. Fluxo: Marcos responde → eu corrijo → tiro o prefixo → ele clica em Verificar (selo verde, relógio de 90 dias começa).

| POP | Convergência nas atas | O que falta |
|---|---|---|
| Cadência de follow-up (régua de 10 toques) | 4 de 4 lotes | espaçamento entre tentativas 3ª+; critério de "sem retorno"; sexta ou segunda na revisão |
| Preenchimento do Zoho CRM | 4 de 4 | tabela de % por coluna; prazo do CNPJ/telefone; quem audita |
| Envio de apresentação e proposta | 4 de 4 | Fernando em toda proposta?; o que é "Marcos assume"; qual Add-on p/ qual perfil |
| Encerramento de oportunidade perdida | 2 de 4 | vale só p/ perda p/ concorrência?; quem consolida |
| Daily Meet e Pipeline Review | 4 de 4 | frequência real (diária vs semanal); horário |
| Setup do cliente | 3 de 4 | **o mais fraco** — passo a passo técnico não existe em ata nenhuma, está na cabeça do Leonardo |

Também vivos no Portal: **Apontamento de horas** (3 suposições minhas a confirmar) e `[TESTE ONEDRIVE] KPIs` (Marcos pediu p/ manter).
**Lacuna que os 4 lotes apontaram juntos:** não existe registro do handoff de vendas → operação. Provavelmente o POP mais valioso que ainda não dá pra escrever.

## Depois dos POPs, na ordem
1. ✅ **Ana A1** — `src/lib/portal/ana-persona.ts` + `retrieve.ts` + `@anthropic-ai/sdk`. **FEITO.**
2. ✅ **Ana A2** — `POST /api/portal/ask` (+ `GET` de capacidades). **FEITO**, aguardando só a chave.
3. ✅ **Ana A3** — aba IA viva + `<PortalTabs>` + `CACHE_NAME` → `defenz-v5`. **FEITO.**
4. ✅ **Biblioteca (lado app)** — aba `/dashboard/portal/biblioteca` com as 14 fichas. **FEITO.**
5. **Ana A4 — modo web via n8n** (`N8N_PORTAL_WEB_WEBHOOK_URL`): hoje o seletor Web aparece desabilitado com explicação. Falta o webhook, o Zod estrito e o `https:` only.
6. **F3 sync do OneDrive** — webhook de leitura no n8n (auth de header + allowlist na raiz D2c) + sync + image-proxy. Hoje as fichas foram criadas à mão; nada re-sincroniza sozinho.
7. **R1 — smoke do hotlink do Drive** (segue pendente, precisa do Marcos subir 1 print).
8. **Deploy pro Vercel** (Portal + Service Desk, ambos parados em local).

## ▶️ EM CURSO — Portal Defenz (D1–D8 · spec v2 · **F1 implementada local**)
**Página que centraliza 3 pilares: (1) IA Defenz, (2) POPs com imagens, (3) Biblioteca de manuais/modelos.** Menu próprio em `/dashboard/portal`.
- **Decisões (05/08):** D1 = IA pesquisa **base interna E web** · D1b = **híbrido** (interna no app, web no n8n via webhook) · D2 = imagens por **link do Drive** · D3 = Portal **interno** (`/abrir-ticket` segue a única superfície pública) · D4 = **menu próprio**, absorve o "Playbooks" da spec antiga · D5 = começar com **3–5 POPs** reais.
- **Documentos:** spec [`feature-portal-defenz.md`](features/feature-portal-defenz.md) **v2** · crítica adversarial [`feature-portal-defenz-review.md`](features/feature-portal-defenz-review.md) (4 críticos + 8 médios, com disposição) · plano [`2026-08-05-portal-defenz-f1.md`](superpowers/plans/2026-08-05-portal-defenz-f1.md).
- **F1 (Fundação POPs) IMPLEMENTADA local:** model `Playbook` + `db push` no Neon, `scopedPlaybookWhere`, frescor derivado, 4 rotas, `<PortalMarkdown>` + `<FreshnessBadge>`, 3 páginas, nav, passo no cron. **711 testes** (era 668), `tsc`+`build` verdes. **NÃO deployado pro Vercel.**
- **Smoke ao vivo (Neon, via Bearer):** criar POP → `reviewDueAt` já preenchido na criação ✓ · busca por palavra que só existe **no corpo** ✓ · verify reseta relógio + `reviewReminderSent` ✓ · PUT parcial logou **só** o campo enviado (bug do `→ null` não reintroduzido) ✓ · rotas 401/307 sem credencial, zero 500. Registro de teste removido do banco depois (0 playbooks).
- ⚠️ **PENDENTE — R1 (bloqueia o fechamento da F1):** falta o **smoke do hotlink do Drive**. Precisa do Marcos subir 1 print no Drive e mandar o link. Se a URL não renderizar dentro de `<img>` (o Drive costuma bloquear hotlink), a saída é `/api/portal/image-proxy`; plano C = Vercel Blob. Enquanto isso o `<PortalMarkdown>` já mostra placeholder explícito em vez de quadro branco.
- **Próximas fases:** F2 conteúdo (3–5 POPs reais) · F3 Biblioteca · F4 IA interna (**pipeline novo em `src/lib/portal/ask.ts`** — `src/lib/ai/` é dead code, não serve) · F5 IA web via n8n.

## Current focus
**Service Desk MVP local "polido" — F1 + F2 + métricas (5 do GUIA §8) prontos e verificados em localhost; NÃO deployado pro Vercel (decisão do Marcos: validar local primeiro). DB (Neon, dev=prod) já tem o schema aplicado.**

**Sessão 28/06 — rodada de polish (MVP testável):** auditoria multi-agente (5 dims × verify adversarial) sobre F1/F2/métricas → 4 achados in-scope corrigidos com TDD (uncommitted, no working tree p/ Marcos testar): (HIGH) aging nascia inerte — `columnChangedAt` nulo na criação → tickets novos em "Solicitado" nunca envelheciam; fix = rotas de criação setam o campo + card faz fallback p/ `createdAt`. (HIGH) métrica #1 sem breakdown por origem — `source='portal'` era ignorado nas métricas; fix = `portalCount`/`internoCount` no service-layer + rota + card de Volume no relatório. (LOW) WIP toast desalinhado do destaque vermelho. (LOW) guard anti-bot `_t` inerte (form manda delta, rota lia como timestamp absoluto). Rotas de ação + PUT revisados → sem defeitos. **668 testes verdes, tsc+build OK.** Smoke ao vivo contra o Neon: `/abrir-ticket` 200, portal 422 em submit rápido (sem escrita), `GET /api/service-desk/metrics` via Bearer com `portalCount/internoCount`. **Não commitado ainda** (aguarda validação do Marcos).

**Sessão 25–27/06 (anterior):** MCP Subtasks (commit `f6ed430`), fix PWA/Service Worker (menu "some/aparece" — SW servindo app shell velho, commit `fix(pwa)`), **GUIA mestre do Service Desk** + spec do portal (revisão adversarial de 48 achados), **F1** (Kanban v2 + migração de status, commit `feat(service-desk): F1`) e **F2** (portal público `/abrir-ticket`, commit `feat(service-desk): F2`). 666 testes.

> ⚠️ **Para um contexto novo entender o Service Desk:** ler `docs/features/service-desk-GUIA.md` (guia mestre — visão, modelo de dados, **Invariantes §9**, roadmap, ADRs). F1 = `feature-service-desk.md`, F2 = `feature-service-desk-portal.md`.

**Specs — ver `docs/features/`:**
- `feature-defenz-mcp-subtasks.md` — **DONE** (commit `f6ed430`): 4 tools novas no MCP. **Requer restart do Claude Code** p/ recarregar (já reconectou nesta sessão).
- `service-desk-GUIA.md` — **GUIA MESTRE (vivo)** do Service Desk. Fonte de verdade. ADRs 001–007.
- `feature-service-desk.md` (F1) — **IMPLEMENTADO local** (Kanban v2, migração status, "Abrir Demanda"). db push feito. Não deployado.
- `feature-service-desk-portal.md` (F2) — **IMPLEMENTADO local** (portal `/abrir-ticket`). db push + seed feitos. Não deployado. **Subdomínio `suporte.` + DNS = pendente.**
- `feature-playbooks-manuais.md` — **APROVADA (design)**, não implementada. KB markdown. Próxima feature de produto candidata.

### Histórico anterior
**`feature-time-entries` (Desenho B) DEPLOYADA em prod (commit `8d22216`).** O push também levou as **Fases B+D** (commit `1fb3fcf`, MCP + multi-empresa) que estavam pendentes.

- **feature-time-entries DONE + DEPLOYADO:** diário de horas delta-on-save + campo `Demanda.client` + aba `/dashboard/demandas/horas`. 31 testes novos (**523 total**), `tsc`+`build` verdes. Revisão adversarial multi-agente (2 rodadas) → achados corrigidos. **Deploy:** `prisma db push` no Neon (coluna `client` + tabela `time_entries`); backfill rodado (5 baseline); E2E autenticado em dev (GET admin → 200 c/ 5 lançamentos); push → Vercel (prod live). Ver [feature-time-entries.md](features/feature-time-entries.md).
- **Pós-deploy a observar:** validar a aba Horas autenticado em prod (clique real). Demandas existentes ainda não têm `client` (campo novo) → preencher Cliente nos cards conforme uso. Fases B+D agora em prod — testar MCP/multi-empresa contra prod quando for plugar o token do Marcos.

### Fases B e D (commit `1fb3fcf`, local, não deployado)
- **Fase B — MCP `defenz-mcp`**: pacote standalone em `mcp/defenz-mcp/` (Node/TS ESM, `@modelcontextprotocol/sdk` + `zod`, fetch nativo, stdio). 4 tools (`list/create/update/move_demanda`) sobre `/api/demandas` via Bearer; escopo resolvido pelo token. 31 testes + smoke E2E stdio. README + `.env.example` + `.gitignore`. Toolchain isolada (root `tsconfig`/`vitest` excluem `mcp/`).
- **Fase D — resto do multi-empresa**: rotas convertidas p/ escopo por **conjunto** (`demandas` GET/POST/PUT/DELETE, `users` GET, `users/[id]` PUT c/ `companyIds[]` sync, `teams`, `companies`, `invites`, `audit-logs`, `report/executive`, `demandas/import`). UI Configurações→Usuários ganhou multi-select "Empresas adicionais". Validação `src/lib/validations/user.ts`.
- **Revisão adversarial multi-agente** do diff (Fase B+D) → 4 findings confirmados, **todos corrigidos com TDD**: (CRÍTICO) gerência podia editar/resetar-senha/deletar usuário de outra empresa — adicionado guard de tenant no alvo (PUT+DELETE); (ALTO) `teamIds` não escopado → cross-tenant team bind, agora valida empresa da equipe; (MÉDIO) PUT não setava `dateDone` ao concluir → corrigido server-side (espelha `dateStarted`, beneficia MCP/curl); (BAIXO) `companyId` primária virava linha `UserCompany` redundante → strip da primária. Re-revisão focada dos fixes executada.
- **Gate**: 486 testes app + 31 MCP = **517**, `npm run build` + `npx tsc --noEmit` verdes. **Não deployado** — aguarda decisão de push.
- **Validação de UI**: estática + runtime smoke (todas as rotas alteradas → 401 não 500; página renderiza). Clique autenticado não feito (sem credencial de dev / token não mintável em prod por guardrail). Usuário aceitou considerar validado.

### Histórico imediato (Fase A)
**Solução A (Bearer token) SHIPADA E DEPLOYADA** (commit `0dc7117`, prod verificada). Fundação multi-empresa shipada junto (`UserCompany`, helpers set-based, `companyIds` na sessão). Schema aplicado no Neon (aditivo, ADR-008).

**Config de usuários aplicada (2026-06-07, via `scripts/setup-marcos-admin.ts`):**
- `marcos@defenz.com.br` → **role=admin** + membro (UserCompany) das 4 empresas (Defenz, Cow Cycling, Grafono, PSI.SheilaCarvalho). Senha não alterada (já era a do admin).
- `marcos.v.cruz222@gmail.com` → **novo admin de recuperação**, senha = a do admin existente ("Admin Defenz", mesma conta do token `admin-cli`).
- Empresas existentes no banco: **Defenz | Cow Cycling | Grafono | PSI.SheilaCarvalho**.
- Token admin ativo: `admin-cli` (prefix `defz_2e03fd88`), atado à conta "Admin Defenz".

**UI de gestão de tokens SHIPADA E DEPLOYADA (commit `8b53062`):** Configurações → Usuários → ação 🔑 "API Tokens" por usuário (**admin-only**) — gerar (plaintext 1x), listar, revogar. API `GET/POST/DELETE /api/users/[id]/api-tokens` (session-only, admin). Helpers em `src/lib/api-token.ts`. 442 testes. (Não depende mais de CLI/chat para gerar token.)

## ▶️ PRÓXIMA SESSÃO — começar aqui
**Ler primeiro `docs/features/service-desk-GUIA.md` (§9 Invariantes são obrigatórias).** Service Desk F1+F2 estão prontos em local, schema no Neon, mas NÃO no Vercel. Opções (Marcos escolhe):
1. **Subdomínio do portal** (F2 polish): `suporte.defenz.com.br` = mesma app Vercel via **host-rewrite** (middleware/`vercel.ts`) → `/abrir-ticket`, mesmo origin (sem CORS); **bloquear `/dashboard` no host `suporte.`**; DNS hoje na **YCORN** → migrar p/ Cloudflare/Vercel p/ gerir via prompt. (Spec já tem a seção "Domínio / hospedagem".)
2. **F4 — Sync do Zoho** p/ popular `AuthorizedClient` de verdade (hoje só o seed `scripts/seed-portal.ts` com "Cliente Teste"). Criar a spec `feature-service-desk-zoho-sync.md` sob o GUIA.
3. **Deploy pro Vercel** quando Marcos validar (schema já está no Neon dev=prod, então só `git push`). Lembrar: subir o `CACHE_NAME` do SW (`public/sw.js`, hoje `defenz-v5`) — invariante I7.
4. **`feature-playbooks-manuais`** (aprovada, não implementada) — KB markdown. Outra feature de produto.
5. **Bug do AuditLog em PUT parcial** (chip, ainda aberto): `diffChanges` loga campos ausentes como `→ null` (afeta MCP `move/update_demanda` + curl). Fix: ignorar campos ausentes do payload. TDD em `src/lib/audit.ts`. (GUIA §9.6 lembra: o fix do ticket vive na rota, não centralizado.)
6. Deploy ordenado da Phase 2 do assignee-fk (independente; ver abaixo).

### Como testar o portal F2 (localhost)
`npm run dev` → `http://localhost:3000/abrir-ticket` → CNPJ `11.222.333/0001-81` · e-mail `teste@cliente.com.br` · nome qualquer → abre ticket + protocolo `SD-2026-...`. Qualquer outro CNPJ/e-mail → 422 genérico (anti-enumeração). Ticket aparece em `/dashboard/service-desk` (Solicitado). Seed: `npx tsx scripts/seed-portal.ts` (idempotente). Usuário-sistema: `portal@defenz.com.br`.

## Como operar dados em prod (resumo p/ contexto novo — detalhe em memória `project_api_access`)
- **Token**: `marcos-mcp` (admin, 4 empresas) está ativo e persistente em `~/.claude.json` → `projects["<repo>"].mcpServers.defenz.env.DEFENZ_API_TOKEN`. Scripts leem dele.
- **Banco único** dev=prod (Neon, ADR-008): `npx tsx scripts/<x>.ts` rodando da raiz do repo atinge prod. Padrão usado: criar card via `POST /api/demandas` (Bearer) e **horas de card via Prisma** (`demanda.update spentMinutes` + `timeEntry.create`) p/ NÃO disparar o bug do AuditLog (PUT parcial). Horas de **subtarefa** via `POST /api/demandas/[id]/subtasks` (limpo, lança no diário). IDs úteis: Defenz `cmn8wi8ze00003ouacf33hseb`, PSI `cmq3yyutf0000jo04bv6a5kmg`, Marcos `cmn7fk7u800013oi9yzq17egq`.
- **Padrão de log diário** preferido do Marcos: itens novos → 1 card "Atividades DD/MM" (concluída, cliente Defenz) com subtarefas ☑; itens que já têm card → subtarefa `[DD/MM]` no card existente (checar antes p/ não duplicar).

## In progress
- (nada em código aberto) — Service Desk F1+F2 implementados e commitados **local**; aguardam **deploy pro Vercel** (decisão do Marcos). Schema já no Neon (dev=prod).
- Pendente de produto: subdomínio `suporte.` (host-rewrite+DNS), F4 sync Zoho, Playbooks.
- feature-assignee-fk-migration continua aguardando deploy ordenado (independente).
- Bug AuditLog PUT parcial: ainda aberto (chip).

## Recently completed (last 5)
- 2026-07-03→20 **Sessão longa de operação (sem mudança de código do app).** (a) **Apontamento de horas** de várias frentes via MCP `defenz` → cards: Autopilot Fase 1 (65h), Sales AÍ autônomo (48,25h), Relatório de Risco Cibernético/MDR (36,6h, renomeado de "Postura"), Marketing/AdOps (11,25h, card novo), Nova identidade Defenz (6,2h), Estudo "Discurso que vende" feature-032 (5h, card novo). Doc de horas do robô em `docs/horas-robo-ligacao-autonoma.md`. (b) **MCP `defenz` instalado por-projeto** (`.mcp.json` + gitignore) em `Defenz_Chief`, `defenz-sales`, `Defenz - Autopilot`, `Defenz -Marketing` — permite apontar horas de qualquer projeto Defenz; **escopo de pasta-mãe NÃO existe** no Claude Code (só global ou por-projeto exato). Binário compartilhado aponta p/ `Defenz - To-Do/mcp/defenz-mcp/dist/index.js` (se mover/apagar o To-Do, os 4 quebram). (c) **Token `atrio-sync` criado** — usuário-serviço `atrio-sync@defenz.com.br` role **gerencia** (NÃO admin), membro das 4 empresas, permanente: CRUD completo em demandas/subtasks/tickets/horas, mas não cria empresa nem gere usuários; **não vê os 30 cards legados com `companyId` null** (só admin vê) nem empresas futuras sem membership explícita. (d) **Relatório de suporte do Leonardo** (13/05→13/07): 25 cards, média 3,4d p/ fechar (mediana 0d — 12 de 22 no mesmo dia; média cai p/ ~0,8d excluindo 4 outliers com `dateDone` batido em lote no dia 13/07), 3 abertos há 33/27/10 dias.
- 2026-06-30 **Limpeza de usuários (prod/Neon, transação atômica).** Consolidados os 3 "Marcos" num só: sobrevivente = `marcos@defenz.com.br` → renomeado **"Marcos (Defenz)"** (admin, dono do token MCP `marcos-mcp`), que recebeu do `uiiaa1@gmail.com` 95 demandas FK + 24 string→FK (130 total), 38h diário (82 total), 12 audit logs, 30 Activity + 1 ActivityComment; `uiiaa1` **deletado**. `marcos.v.cruz222@gmail.com` → renomeado **"Marcos Admin"** (backup, mantido). Removidos os test users `vendas@`/`gerencia@defenz.com.br` (0 cards — nada a sinalizar). **"Admin Defenz" `<admin@defenz.com>` NÃO tocado** (decisão: Admin e Marcos = coisas distintas). 13→10 usuários. Token MCP segue válido (200). **Descoberto drift:** FK `AuditLog.userId` é RESTRICT no banco apesar do schema dizer Cascade → ver memória `reference_auditlog_fk_drift`. Pendências: conta "Admin Defenz" (candidata a limpeza, alto risco), invites dangling não-usados (ricardo_camargo2001, Sheila.more), card de teste "Tarefa - De teste Troca de responsável".
- 2026-06-28 **Service Desk MVP — rodada de polish (auditoria multi-agente → 4 fixes TDD).** Auditoria de 5 dimensões (F1 Kanban, F2 portal+segurança, métricas, invariantes §9, rotas de ação) com verificação adversarial → 4 achados in-scope (2 HIGH + 2 LOW), 5 rejeitados out-of-scope. **Fixes:** aging inerte na criação (`columnChangedAt` nulo → fix nas 2 rotas + fallback `??createdAt` no card); métrica #1 breakdown por origem (`portalCount/internoCount` em `tickets-server.ts` + metrics route + relatório); WIP toast alinhado ao destaque vermelho; guard anti-bot `_t` (delta, não timestamp). Rotas de ação + PUT revisados → limpos. **668 testes verdes, tsc+build OK.** Smoke ao vivo (Neon): portal 422 em submit rápido sem escrita, métricas com breakdown via Bearer. **Working tree, não commitado** (Marcos valida 1º). Detalhe no CHANGELOG `[Unreleased] → Fixed (2026-06-28)`.
- 2026-06-25→27 **Service Desk: MCP Subtasks + fix PWA/SW + GUIA + F1 + F2** (commits `f6ed430`, `fix(pwa)`, `e59448e` specs, `feat(service-desk): F1`, `feat(service-desk): F2`, + docs). **MCP Subtasks** (4 tools). **Fix PWA/Service Worker**: o "menu some/aparece" era o SW servindo app shell cacheado — dev autodesregistra + `CACHE_NAME` bump + stale-while-revalidate + SW fora da rota pública. **GUIA mestre** do Service Desk + spec do portal (revisão adversarial 48 achados aplicada). **F1** (Kanban v2: 3 colunas DnD, WIP soft vermelho, aging verde→âmbar→**preto**, campo `client`+autocomplete, drawer, "Abrir Demanda" 1:1, migração status open/paused/resolved→solicitado/em_atendimento/concluido, Defenz-only). **F2** (portal público `/abrir-ticket`: verifica CNPJ+e-mail contra `AuthorizedClient`, ticket Defenz `source=portal`, protocolo atômico `TicketSequence`, usuário-sistema `portal@defenz.com.br`, endpoint burro + anti-enumeração 422 uniforme + honeypot + rate-limit; badge "novos"). Orquestração Sonnet(∥)+Opus(review), gate main loop. **666 testes, tsc+build verdes. db push + seed no Neon. Smoke E2E navegador OK** (F1: board/aging/PUT status; F2: protocolo SD-2026-000001, 4 falhas→422 idêntico, ticket no board). **NÃO deployado pro Vercel.**
- 2026-06-17→24 **`feature-demanda-company-selector` DEPLOYADO** (commits `befcfde`+`15fa70a`) — seletor Empresa/Projeto no modal (admin) + PUT move entre empresas (limpa teamId, AuditLog), E2E move verificado em prod. MCP `defenz` plugado (token `marcos-mcp`) + estendido c/ param `company`. 531 testes app + 39 MCP. Depois: muitos cards alimentados via API em Defenz/PSI (esteiras Meta/Apollo/LinkedIn/Sales AÍ + logs diários "Atividades DD/MM"). 3 specs novas criadas (mcp-subtasks aprovada; playbooks + service-desk draft). Relatório de horas do Leonardo (Defenz, 2 sem) — achados 3 outliers (36/36/28h) prováveis erros de lançamento.
- 2026-06-08 **`feature-time-entries` (Desenho B) DEPLOYADA** (commit `8d22216`, push) — diário de horas delta-on-save + campo `Demanda.client` + aba `/dashboard/demandas/horas`. Schema (`Demanda.client`, modelo `TimeEntry`), helpers puros + `logTimeDelta`, hooks de delta em `PUT /api/demandas` + 3 rotas de subtarefa, `GET /api/time-entries` (admin/gerência, escopo por conjunto + filtros + TZ SP + cap 5000), modal c/ campo Cliente (board/horas inalterados), nav admin/gerência, seed `backfill-time-entries.ts` (baseline auto-corretivo). **31 testes novos (523 total), tsc+build verdes.** Revisão adversarial multi-agente (6 dims → verify, 2 rodadas) → 1 alto + 2 médios + baixos, todos corrigidos. **Deploy:** `db push` no Neon + backfill (5 baseline) + E2E autenticado dev (200 c/ 5 lançamentos) + push → Vercel (prod live). **O mesmo push levou Fases B+D (`1fb3fcf`) a prod.** Specs: feature-time-entries.
- 2026-06-07 **Spec `feature-time-entries` (Desenho B)** APROVADA + commitada (`087eaa2`) via brainstorming. Diário de horas delta-on-save, campo Cliente (≠ Empresa-tenant), aba Horas. Iterou por 2 reframes: descartado "diário como fonte da verdade" e "diário manual" → ficou delta-on-save (livre edição preservada).
- 2026-06-07 **Fase B (MCP `defenz-mcp`) + Fase D (resto multi-empresa)** (commit `1fb3fcf`) — pacote MCP standalone (4 tools, 31 testes + smoke E2E) + conversão de ~10 rotas p/ escopo por conjunto + `companyIds[]` sync em `users/[id]` PUT + UI multi-select + validação Zod `user.ts`. Revisão adversarial multi-agente → 4 fixes (1 crítico tenant: gerência editava usuário cross-company; 1 alto teamIds cross-tenant; 1 médio dateDone server-side ao concluir; 1 baixo strip primária UserCompany). 517 testes, build+tsc verdes. **Local; não deployado.** Specs: feature-defenz-mcp, feature-multi-company-membership, feature-external-kanban-feed.
- 2026-06-07 UI de gestão de API Tokens — Configurações→Usuários, ação 🔑 por usuário (admin-only): gerar/copiar(1x)/listar/revogar. API `/api/users/[id]/api-tokens`. Helpers em `src/lib/api-token.ts`. SHIPADO+DEPLOYADO (commit `8b53062`). 442 testes.
- 2026-06-07 feature-api-service-token (Solução A) + fundação multi-empresa — Bearer token (`ApiToken`+`resolveActor`) na família demanda, `UserCompany` N:N, helpers set-based, `companyIds` na sessão. SHIPADO + DEPLOYADO (commit `0dc7117`, prod verificada). Marcos→admin + memberships + recovery admin. 435 testes.
- 2026-06-03 feature-demanda-dependencies — edição de dependências de Demanda (combobox no modal) + guardas self/ciclo/inválido (detectCycle em src/lib/dependency-graph.ts) + deps clicáveis (card e modal abrem a tarefa da dependência). Módulo `activities` órfão removido. Validado em localhost. 407 testes.
- 2026-06-03 feature-time-tracking — controle de horas gastas/estimadas em Demanda + Subtask (minutos canônicos, UI horas decimais), badge no card, inputs no modal/subtarefas, AuditLog. Schema no Neon dev via `db push`. Validado em localhost.
- 2026-04-28 feature-assignee-fk-migration (código) — schema + migration SQL + backfill + POST/PUT/GET/DELETE com FK source-of-truth + Phase 1 fallback (331 testes)
- 2026-04-28 feature-bugfix-assignee-visibility (Phase 1) — user assignee passa a ver/editar/deletar demanda em qualquer team da própria company (318 testes)
- 2026-04-14 feature-bugfix-date-timezone — parseLocalDate() + fix em /api/demandas (298 testes)
- 2026-04-11 feature-tenant-isolation — 6 rotas protegidas + testes (289 passando, build OK)
- 2026-04-11 harness install — PROGRESS/SPEC/ARCHITECTURE/CHANGELOG + CLAUDE.md tighten
- 2026-04-05 feature-executive-report — relatório executivo com slides via Gemini (1c3787c)

## Next up (priority order)
0. ✅ **`feature-defenz-mcp-subtasks` DONE** — 4 tools (subtarefas + `list_user_tasks`) no MCP, 52 testes. Só restart do Claude pendente.
0b. **Menu "Playbooks / Manuais Defenz"** (`feature-playbooks-manuais`, DRAFT) — base de conhecimento interna. Brainstorming.
0c. **Service Desk** — agora tem **GUIA MESTRE**: [`docs/features/service-desk-GUIA.md`](features/service-desk-GUIA.md) (visão, modelo de dados canônico, métricas, **Invariantes §9** = bugs já pagos, roadmap de features, ADRs). Ler SEMPRE antes de tocar Service Desk. Pipeline:
   - **F1 Core** ✅ **IMPLEMENTADO** (commit `feat(service-desk): F1`) — Kanban 3 colunas (DnD/WIP soft/aging verde→âmbar→preto), campo `client` + autocomplete, drawer lateral, "Abrir Demanda" (POST `/api/tickets/[id]/open-demanda` 1:1), migração status v1→v2. Defenz-only (gate server-side). **604 testes, tsc+build verdes. db push + backfill no Neon feitos. Smoke E2E no navegador OK** (board, WIP 0/5, aging "há 2d" âmbar, open-demanda 200, PUT status concluir/reabrir). **NÃO pushado pro Vercel** (validar local 1º). Revisão Opus (12 achados) aplicada.
   - **F2 Portal público** ✅ **IMPLEMENTADO** (commit `feat(service-desk): F2`) — página **`/abrir-ticket`** (pública, sem auth, branding Defenz): verifica CNPJ+e-mail contra `AuthorizedClient` → cria ticket Defenz `source=portal` com protocolo atômico (`TicketSequence`, ex.: SD-2026-000001) via usuário-sistema `portal@defenz.com.br`. Endpoint burro + anti-enumeração (422 uniforme) + honeypot + rate-limit. Badge "novos" no board. **666 testes, tsc+build verdes. db push + seed feitos. Smoke E2E navegador OK** (protocolo na tela, 4 falhas → 422 idêntico, ticket no board c/ "Cliente Teste"). **Subdomínio `suporte.` + DNS = pendente** (host-rewrite depois). **NÃO pushado pro Vercel.** Seed de teste: CNPJ `11222333000181` / `teste@cliente.com.br`.
   - **Fix SW/PWA** (commit `fix(pwa)`) JÁ FEITO — era a causa do "menu some/aparece".
0d. **Bug AuditLog PUT parcial** (chip) — `diffChanges` loga campos ausentes como `→null`. Fix em `src/lib/audit.ts`.
1. **Deploy ordenado da Phase 2** (manual, requer DIRECT_URL):
   1. `npx prisma migrate deploy` em staging
   2. `npx tsx scripts/backfill-assignee.ts` em staging
   3. Revisar `unresolved_assignees.log` — corrigir manualmente ou aceitar
   4. Deploy do código novo (Vercel)
   5. Repetir em prod
2. (Após 1+ semana de validação) PR de cleanup: dropar coluna `assignee` (string) e remover Phase 1 fallback no código
3. Auditar os `.md` antigos no root (MIGRATION_REPORT.md, EXECUTIVE_SUMMARY.md, etc.) — mover para `docs/archive/` ou deletar
4. Atualizar README.md (atualmente refere Next.js 15 / SQLite / Activity — está desatualizado)

## Known blockers / open questions
- `AuditLog` não tem `companyId` — scoping feito via `user.companyId` join. Funciona para o caso real (gerencia não vê logs de outra company), mas considerar adicionar `companyId` denormalizado no futuro para performance.
- Phase 2 ainda não rodou em staging/prod. O código está backwards-compatible via Phase 1 fallback (string match) enquanto FK ainda não está populada — ou seja: pode-se deployar o código antes do backfill sem regressão.
- Bulk import (`/api/demandas/import`) ainda escreve só `assignee` string. Demandas importadas dependem do Phase 1 fallback até alguém editar via modal. Backfill resolve via lookup name/email se houver match.

## Verify commands (DoD gate)
```bash
npm run build && npx tsc --noEmit && npm test
```

## Handoff notes
- Sempre ler este arquivo no início da sessão.
- Antes de codar qualquer feature nova: criar `docs/features/feature-<slug>.md`, obter approval, então codar.
- README.md está stale. Fontes de verdade: `.claude/CLAUDE.md` + `docs/`.
- Admin role = cross-company. `gerencia`/`user` = scoped ao `session.user.companyId` (ver feature-tenant-isolation).
- **Assignee visibility (Phase 1+2)**: source of truth é `Demanda.assignedToId` (FK). String `Demanda.assignee` é cache denormalizado para display (auto-populada server-side). Filtro GET para `user`: team OR FK-com-tenant OR string-fallback-quando-FK-null. PUT/DELETE auth: mesma lógica.
- Para criar nova demanda atribuída via API: enviar `assignedToId` (cuid do User). Servidor valida company match. Não-admin não pode atribuir cross-company (403).
