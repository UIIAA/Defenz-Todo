# Feature: Ana — a IA Defenz

**Status:** 🟢 **SPEC v2 — revisão adversarial aplicada (7 críticos + 10 médios)**
**Priority:** P1 — detalha e **emenda** a F4/F5 do Portal
**Date:** 2026-08-09
**Pai:** `feature-portal-defenz.md`. Esta spec introduz as emendas **D7** (provider) e **D8** (contrato da rota) — a spec-mãe foi atualizada no mesmo commit. Herda integralmente as invariantes **§9 do `service-desk-GUIA.md`**.
**Revisão:** relatório do crítico resumido em §10.

---

## 1. Objetivo

> "Vamos vincular um agente chamado Ana para a IA Defenz. Documentos padrão, system prompt e uma personalidade. Como se fosse a Ana da Defenz (mesmo nome que uso nas ligações)." — Marcos, 09/08

Ana é a identidade de IA da Defenz, e o Portal é a primeira porta onde ela atende. O nome já é usado no robô de ligação (Agente Ana / CallBox, atas de 27/04).

⚠️ **Correção de rumo da v1:** a v1 usava "uma Ana só em todos os canais" para justificar todo o desenho. Isso não se sustenta — o robô roda em outro sistema (n8n/`Defenz_Chief`), e a persona de atendimento a **prospect por telefone** é incompatível com a de **funcionário consultando POP** ("cite a fonte", "link para o POP" não existem ao telefone). **Unificar canais saiu do MVP.** O nome compartilhado permanece; a implementação, não.

---

## 2. Onde mora a Ana — um arquivo só

| Peça | Onde |
|---|---|
| **Persona inteira** (identidade, voz, limites, regras) | `src/lib/portal/ana-persona.ts` — no repo, versionado em git |
| **Documentos** | Os POPs e fichas existentes, via retrieve |
| **Chave de API** | `.env` na Vercel. Nunca no banco, nunca no prompt, nunca no log |

⚠️ **A v1 partia a persona em duas** — núcleo no repo + "camada de voz" editável como POP `tag: ana-persona`. **Cortado.** O argumento não sobrevivia à inspeção:

- **O benefício de segurança era falso.** Prompt não é fronteira de segurança. A segurança real está em `scopedPlaybookWhere` e na validação de citação — código, não string. E "núcleo vence sempre" descrevia ordem de concatenação, não precedência aplicada: num prompt, o que vem depois costuma pesar **mais**.
- **O benefício de conveniência era pequeno.** Deploy aqui é `git push`, e quem editaria o POP é quem dá o push.
- **O custo era real:** o `Playbook` **não tem campo de visibilidade** (`prisma/schema.prisma`), então o POP da persona apareceria na aba POPs para todo mundo, entraria na busca, e disputaria vaga no próprio retrieve da Ana — podendo ser citado como fonte. `tag` não é permissão (texto livre, sem allowlist no Zod), e **gerência** pode editar playbook da própria empresa — a "porta dos fundos" que o risco dizia estar fechada. E o cron de frescor cobraria revisão da persona por e-mail.

A camada editável volta quando existir um segundo consumidor real — junto com o campo de visibilidade que ela exige.

---

## 3. Personalidade

Ana é **a operação da Defenz falando**, não uma assistente genérica com nome brasileiro.

| Traço | Como se manifesta |
|---|---|
| **Admite o que não sabe** | "Isso não está em nenhum POP nosso" vence um palpite plausível. **O traço mais importante** |
| **Objetiva** | Responde primeiro, contextualiza depois |
| **Fala de processo, não de teoria** | "O POP diz para pedir o CNPJ antes da proposta", não "é boa prática coletar dados cadastrais" |
| **Cita a fonte** | Toda afirmação sobre processo vem com link para o POP |
| **Não completa procedimento incompleto** | Diz o que falta no POP em vez de preencher sozinha |
| **Avisa quando a fonte está vencida** | Se o POP citado está "precisa revisão", isso vai no `avisos[]` |

**O que Ana não é:** bajuladora, emojificada, preambular, nem confiante além do que a base sustenta.

---

## 4. Retrieve — o ponto que quase matou a feature

⚠️ **A v1 dizia "busca scoped → top-6". Isso teria recall ≈ zero.** A única busca existente é `contains` da string crua (`src/app/api/portal/playbooks/route.ts:42-45`): a pergunta "como faço o onboarding de um cliente novo?" vira `LIKE '%como faço o onboarding de um cliente novo?%'` e casa com **nada**. Pior: o `orderBy` é `[{reviewDueAt:'asc'},{updatedAt:'desc'}]` — "top-6" devolveria os 6 POPs **mais vencidos** que casassem, não os mais relevantes.

E o bug passaria despercebido: a Ana cairia sempre no ramo "não achei nos nossos POPs", que é justamente o comportamento que a spec celebra. **O teste de R1 passaria com a feature quebrada.**

**Desenho corrigido** — `src/lib/portal/retrieve.ts`:

1. **Extrai termos** da pergunta: minúsculas, sem acento, remove stopwords PT-BR, descarta tokens < 3 chars. Cap de 8 termos.
2. **Consulta** com `scopedPlaybookWhere(user, { isArchived: false, OR: [...por termo, título e corpo] })`, `take: 40`.
3. **Ranqueia em JS** (LLM extrai, JS calcula): +3 por termo no título, +1 por ocorrência no corpo (cap 5 por termo), +1 se `kind=POP`. Empate → mais recentemente verificado.
4. **Corta os 6 primeiros**, e **só entram os com score > 0**.
5. Se sobrar zero → Ana responde que não achou. Se o melhor score for baixo (< 4), entra `avisos: ['fonte_fraca']`.

**Critério de aceite não-negociável:** o teste usa **pergunta em português natural**, não palavra-chave. Uma pergunta cuja resposta não está na base tem que retornar zero.

---

## 5. Provider e modelo — emenda D7

**Claude, chamado direto. Sem adaptador.**

```
ANTHROPIC_API_KEY=...              # a chave que o Marcos vai gerar
ANA_MODEL=claude-opus-5            # muda no próximo deploy, não em tempo real
ANA_EFFORT=high                    # varrer para medium/low com uso real
```

⚠️ **A v1 pedia `ANA_PROVIDER=anthropic|google`. Cortado (YAGNI caro).** Todas as decisões da §5 são específicas do Opus 5 — sem `temperature`/`top_p`/`top_k` (retornam 400), `effort` dentro de `output_config`, thinking ligado por padrão, `stop_reason: refusal`. Um adaptador ou perde tudo isso no mínimo denominador comum, ou vira um `if` — pior que uma função só.

**A mãe dizia Gemini na F4** (`PORTAL_GEMINI_MODEL`). Esta é a emenda **D7**: a Ana usa Claude porque o requisito central é *admitir quando não sabe* e *citar fonte* — instruction-following, onde errar é caro. O Gemini segue no relatório executivo, intocado.

**Dependência que falta:** `package.json` tem `@anthropic-ai/claude-agent-sdk`, que é o **Claude Code empacotado como biblioteca** — não serve. Precisa de **`@anthropic-ai/sdk`** (lembrar do `legacy-peer-deps`). Instalar é DoD de A1.

**Detalhes de API que a implementação tem que acertar:**
- Thinking é **ligado por padrão** no `claude-opus-5`; `max_tokens` limita **pensamento + resposta juntos**.
- Não enviar `temperature`/`top_p`/`top_k` → 400.
- `effort` vai **dentro de `output_config`**, não no topo.
- **`fallbacks: "default"`** com beta `server-side-fallback-2026-07-01` — ver §6.
- `export const maxDuration` explícito na rota + streaming. Sem isso, um modelo que pensa por padrão com `effort: high` estoura o timeout e devolve 504 sem corpo — erro silencioso, que a §9.3 do GUIA proíbe.

### ⚠️ O risco que ninguém tinha visto: a Defenz é uma empresa de cibersegurança

O `claude-opus-5` tem salvaguardas de cyber elevadas e **recusa** com `stop_reason: "refusal"` / `stop_details.category: "cyber"` — e trabalho **benigno** de segurança é o falso-positivo documentado. Pela D6 da mãe, POPs técnicos de Bitdefender (console, agente, políticas, exclusão de arquivo) entram numa fase seguinte: **é exatamente o conteúdo que dispara o classificador.**

Tratar refusal como bug de índice de array, como a v1 fazia, é insuficiente. **Requisito:** `fallbacks: "default"` desde A2 — recusa de categoria cyber é reencaminhada para `claude-opus-4-8` server-side — e um teste com pergunta de suporte real. Checar `stop_reason` **antes** de ler `content`.

---

## 6. Contrato da rota — emenda D8

**Rota única, herdada da mãe: `POST /api/portal/ask`.** A v1 criava `/api/portal/ana` com contrato próprio e derrubava `webEnabled`, deixando duas specs vigentes conflitantes para a mesma capacidade.

```ts
// entrada
{ question: string /* ≤500 chars */, mode: 'interno' | 'web' }

// saída
{
  answer: string,
  citations: { id, title, companyLabel, freshness }[],  // só modo interno
  sources:   { url, title }[],                          // só modo web, https
  webEnabled: boolean,
  avisos: ('fonte_fraca' | 'fonte_vencida' | 'multi_empresa' | 'fallback_usado')[]
}
```

- **`avisos[]` é enum fechado.** Na v1 o campo existia sem definição.
- **`citations` carrega a empresa.** Marcos é admin em 4 empresas e `scopedPlaybookWhere` não filtra admin (`playbook-scope.ts:19`) — a Ana pode misturar POPs de empresas diferentes. Não é vazamento (admin é autorizado), é armadilha de correção: "o processo é X" quando X é de outro cliente. Set cruzando empresas → `avisos: ['multi_empresa']`.
- **Só sessão. Não aceita Bearer.** As outras rotas do Portal usam `resolveActor`, que aceita token de serviço permanente (`marcos-mcp`, `atrio-sync`). Um token long-lived somado a um LLM que lê a base inteira é exfiltração sem rastro. `/api/portal/ask` usa `requireAuth()`.

---

## 7. Regras duras

1. **Escopo do usuário sempre** — retrieve com `scopedPlaybookWhere` da sessão.
2. **Citação validada contra o set recuperado** — id fora do set é descartado. Impede *forjar* fonte.
   ⚠️ **Não impede** um POP com texto injetado fazer a Ana emitir procedimento errado **citando corretamente** o POP que carrega a injeção. Mitigação: trechos entram delimitados e marcados como dados; `answer` renderizado como **texto puro**, sem markdown com links vindos do corpo.
   ⚠️ A v1 dizia "só admin/gerência escreve POP". **Deixa de valer na F3 da mãe** (sync do OneDrive): o `body` passa a vir de qualquer arquivo depositado na pasta. Reavaliar quando a F3 existir.
3. **Nenhum trecho de POP sai no modo web.** ⚠️ A v1 dizia "conteúdo interno não sai", o que é falso: **a pergunta é o vazamento** ("como resolvo o chamado da Volix sobre bloqueio de política" leva nome de cliente para fora). O que se garante é que nenhum trecho sai. A UI avisa isso explicitamente ao trocar de modo.
4. **Sem fonte, sem resposta** no modo interno.
5. **Rate limit** `ana:${user.id}` + cap de 500 chars. ⚠️ `checkRateLimit` compõe a chave com IP e o store é `Map` em memória do lambda — **não existe teto global em serverless**. Isso **não é** mitigação de custo.
6. **Teto de custo real:** chave/workspace **dedicado na Anthropic com limite de gasto mensal**. Requisito de A2, não opcional.
7. **Não logar o texto da pergunta** — guardar o que o funcionário perguntou é vigilância. **Mas logar o acesso:** `userId`, timestamp, ids dos playbooks entregues, tokens gastos. O buraco não é a pergunta; é não saber quais POPs saíram para quem.
8. **Sem multi-turno no MVP.** Pergunta-resposta, sem histórico. Histórico vindo do cliente é entrada não-confiável (o browser forja turno de assistente) e colide com a regra 7. Volta como fase própria, server-side, com reformulação da consulta.

---

## 8. Fases

| Fase | Entrega | DoD |
|---|---|---|
| **A1** | `ana-persona.ts` + `retrieve.ts` + `npm i @anthropic-ai/sdk` | Retrieve testado com **pergunta em português natural**; ranking correto; zero quando não há resposta. **Nenhuma aba nova na UI** |
| **A2** | `POST /api/portal/ask` interno: retrieve → Claude (`fallbacks`, `maxDuration`, streaming) → citações validadas | Pergunta real cita o POP certo; sem base → admite; refusal tratado; teto de gasto configurado na chave |
| **A3** | Aba IA no Portal (nasce viva) + bump `CACHE_NAME` | Marcos pergunta e recebe resposta com fonte clicável em localhost |
| **A4** | Modo web via n8n (Zod estrito, texto puro, `https:`) | n8n fora não quebra o Portal |
| **A5** | Deploy | Vercel |

⚠️ **A v1 entregava "tela desabilitada com explicação" na A1** — que é literalmente a aba morta que a mãe proíbe em negrito. A aba nasce viva na A3.
⚠️ **"Ana no robô de ligação" saiu do MVP** (era A5 da v1). Exigiria endpoint público expondo o system prompt, colidindo com D3 e §9.9.

---

## 9. Riscos

| # | Risco | Mitigação |
|---|---|---|
| R1 | **Alucinar procedimento** — o pior modo de falha | Sem fonte → sem resposta; citações validadas; teste com pergunta fora da base |
| R2 | **Recusa por classificador de cyber** — a Defenz é MSSP | `fallbacks: "default"` desde A2 + teste com pergunta de suporte real |
| R3 | **Retrieve vazio silencioso** | Teste com pergunta natural é critério de aceite de A1 |
| R4 | **Injeção via corpo de POP** (piora na F3 com o sync do OneDrive) | Trechos como dados delimitados; `answer` em texto puro; reavaliar na F3 |
| R5 | **Custo** | Teto de gasto na chave. Rate-limit **não** conta como mitigação |
| R6 | **Timeout 504 sem corpo** | `maxDuration` + streaming, DoD de A2 |
| R7 | **Resposta cruzando empresas para admin** | `companyLabel` na citação + aviso `multi_empresa` |

## 10. O que a revisão mudou

**Cortado:** camada de voz editável no banco · `ANA_PROVIDER` · rota `/api/portal/ana` própria · multi-turno · unificação com o robô de ligação · aba desabilitada na A1.
**Corrigido:** retrieve (recall zero) · ordenação por frescor em vez de relevância · contrato reconciliado com a mãe · `avisos[]` definido · regra do modo web reescrita com honestidade · rate-limit rebaixado a não-mitigação de custo.
**Adicionado:** `fallbacks` por causa do domínio cyber · `maxDuration`/streaming · log de acesso sem texto da pergunta · sessão-only (sem Bearer) · `companyLabel` na citação · teto de gasto na chave · dependência `@anthropic-ai/sdk`.
**Sobreviveu ao ataque:** as 4 afirmações sobre a API do Opus 5 · `effort` começando em `high` · "admitir que não sabe" como traço nº1 · validação de citação · modo web só por escolha explícita.
