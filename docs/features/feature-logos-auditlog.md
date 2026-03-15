# Feature: Logos Defenz + Audit Logs com menu admin
**Status:** In Progress
**Priority:** P0
**Date:** 2026-03-15

## Objective
Aplicar logos oficiais da Defenz, implementar audit logging nas operacoes de demandas, e criar pagina de logs acessivel apenas para admin/gerencia.

## Behavior
1. Logo da Defenz aparece no sidebar, login e registro
2. Toda criacao, edicao e exclusao de demandas grava um AuditLog
3. Usuarios com role admin ou gerencia veem menu "Logs" no sidebar
4. Pagina de logs exibe historico de alteracoes com filtros

## Acceptance Criteria
- [ ] Logo SVG da Defenz no sidebar, login e registro
- [ ] AuditLog gravado em create/update/delete de demandas
- [ ] API GET /api/audit-logs (admin/gerencia only)
- [ ] Pagina /dashboard/logs com tabela de logs e filtros
- [ ] Menu "Logs" visivel apenas para role admin ou gerencia
- [ ] Demanda tem campo version para optimistic locking
- [ ] Build passa sem erros
- [ ] Testes passam
