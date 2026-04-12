# Feature: Tenant Isolation (Company scoping)
**Status:** Approved
**Priority:** P0
**Date:** 2026-04-11

## Objective
Garantir que roles `gerencia` e `user` nunca vejam nem manipulem dados de outras empresas. Apenas `admin` é cross-company.

## Behavior
1. Quando usuário `gerencia` (ou `user`) faz qualquer requisição a uma rota API que toca dados scoped (Demanda, Subtask, Link, User, Invite, AuditLog), o servidor deve filtrar/verificar por `session.user.companyId`.
2. Se a entidade solicitada não pertence à company do usuário, responder `403 FORBIDDEN_COMPANY`.
3. `admin` mantém acesso cross-company (sem filtro, ou respeitando query param `companyId` explícito).
4. UI: componente `company-selector` só renderiza para `admin`.

## Business Rules
- `admin` → sem restrição de company.
- `gerencia` → `where.companyId = session.user.companyId` em todo listagem; bloquear mutação cross-company com 403.
- `user` → mesma regra que gerencia para company; restrições adicionais de team já existentes permanecem.
- Em POST/PUT com `companyId` no body: para não-admin, ignorar o valor enviado e forçar `session.user.companyId`.

## Edge Cases
- `AuditLog` pode não ter `companyId` — verificar schema. Se faltar: adicionar coluna + migration (backfill via join com entity) ou scope via entity lookup.
- Demanda com `companyId` null (legacy): tratar como inacessível para não-admin.
- Admin sem `companyId` no selector: listar todas as companies.

## Data Contract
- Nenhuma mudança de schema obrigatória exceto (talvez) `AuditLog.companyId`.
- Novo helper: `assertCompanyAccess(entityCompanyId: string | null, user: SessionUser): void` em `src/lib/auth.ts`.

## Acceptance Criteria
- [ ] `gerencia` da Defenz faz GET `/api/demandas` e não vê nenhuma demanda da Cow Cycling.
- [ ] `gerencia` da Defenz faz GET `/api/users` e vê apenas users da Defenz.
- [ ] `gerencia` da Defenz faz GET `/api/invites` e vê apenas invites da Defenz.
- [ ] `gerencia` da Defenz faz GET `/api/audit-logs` e vê apenas logs da Defenz.
- [ ] `gerencia` da Defenz faz POST/PUT/DELETE em `/api/demandas/<cowcycling-id>/links` e recebe 403.
- [ ] `gerencia` da Defenz faz POST/PUT/DELETE em `/api/demandas/<cowcycling-id>/subtasks` e recebe 403.
- [ ] `gerencia` da Defenz tenta criar invite com `companyId` de Cow Cycling no body — invite criado com companyId da Defenz (forçado).
- [ ] `admin` mantém acesso cross-company em todas as rotas acima.
- [ ] `user` role recebe 403 em `/api/users`, `/api/invites`, `/api/audit-logs`.
- [ ] UI: `company-selector` não renderiza para gerencia/user.
- [ ] Testes automáticos cobrindo happy path + forbidden path para cada endpoint afetado.

## Technical Decisions
- **Helper centralizado** `assertCompanyAccess` em `src/lib/auth.ts` para single source of truth.
- **Não alterar** rotas já corretas: `demandas/route.ts` (GET/POST/PUT), `teams/route.ts`, `companies/route.ts`, `report/executive/route.ts`.
- **Rotas a alterar:**
  1. `src/app/api/demandas/[id]/links/route.ts`
  2. `src/app/api/demandas/[id]/subtasks/route.ts`
  3. `src/app/api/demandas/[id]/subtasks/[subtaskId]/route.ts`
  4. `src/app/api/users/route.ts`
  5. `src/app/api/invites/route.ts`
  6. `src/app/api/audit-logs/route.ts`
- **UI gate:** `src/components/company-selector.tsx` retorna `null` para não-admin.

## Dependencies
- Depende de: sessão carregar `companyId` e `role` (já carrega — ADR-001).
- Bloqueia: nada explicitamente, mas é P0 de segurança.

## Verify
```bash
npx tsc --noEmit
npx vitest run src/lib/__tests__/auth.test.ts
npx vitest run src/app/api/**/__tests__/*.tenant.test.ts
npm run build && npm test
```

Manual:
- Login como gerencia Defenz → navegar Demandas, Usuários, Logs, Convites → nenhum dado de Cow Cycling visível.
- Login como admin → company-selector visível → conseguir alternar entre empresas.
