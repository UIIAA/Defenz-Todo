# Feature: Bugfix — Assignee não vê a própria demanda
**Status:** Approved
**Priority:** P0
**Date:** 2026-04-28

## Objective
Garantir que ao ser atribuído como responsável (`assignee`) de uma demanda, o usuário (`role = user`) consiga visualizar, editar e deletar essa demanda — independente do team — desde que esteja na mesma company.

## Behavior
1. Marcos (role `user`, team A) cria uma demanda e atribui Leonardo (role `user`, team B, mesma company) no campo de responsável.
2. POST `/api/demandas` grava `demanda.assignee = "Leonardo"` (string), `teamId = team A`, `companyId = company X`.
3. Leonardo faz GET `/api/demandas`. A demanda aparece na resposta porque `demanda.assignee === (Leonardo.name ?? Leonardo.email)` e `demanda.companyId === Leonardo.companyId`.
4. Leonardo edita o status da demanda (PUT) → 200, persiste.
5. Leonardo deleta a demanda (DELETE) → 200.

## Business Rules
- **Assignee match key**: server compara `demanda.assignee` com `(user.name ?? user.email)` — mesma coalesce que o frontend usa para popular o `<SelectItem value={u.name || u.email}>` em `demanda-modal.tsx`.
- **Tenant guard**: o match por assignee SÓ vale dentro da mesma `companyId`. Nunca cruza company.
- **Admin** continua cross-company sem alteração.
- **Gerencia** continua scoped por company sem alteração.
- **User**: visibilidade e autorização agora são `team OR assignee` (com tenant guard no assignee).

## Edge Cases
- User sem team mas é assignee de demandas na sua company → vê apenas as demandas atribuídas a ele (não retorna `[]` mais).
- Demanda com `assignee = null` → comportamento inalterado (só vê via team).
- User com `name = null` mas com `email` → match cai pra email.
- User com `companyId = null` (caso raro/legacy) → não vê nenhuma demanda via assignee (tenant guard nega).
- Dois users com mesmo `name` na mesma company → ambos veem demandas um do outro. Aceito como débito; resolvido pela Phase 2 (FK).
- User troca de `name` → demandas antigas com nome velho ficam invisíveis até serem reassignadas. Aceito como débito; resolvido pela Phase 2.

## Data Contract
- Nenhuma mudança de schema. `Demanda.assignee` continua string livre.
- Nenhuma migration.
- Frontend (`demanda-modal.tsx`) inalterado.

## Acceptance Criteria
- [ ] User assignee de demanda no próprio team: vê (regressão).
- [ ] User assignee de demanda em outro team da MESMA company: vê.
- [ ] User assignee de demanda em outro team da MESMA company: edita (PUT 200).
- [ ] User assignee de demanda em outro team da MESMA company: deleta (DELETE 200).
- [ ] User assignee de demanda em OUTRA company: não vê (where guard).
- [ ] User assignee de demanda em OUTRA company: PUT/DELETE retornam 403.
- [ ] User sem team mas assignee na própria company: vê suas demandas.
- [ ] Admin/gerencia: comportamento inalterado.
- [ ] Tenant isolation: nenhum vazamento cross-company.
- [ ] Build, type-check e suite de testes passando.

## Technical Decisions
- Match por string (não FK) é admittedly frágil. Optamos por essa abordagem na Phase 1 por ser mínima e não exigir migration. Phase 2 (`feature-assignee-fk-migration.md`) elimina a fragilidade.
- `assigneeKey = user.name ?? user.email` espelha exatamente a lógica do frontend select. Manter sincronizado se o select mudar.
- Tenant guard via `companyId` no próprio `where` (não em pós-filter) para zero risco de vazamento.

## Files Changed
- `src/app/api/demandas/route.ts`:
  - GET (linhas 36-49): role `user` agora monta `where.OR = [...]` com cláusulas de team e assignee+companyId.
  - PUT (linhas 134-140): autorização `user` permite edição se for `inOwnTeam || isAssignee` (ambas com tenant guard).
  - DELETE (linhas 250-255): mesma regra do PUT.
- `src/app/api/demandas/__tests__/route.test.ts`: ajustes em 2 testes existentes (where do user vira OR; "no teams" agora chama findMany se for assignee), + ~7 testes novos.

## Dependencies
- Depende de: `getCurrentUser()` retornar `name`, `email`, `companyId` (já retorna).
- Bloqueia: nada. Phase 2 (`feature-assignee-fk-migration.md`) será o próximo passo.

## Verify
```bash
npx vitest run src/app/api/demandas/__tests__/route.test.ts
npx tsc --noEmit
npm run build && npm test
```

Manual (com `npm run dev`):
- Dois users da mesma company, em teams diferentes (Marcos/team A, Leonardo/team B).
- Marcos cria demanda com assignee=Leonardo → Leonardo loga → demanda visível, editável, deletável.
- User de outra company com `name` igual → demanda NÃO visível (tenant guard).
