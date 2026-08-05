# Revisão adversarial — spec Portal Defenz (v1 → v2)

**Data:** 2026-08-05
**Revisor:** agente crítico Opus, com leitura do código (18 tool calls)
**Alvo:** `feature-portal-defenz.md` v1
**Veredito:** *não implementar como estava* — 4 críticos + 8 médios. Todos endereçados na **v2**.

> Este arquivo é o registro do que foi achado e **o que foi feito com cada achado**. Serve de memória: se alguém questionar uma decisão da v2, a justificativa está aqui.

## Legenda de disposição
✅ **CORRIGIDO** na v2 · 🔁 **REESCOPADO** (mudou fase/escopo) · ✂️ **CORTADO** do MVP · 📌 **ACEITO COMO RISCO** (documentado, não resolvido)

---

## Críticos

| # | Achado | Evidência | Disposição |
|---|---|---|---|
| **C1** | Spec dizia reusar `src/lib/ai/` e que o relatório executivo o usa. **Falso**: zero importadores (`grep -rn "lib/ai" src/ --exclude-dir=ai` → vazio); o código vivo instancia o Gemini direto em `src/app/api/report/executive/route.ts:138-139` com `gemini-3-flash-preview`. O módulo é específico de `ActivityInput` e travado em `gemini-1.5-*` (aposentados). **F4 era subestimada: é pipeline novo, não reuso.** | verificado 2x (crítico + eu) | ✅ + 🔁 §10/§14 reescritos; F4 re-escopada; `src/lib/portal/ask.ts` novo; modelo em env var |
| **C2** | Contradição: "FTS scoped via `playbookScopeWhere`" (objeto Prisma) **+** "índice GIN via SQL raw". As duas não coexistem — o escopo teria que ser reescrito à mão em SQL na rota que alimenta a IA. Risco de vazamento cross-tenant (§9.1 do GUIA). | `src/lib/auth.ts:89-97` retorna objeto Prisma | ✅ **GIN cortado do MVP.** Busca = Prisma `contains` (title OR body, insensitive), escopo pelo helper testado. GIN vira evolução quando o volume pedir |
| **C3** | `{ OR: [...] }` espalhável: caller que também tenha `OR` (buscar título **ou** corpo) sobrescreve o escopo via spread — **vazamento silencioso**. E admin gera `{ OR: [ {}, ... ] }` (comportamento não-óbvio). | por construção, `auth.ts:89-97` + padrão de spread nas rotas | ✅ helper vira `scopedPlaybookWhere(user, extra)`: merge com `AND` internamente + short-circuit de admin. Caller nunca espalha escopo |
| **C4** | Resposta do n8n tratada como confiável: sem Zod, sem allowlist de esquema nas `sources[]` (`javascript:` = XSS), sem cap. É saída de LLM que leu web arbitrária (**prompt injection indireto**). Modo interno: citações do modelo não eram validadas contra o que foi recuperado. | leitura da spec | ✅ Zod estrito na resposta; `answer` renderizado como **texto puro**; `sources` só `https:`; citações validadas contra o set recuperado |

---

## Médios

| # | Achado | Disposição |
|---|---|---|
| **M1** | Plano de sanitização não funciona: `react-markdown` devolve elementos React, não string HTML — DOMPurify não tem onde entrar sem `renderToString` + injeção de HTML cru (que *introduz* o risco). "HTML cru desabilitado" já é o default do v10. | ✅ trocado por `urlTransform` allowlist (`https:`/`mailto:`), sem `rehype-raw`, sem DOMPurify no caminho de render |
| **M2** | `checkRateLimit` compõe chave como `${key}:${ip}` → é **por IP**, não por usuário; e o store é `Map` em memória do lambda (`rate-limit.ts:8`) → teto global não existe em serverless. R5 estava mitigado só no papel. | ✅ chave `portal-ask:${user.id}` + caps duros (pergunta ≤500 chars, retrieve ≤6, contexto ≤8k chars, `maxOutputTokens`). 📌 teto global durável fica documentado como limitação |
| **M3** | Refinamento condicional de `kind` no PUT parcial valida o **payload**, não o estado final — mesmo espírito do bug do `diffChanges` (§9.6 do GUIA; `src/lib/audit.ts:36-52` segue sem guard, fix vive inline em `tickets/[id]/route.ts:61-66`). | ✅ validar estado **mergeado**; `diffChanges` recebe só as chaves presentes no payload (padrão inline do ticket) |
| **M4** | POP criado e nunca verificado **nunca** entra no motor de frescor (`reviewDueAt` só nascia no verify) — é o "repositório morto" que a feature existe pra evitar. | ✅ `reviewDueAt` setado na **criação**; badge "nunca verificado" distinto de "precisa revisão" |
| **M5** | Índice GIN raw pode ser derrubado silenciosamente pelo próximo `db push` — em **produção** (dev=prod). | ✅ resolvido por tabela: sem GIN no MVP (C2) |
| **M6** | `onDelete: Restrict` na Company → `P2003` → `handleApiError` devolve "Referência inválida" 400 genérico (`api-helpers.ts:79-88`). Repete a dor do FK do AuditLog. Texto confundia "deletar" com "arquivar" (não existe arquivar Company). | ✅ texto corrigido; 📌 mensagem específica no DELETE de Company = fora do MVP, anotado |
| **M7** | Timeout de 25s sem `maxDuration` declarado (não há `export const maxDuration` no repo nem bloco `functions` no `vercel.json`) → 504 da plataforma = erro silencioso, o que §9.3 proíbe. | ✅ `maxDuration` explícito na rota `ask` + `AbortController` em 20s + AC testando o ramo de timeout |
| **M8** | `PlaybookCategory` (modelo + rotas) e "Cmd+K ganha grupo Portal" não tinham **fase nem AC**. Pior: `SearchCommand` vive dentro de `dashboard/demandas/page.tsx` e recebe `demandas` por prop — "ganhar um grupo" implicava refatorar a página de Demandas. Trabalho invisível. | ✂️ **ambos cortados do MVP.** `tags[]` resolve nesta escala; Cmd+K vira fase 2 |

---

## Menores (todos aplicados na v2, salvo nota)

- Faltavam back-relations em `Company`/`User` → `prisma validate` falharia. ✅
- `createdBy` obrigatório = `Restrict` por default → deletar usuário que escreveu POP dá `P2003` (mesma dor do `AuditLog`, memória `reference_auditlog_fk_drift`). ✅ virou `createdById String?` + `SetNull`.
- `reviewIntervalDays` tinha comentário "default 90" sem `@default(90)`. ✅ fixado no Prisma.
- §13 herdava a §9 do GUIA mas **fuso SP (§9.2) não aparecia**, apesar de todo o frescor comparar datas. ✅ resolvido comparando **instantes** (`reviewDueAt <= now`), sem fronteira de dia — o problema de fuso deixa de existir.
- Env vars são server-side; faltava dizer **como o cliente sabe** que o modo Web está off. ✅ flag `webEnabled` na resposta.
- DELETE rotulado "arquivar" sem definir hard/soft delete nem quem pode. ✅ = soft delete (`isArchived=true`), mesma permissão do PUT.
- Ficha da Biblioteca: markdown ou texto? ✅ mesmo `<PortalMarkdown>` dos POPs.
- Falta `target="_blank" rel="noopener noreferrer"` no "Abrir no Drive". ✅ virou requisito.
- `tags[]` sem índice — 📌 irrelevante nesta escala, só não prometer performance.
- F1 entregava 3 abas com 2 mortas, contradizendo "cada fase deixa o Portal usável". ✅ F1 renderiza só a aba POPs.

---

## O que a v1 acertou (o crítico tentou derrubar e não conseguiu)

1. Citações de arquivo:linha corretas (`auth.ts:69`/`:89`, `rate-limit.ts:26`, nav `layout.tsx` ~199/~241).
2. Auditoria de deps honesta: `rehype-sanitize` realmente **não** está instalado (a spec antiga de playbooks assumia que sim) e as 5 deps citadas existem com **zero uso** em `src/`.
3. Decisão de **não** estender `companyScopeWhere` (cláusula única, usada por Demanda/tickets/users) — a forma do helper novo estava errada, a decisão de criar um novo estava certa.
4. `isStale` derivado + reset do `reviewReminderSent` — evita o bug latente do cron atual (`reminders/route.ts:88-92` marca `reminderSent` sem reset).
5. D3 / §9.9: nenhuma superfície pública nova; `/abrir-ticket` continua a única.
