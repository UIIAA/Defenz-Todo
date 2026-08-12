# ARCHITECTURE — Architecture Decision Records

Formato: ADR curto (Date / Context / Decision / Consequences). Ordem cronológica.

---

## ADR-001: Multi-tenant Company > Team hierarchy
**Date:** 2026-03-29
**Context:** Plataforma precisa servir múltiplas empresas (Defenz, Cow Cycling, etc.) com isolamento de dados e branding próprio.
**Decision:** Modelo `Company` como raiz; `Team` pertence a `Company`; `User` pertence a `Company` e participa de múltiplos `Team` via `UserTeam`. `Demanda` referencia `companyId` + opcionalmente `teamId`. Branding (logo, accent color) no `Company`.
**Consequences:** Todos queries de Demanda/Team/User devem filtrar por `companyId` para não-admin. Sessão JWT carrega `companyId`, `companyLogoUrl`, `companyAccentColor`. Admin é o único role cross-company.

---

## ADR-002: Invite-only registration via InviteToken
**Date:** 2026-03-22
**Context:** Registro aberto exporia o sistema a signups não-autorizados e complica o assignment de role/company.
**Decision:** Removido signup público. Admin/gerencia cria `InviteToken` (role + companyId + teamIds + expiry). Endpoint `/register` valida o token antes de criar o `User`.
**Consequences:** Gerencia é limitada a criar invites **para a própria company** (ver feature-tenant-isolation). Token expira; invites podem ser revogados.

---

## ADR-003: Audit log on every Demanda mutation
**Date:** 2026-02-20
**Context:** Equipes executivas exigem rastreabilidade completa de quem mudou o quê.
**Decision:** Helper `createAuditLog()` (`src/lib/audit.ts`) + `diffChanges()` é chamado em toda rota que cria/atualiza/deleta Demanda. `AuditLog` armazena `userId`, `action`, `entityType`, `entityId`, `changes` (JSON).
**Consequences:** Qualquer nova rota de mutação Demanda precisa chamar o helper — não há enforcement automático. Logs expostos em `/dashboard/logs` para admin/gerencia. Gerencia deve ver só logs da própria company.

---

## ADR-004: pgbouncer em Vercel, DIRECT_URL para migrations
**Date:** 2026-01-15
**Context:** Funções serverless da Vercel abrem muitas conexões; Neon cobra por conexão direta. Prisma migrate não funciona com pgbouncer (statements preparados).
**Decision:** `DATABASE_URL` com `pgbouncer=true&connection_limit=1` para runtime. `DIRECT_URL` sem pgbouncer só para `prisma migrate`.
**Consequences:** Regra crítica documentada em `.claude/CLAUDE.md` — schema.prisma usa `provider = "postgresql"` com `directUrl`. Nunca SQLite.

---

## ADR-005: Zod + handleApiError contract para todas as rotas
**Date:** 2026-01-10
**Context:** Rotas inconsistentes retornavam erros em formatos diferentes; validação manual era propensa a erros.
**Decision:** Toda rota API usa `handleApiError` / `successResponse` / `ApiError` de `src/lib/api-helpers.ts`. Schemas Zod em `src/lib/validations/` validam inputs antes de qualquer lógica.
**Consequences:** Novas rotas seguem o padrão. Erros têm formato uniforme `{ error, code, details? }`. Validação centralizada em schemas reutilizáveis.

---

## ADR-006: Gemini para executive report (structured JSON → slides)
**Date:** 2026-04-05
**Context:** Precisávamos gerar relatórios executivos de demandas concluídas sem copy-paste manual em apresentação.
**Decision:** `/api/report/executive` chama Gemini com prompt engineered para retornar JSON estruturado; `src/lib/ai/` valida o JSON com Zod e renderiza slides branded.
**Consequences:** Custa `GEMINI_API_KEY`. Prompt/schema em `src/lib/ai/` — mudanças no formato exigem update do validator. Gerencia usa só pela própria company.

---

## ADR-007: NextAuth v4 + .npmrc legacy-peer-deps para Next 16
**Date:** 2026-03-10
**Context:** Migração para Next.js 16 quebrou compatibilidade de peer deps com next-auth v4 (que não tem release para Next 16 ainda).
**Decision:** Manter next-auth v4 + `.npmrc` com `legacy-peer-deps=true`. Não migrar para v5 agora (breaking changes grandes).
**Consequences:** `npm install` exige `.npmrc`. CI e Vercel precisam carregar o `.npmrc`. Considerar migração para Auth.js v5 quando estabilizar.

---

## ADR-008: Banco Neon único compartilhado entre dev local e produção
**Date:** 2026-06-03
**Context:** Não estava documentado qual banco a produção (Vercel) usa. Surgiu a dúvida ao aplicar mudanças de schema (time-tracking, dependências) se o `db push` local atingia produção.
**Decision:** Dev local (`.env`) e produção (Vercel env) apontam para o **mesmo projeto Neon** — host `ep-flat-term-aclvza7r` (pooler para `DATABASE_URL`, direct para `DIRECT_URL`/`DATABASE_URL_UNPOOLED`), database `neondb`, região `sa-east-1`. Confirmado comparando `vercel env pull --environment=production` com o `.env`.
**Consequences:**
- Um `prisma db push` (ou `migrate`) executado localmente **já altera a produção** — não há banco de staging separado. Cuidado: mudanças destrutivas afetam prod imediatamente. Preferir mudanças aditivas (colunas nullable/default).
- Não há ambiente de staging isolado. Validar em localhost (que usa o mesmo banco) antes de push.
- Se um dia houver banco de produção separado, este ADR deve ser atualizado e o fluxo de migration revisto (aplicar em prod via `DIRECT_URL` de produção antes do deploy do código).

---

## ADR-009: A Ana roda no Gemini, não no Claude
**Date:** 2026-08-09
**Context:** A emenda D7 da spec do Portal pedia Claude, com um argumento forte: "admitir que não sabe" é seguir instrução, e num assistente interno errar isso é caro — a IA que inventa procedimento é pior que a IA que não responde. O Marcos pediu Gemini.
**Decision:** `gemini-3.6-flash`, via `GEMINI_API_KEY` + `ANA_MODEL`. O argumento da D7 **não foi refutado, foi testado**: nas perguntas sem resposta na base, o Gemini admitiu que não sabia mesmo recebendo 4–5 fontes irrelevantes de propósito; nas de dentro, citou o POP certo e sinalizou sozinho que era `[RASCUNHO]`. Latência 4–9s.
**Consequences:** Custo menor e latência aceitável. `safety settings` em `BLOCK_ONLY_HIGH` nas 4 categorias, porque POPs de cibersegurança falam de EDR e bloqueio de arquivo — falso-positivo clássico. `finishReason` é comparado por **string**: o enum do SDK 0.21 não conhece valores que a API já devolve. Se a qualidade do "não sei" regredir, este ADR é o primeiro a revisitar.

## ADR-010: A proposta é HTML impresso pelo Chromium, não PPTX
**Date:** 2026-08-09
**Context:** Presumia-se que o A4 entregue ao cliente fosse o PowerPoint exportado. Os metadados do PDF real dizem `Producer: Skia/PDF` + `Creator: Mozilla/5.0`, e o PPTX mede 508×286mm (16:9, 11 slides) contra 210×297mm (16 páginas) do PDF.
**Decision:** Template HTML versionado no repo → Chromium headless (`puppeteer-core` + `@sparticuz/chromium`) → PDF. É o caminho que a Defenz já usava sem saber que usava, e o brandbook normatiza ("Documentos A4 = 794×1123px com CSS `@media print`").
**Consequences:** Some do plano a manipulação de XML de PowerPoint e a necessidade de LibreOffice no servidor. Entra uma dependência de binário nativo: `next.config.ts` precisa de `serverExternalPackages`, e a rota é a mais provável de falhar só em produção (memória/cold start do Lambda). O Chromium quantiza a MediaBox — o A4 sai 594,96 × 841,92 pt, a mesma geometria do PDF que a Defenz já entrega.

## ADR-011: A proposta é arquivada no OneDrive via n8n, não em Vercel Blob
**Date:** 2026-08-09
**Context:** O arquivo gerado precisa ir para algum lugar durável. Vercel Blob seria o caminho de menor atrito técnico.
**Decision:** OneDrive, via Microsoft Graph chamado pelo n8n. Preferência do Marcos: some uma dependência nova e o arquivo nasce onde o time já vive.
**Consequences:** O arquivamento é uma chamada de rede que **nunca pode derrubar a geração**: é `try/catch` com timeout de 8s e o registro fica `oneDriveItemId: null`, exibido como "não arquivado". Sem `N8N_PROPOSTA_ARQUIVO_WEBHOOK_URL` a feature fica inerte, não quebrada. O workflow do n8n é uma dependência externa que precisa existir.

## ADR-012: Re-download de proposta reimprime do snapshot, não guarda bytes
**Date:** 2026-08-09
**Context:** O log precisa permitir baixar de novo uma proposta emitida. O caminho óbvio é guardar o PDF.
**Decision:** Não guardar bytes. O registro grava `precoSnapshot` (o objeto de investimento inteiro, como aplicado) e o re-download **reimprime a partir dele**, nunca da tabela vigente.
**Consequences:** Some a dependência de storage. Garante que o mesmo número de proposta sempre saia com o mesmo preço, mesmo depois de a tabela mudar — sem isso, "quanto cobrei do João em agosto" vira adivinhação. Custo: cada re-download roda o Chromium de novo (~2s). Se o template mudar, propostas antigas reimprimem com o layout novo e o preço velho — aceitável, e é por isso que regerar emite número novo.
