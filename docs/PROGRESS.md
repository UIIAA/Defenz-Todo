# PROGRESS — Defenz To-Do

**Last updated:** 2026-06-07
**Version:** 0.2.0
**Branch:** main

## Current focus
**Alimentar o Kanban de fora** — em implementação. **Solução A (Bearer token) CONCLUÍDA** (build+tsc+435 testes verdes): modelo `ApiToken`, `resolveActor`, swap nas rotas de demanda/subtasks/links, script gerador. Fundação **multi-empresa** também pronta (modelo `UserCompany`, helpers set-based, `companyIds` na sessão). Schema aplicado no Neon (aditivo, ADR-008). **Falta:** gerar o token admin (rodar o script), converter as ~12 rotas restantes p/ conjunto, UI multi-empresa, configurar Marcos + token Marcos, e Solução B (MCP `defenz-mcp`).

## In progress
- **feature-multi-company-membership (Fase D)**: aplicar conjunto às rotas restantes (users/[id] PUT com `companyIds`, teams, invites, companies, audit-logs, report, import) + UI Configurações→Usuários (multi-select) + configurar Marcos.
- **feature-external-kanban-feed (Solução B)**: MCP server `defenz-mcp` (4 tools sobre /api/demandas via Bearer). Depende da Solução A (pronta).
- feature-assignee-fk-migration continua aguardando deploy ordenado.

## Gerar tokens (após Solução A)
```bash
npx tsx scripts/create-api-token.ts --role admin --name admin-cli      # token admin (acesso total)
# (após configurar Marcos multi-empresa, Fase D)
npx tsx scripts/create-api-token.ts --email <marcos@...> --name marcos-mcp
```

## Recently completed (last 5)
- 2026-06-03 feature-demanda-dependencies — edição de dependências de Demanda (combobox no modal) + guardas self/ciclo/inválido (detectCycle em src/lib/dependency-graph.ts) + deps clicáveis (card e modal abrem a tarefa da dependência). Módulo `activities` órfão removido. Validado em localhost. 407 testes.
- 2026-06-03 feature-time-tracking — controle de horas gastas/estimadas em Demanda + Subtask (minutos canônicos, UI horas decimais), badge no card, inputs no modal/subtarefas, AuditLog. Schema no Neon dev via `db push`. Validado em localhost.
- 2026-04-28 feature-assignee-fk-migration (código) — schema + migration SQL + backfill + POST/PUT/GET/DELETE com FK source-of-truth + Phase 1 fallback (331 testes)
- 2026-04-28 feature-bugfix-assignee-visibility (Phase 1) — user assignee passa a ver/editar/deletar demanda em qualquer team da própria company (318 testes)
- 2026-04-14 feature-bugfix-date-timezone — parseLocalDate() + fix em /api/demandas (298 testes)
- 2026-04-11 feature-tenant-isolation — 6 rotas protegidas + testes (289 passando, build OK)
- 2026-04-11 harness install — PROGRESS/SPEC/ARCHITECTURE/CHANGELOG + CLAUDE.md tighten
- 2026-04-05 feature-executive-report — relatório executivo com slides via Gemini (1c3787c)

## Next up (priority order)
0. **Alimentar o Kanban de fora (chat/projeto externo)** — ver `docs/features/feature-external-kanban-feed.md`. Decidir: (a) auth de serviço (token + escopo company/team), (b) entrega via curl na API atual ou via MCP server Defenz. Brainstorm no início da próxima sessão.
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
