# PROGRESS — Defenz To-Do

**Last updated:** 2026-04-11
**Version:** 0.2.0
**Branch:** main

## Current focus
Harness instalado + P0 tenant isolation ENTREGUE. Próximo: cleanup dos `.md` antigos no root.

## In progress
(nenhum)

## Recently completed (last 5)
- 2026-04-11 feature-tenant-isolation — 6 rotas protegidas + testes (289 passando, build OK)
- 2026-04-11 harness install — PROGRESS/SPEC/ARCHITECTURE/CHANGELOG + CLAUDE.md tighten
- 2026-04-05 feature-executive-report — relatório executivo com slides via Gemini (1c3787c)
- 2026-04-03 feature-reminders — cron diário de reminder emails (ad8f7c1)
- 2026-04-03 feature-demanda-links — links + CRUD de empresas (c8ed653)
- 2026-03-29 feature-company-management — hierarquia Company>Team + branding (eebe6e9)
- 2026-03-15 feature-enterprise-polish — 3 sprints de polish

## Next up (priority order)
1. Executar feature-tenant-isolation (P0 — vazamento de dados entre empresas)
2. Criar testes de tenant isolation para evitar regressão
3. Auditar os `.md` antigos no root (MIGRATION_REPORT.md, EXECUTIVE_SUMMARY.md, etc.) — mover para `docs/archive/` ou deletar
4. Atualizar README.md (atualmente refere Next.js 15 / SQLite / Activity — está desatualizado)

## Known blockers / open questions
- `AuditLog` não tem `companyId` — scoping feito via `user.companyId` join. Funciona para o caso real (gerencia não vê logs de outra company), mas considerar adicionar `companyId` denormalizado no futuro para performance.

## Verify commands (DoD gate)
```bash
npm run build && npx tsc --noEmit && npm test
```

## Handoff notes
- Sempre ler este arquivo no início da sessão.
- Antes de codar qualquer feature nova: criar `docs/features/feature-<slug>.md`, obter approval, então codar.
- README.md está stale. Fontes de verdade: `.claude/CLAUDE.md` + `docs/`.
- Admin role = cross-company. `gerencia`/`user` = scoped ao `session.user.companyId` (ver feature-tenant-isolation).
