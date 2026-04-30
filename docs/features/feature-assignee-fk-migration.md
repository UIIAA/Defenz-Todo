# Feature: Migração `assignee` (string) → `assignedToId` (FK User)
**Status:** In Progress (código pronto; aguardando aplicação da migration + backfill em ambientes)
**Priority:** P1
**Date:** 2026-04-28

## Objective
Eliminar a fragilidade do match por string ao identificar o responsável de uma Demanda. Migrar `Demanda.assignee` (string livre) para `Demanda.assignedToId` (FK opcional para `User`), com backfill dos dados existentes.

## Context (porque essa feature existe)
A Phase 1 (`feature-bugfix-assignee-visibility`) resolveu o bug imediato: assignee passou a ver/editar/deletar a demanda. Porém usa match por string `(user.name ?? user.email)`, que carrega 7 prejuízos:
1. Nomes duplicados na mesma company → cross-visibility entre homônimos
2. Troca de `name` no perfil invisibiliza demandas antigas
3. Inconsistência name ↔ email no histórico
4. Whitespace/case sensitivity no match
5. AuditLog grava string — forensics frágil
6. Sem referential integrity (user deletado deixa string órfã)
7. Débito de código no `OR` inline

Esta Phase 2 elimina esses 7 problemas substituindo o match por FK.

## Behavior
1. Modal de demanda passa a enviar `assignedToId` (cuid) em vez de `assignee` (string).
2. POST/PUT validam `assignedToId` e gravam a FK.
3. GET lista demandas onde `teamId ∈ user.teamIds` OR `assignedToId === user.id`.
4. PUT/DELETE autorizam role `user` se `inOwnTeam || current.assignedToId === user.id`.
5. Audit log grava `assignedToId` (resolve nome no display via include).
6. `assignee` (string) permanece no schema durante uma janela de compatibilidade; pode ser populado a partir do nome do User ao gravar (display-only) e dropado em migration posterior.

## Business Rules
- `assignedToId` opcional (demandas sem responsável definido continuam válidas).
- Se `assignedToId` é setado, o User referenciado deve estar na mesma `companyId` da demanda. Validação no POST/PUT.
- `onDelete: SetNull` na relation: deletar User deixa demanda com `assignedToId = null` (não cascateia).
- Tenant guard mantido: filtro `assignedToId === user.id` funciona naturalmente sem precisar checar company (User já é hard-scoped).

## Edge Cases
- Backfill não-resolvido: string `assignee` que não casa com nenhum `User` da mesma company → loga em `unresolved_assignees.log`, deixa `assignedToId = null`, mantém string em `assignee` para revisão manual.
- Múltiplos users com mesmo `name` na mesma company durante backfill → escolher o mais antigo (createdAt asc) e logar warning para revisão.
- Demanda em company que não existe mais → backfill ignora.
- User admin atribuído a demanda de outra company: permitido (admin é cross-company por design).
- Após migration, frontend antigo enviando `assignee` string: API rejeita ou converte? Decisão: aceitar com deprecation warning durante 1 semana, depois rejeitar.

## Data Contract
### Schema change
```prisma
model Demanda {
  // ...campos existentes...
  assignee       String?   // DEPRECATED — manter durante janela de compat, dropar em migration futura
  assignedToId   String?
  assignedTo     User?     @relation("DemandaAssignedTo", fields: [assignedToId], references: [id], onDelete: SetNull)

  @@index([assignedToId])
}

model User {
  // ...
  demandasAssigned Demanda[] @relation("DemandaAssignedTo")
}
```

### Migration SQL esperada
```sql
ALTER TABLE "demandas" ADD COLUMN "assignedToId" TEXT;
CREATE INDEX "demandas_assignedToId_idx" ON "demandas"("assignedToId");
ALTER TABLE "demandas" ADD CONSTRAINT "demandas_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
```

### Backfill script (`scripts/backfill-assignee.ts`)
Pseudo-código:
```ts
const demandasWithAssignee = await db.demanda.findMany({
  where: { assignee: { not: null }, assignedToId: null },
})
const unresolved: { demandaId: string; assignee: string; companyId: string | null }[] = []
for (const d of demandasWithAssignee) {
  if (!d.companyId) { unresolved.push(...); continue }
  const candidates = await db.user.findMany({
    where: {
      companyId: d.companyId,
      OR: [{ name: d.assignee }, { email: d.assignee }],
    },
    orderBy: { createdAt: 'asc' },
  })
  if (candidates.length === 0) { unresolved.push(...); continue }
  if (candidates.length > 1) console.warn(`Multiple matches for "${d.assignee}" in ${d.companyId}, picking oldest`)
  await db.demanda.update({ where: { id: d.id }, data: { assignedToId: candidates[0].id } })
}
fs.writeFileSync('unresolved_assignees.log', JSON.stringify(unresolved, null, 2))
console.log(`Resolved: ${demandasWithAssignee.length - unresolved.length}, Unresolved: ${unresolved.length}`)
```

## Acceptance Criteria
- [ ] Schema Prisma com `assignedToId` (FK + relation + index) + `onDelete: SetNull`.
- [ ] Migration aplicada em dev + staging.
- [ ] Backfill script idempotente (rodar 2x não duplica nem corrompe).
- [ ] Backfill com log de não-resolvidos.
- [ ] POST `/api/demandas` aceita `assignedToId` e valida que o User está na mesma company.
- [ ] PUT `/api/demandas` aceita `assignedToId`.
- [ ] GET `/api/demandas` filtra para role `user` por `teamId ∈ user.teamIds` OR `assignedToId === user.id`.
- [ ] PUT/DELETE: role `user` autorizado se `inOwnTeam || assignedToId === user.id`.
- [ ] Audit log grava `assignedToId` (display resolve nome via include).
- [ ] Modal `demanda-modal.tsx`: `<SelectItem value={u.id}>`, label exibe `u.name || u.email`.
- [ ] Form schema/Zod aceita `assignedToId` (cuid string).
- [ ] Tests: unit + integration cobrindo happy path + tenant guard + onDelete behavior.
- [ ] Build, type-check, suite full passando.
- [ ] Manual: criar demanda atribuída, trocar `name` do user, demanda continua visível (eliminou prejuízo #2).
- [ ] Migration de drop da coluna `assignee` (separada, em PR posterior, após validação em prod por 1+ semana).

## 13 Movimentos (resumo executável)
1. `prisma/schema.prisma` — add `assignedToId`, relation `assignedTo`, index, contra-relação no User
2. `npx prisma migrate dev --name add_assignee_fk` — gera migration
3. `scripts/backfill-assignee.ts` — script de backfill com logging de não-resolvidos
4. `src/lib/validations/demanda.ts` — Zod aceita `assignedToId: z.string().cuid().nullable().optional()`
5. `src/app/api/demandas/route.ts` POST — receber `assignedToId`, validar mesma company
6. `src/app/api/demandas/route.ts` PUT — aceitar `assignedToId`, manter validação de company
7. `src/app/api/demandas/route.ts` GET — `OR: [{ teamId in [...] }, { assignedToId: user.id }]` (sem string match)
8. `src/app/api/demandas/route.ts` PUT/DELETE auth — `current.assignedToId === user.id` em vez de string match
9. `src/components/demandas/demanda-modal.tsx` — `<SelectItem value={u.id}>`; form envia ID
10. `src/lib/audit.ts` (ou consumidor) — TRACKED_FIELDS troca `assignee` → `assignedToId`; display resolve nome
11. Tests — reescrever (~10-15 testes), incluir teste do backfill (com fixture)
12. Deploy ordenado:
    - Step A: aplicar migration via `prisma migrate deploy` (DIRECT_URL)
    - Step B: rodar `tsx scripts/backfill-assignee.ts`
    - Step C: deploy do código novo (Vercel)
    - Step D: monitorar `unresolved_assignees.log` por 24h
13. (PR posterior, ~1 semana após) `npx prisma migrate dev --name drop_assignee_string` — remove a coluna `assignee` (após validar zero regressão e zero não-resolvidos)

## Technical Decisions
- **Manter `assignee` string durante janela de compat**: evita big-bang. Permite rollback rápido (drop só da FK, app usa string de novo).
- **`onDelete: SetNull`**: deletar User não cascateia em Demanda. Demanda fica órfã (`assignedToId = null`) mas preservada — alinhado com o comportamento atual (string órfã).
- **Validação de company no POST/PUT**: assignee precisa estar na mesma company. Isso é nova restrição, mas natural (não fazia sentido atribuir cross-company).
- **Backfill idempotente**: filtra por `assignedToId IS NULL` para permitir re-runs.
- **Não tocar em GET filter de admin/gerencia**: comportamento já correto, só user role muda.

## Rollback Plan
Se algo der errado pós-deploy:
1. Reverter o deploy do código (Vercel — instantâneo).
2. App volta a usar `assignee` string. FK fica populada mas não consultada.
3. Em caso extremo: rodar migration de rollback que dropa a coluna `assignedToId` + foreign key.
4. Backfill é não-destrutivo (não deleta a string `assignee`), então rollback é seguro.

## Dependencies
- Depende de: Phase 1 (`feature-bugfix-assignee-visibility`) implementada e validada em prod.
- Bloqueia: nada urgente. É débito técnico, não regressão.

## Verify (quando implementar)
```bash
# 1. Migration
npx prisma migrate dev --name add_assignee_fk
# 2. Backfill (dev DB com dados de teste)
npx tsx scripts/backfill-assignee.ts
cat unresolved_assignees.log
# 3. Tests
npx vitest run src/app/api/demandas/__tests__/route.test.ts
npx vitest run scripts/__tests__/backfill-assignee.test.ts
# 4. Full
npx tsc --noEmit && npm run build && npm test
```

Manual:
- Criar demanda assigned-to user X.
- Trocar `name` do user X no perfil → demanda continua visível e editável (prejuízo #2 eliminado).
- Criar 2 users com mesmo nome em companies diferentes → cada um vê só a própria demanda (prejuízo #1 eliminado).
- Deletar user X → demanda fica com `assignedToId = null`, não corrompe.
