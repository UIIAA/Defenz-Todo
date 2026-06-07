# Feature: Multi-empresa por usuário
**Status:** Approved
**Priority:** P1
**Date:** 2026-06-07

## Objective
Permitir que um usuário participe de mais de uma empresa, gerenciável em Configurações → Usuários (admin/gerência). No momento só o Marcos precisa, mas o modelo é genérico.

## Behavior
1. Admin/gerência edita um usuário e seleciona empresas adicionais (multi-select), além da empresa primária.
2. Sistema persiste as memberships em `UserCompany` (N:N), mantendo `User.companyId` como empresa **primária** (branding + default de criação).
3. Na sessão, o usuário carrega `companyIds[]` (conjunto acessível = `[companyId, ...companyIds]`).
4. Toda leitura/escrita scoped passa a usar o **conjunto** de empresas, não a empresa única.

## Business Rules
- `User.companyId` permanece (empresa primária — branding `logoUrl/accentColor`, default de POST demanda/import). `UserCompany` é **aditivo**.
- Conjunto acessível SEMPRE inclui a primária: `accessibleCompanyIds = dedup([companyId, ...companyIds])`. Admin → `null` (sem restrição).
- Gerência só pode atribuir/editar empresas **dentro do próprio conjunto** (sem escalonamento de privilégio); admin é livre.
- Criação (POST demanda/import/team/invite) usa `resolveActiveCompany(user, body.companyId)`: default = primária; só aceita outra empresa se ∈ conjunto.
- `demanda.companyId` é definido na criação e **imutável** no PUT (PUT só valida acesso ao conjunto).

## Edge Cases
- Usuário sem `companyIds` (single-company legado) → conjunto `[companyId]` (comportamento atual preservado).
- Usuário sem empresa nenhuma (não-admin) → conjunto vazio → `companyScopeWhere` retorna `{ companyId: '__none__' }` (bloqueia tudo).
- Empresa fora do conjunto em qualquer rota scoped → 403.
- Backfill incompleto: como o conjunto sempre inclui a primária, não há vazamento — só funcionalidade reduzida até o backfill rodar.

## Data Contract
- **UserCompany** (Prisma): `id`, `userId` FK→User (Cascade), `companyId` FK→Company (Cascade), `@@unique([userId, companyId])`, índices por `userId` e `companyId`.
- Sessão JWT ganha `companyIds: string[]` (derivado de `UserCompany`).
- `PUT /api/users/[id]` aceita `companyIds?: string[]` (sincroniza `UserCompany` via diff, espelhando o padrão de `teamIds`).

## Acceptance Criteria
- [ ] `accessibleCompanyIds`/`companyScopeWhere`/`assertCompanyAccess` operam por conjunto; single-company e admin inalterados (backward-compat).
- [ ] Usuário multi-empresa vê demandas das suas empresas e **não** vê de terceiros (403 em mutação fora do conjunto).
- [ ] UI Configurações → Usuários permite multi-select de empresas (só admin/gerência).
- [ ] `PUT /api/users/[id]` sincroniza `UserCompany`; gerência não atribui empresa fora do próprio conjunto (403).
- [ ] Marcos configurado com suas empresas.

## Technical Decisions
- Centralizar TODA a lógica de tenant em 4 helpers de `auth.ts` (`accessibleCompanyIds`, `assertCompanyAccess`, `companyScopeWhere`, `resolveActiveCompany`); rotas chamam helpers em vez de comparar `companyId` inline.
- `companyScopeWhere`: admin `{}`; conjunto 1 → scalar `{companyId}` (backward-compat); conjunto >1 → `{companyId:{in:[...]}}`; vazio → `{companyId:'__none__'}`.
- `src/lib/__tests__/auth-multicompany.test.ts` testa a impl REAL (fonte da verdade); `src/test/mocks/auth.ts` espelha em lockstep no mesmo commit.
- Migração aditiva no Neon único (ADR-008): `db push` → backfill idempotente (`--dry-run`, pula `companyId=null`, preflight de FK órfã).

## Dependencies
- Bloqueia: [[feature-api-service-token]] (scoping por conjunto é pré-requisito lógico do token seguro).
- Relacionado: [[feature-external-kanban-feed]].
