# Feature: Bugfix — Prisma Client desatualizado (classification)
**Status:** Done
**Priority:** P0
**Date:** 2026-03-19

## Objective
Fix `Unknown argument 'classification'` error when editing demandas — Prisma Client is out of sync with schema.

## Behavior
1. When user edits a demanda with `classification` field
2. System sends PUT to `/api/demandas` with classification value
3. Result: demanda updates successfully (no `Unknown argument` error)

## Business Rules
- `classification` is optional (nullable)
- Valid values: marketing, administrativo, vendas, financeiro, operacional, tecnologia, juridico, rh, estrategico

## Edge Cases
- classification = null → should save as null
- classification = "" → should save as null (coerced by route)

## Data Contract
- Input: `{ id, classification?: string }`
- Output: updated Demanda with classification field
- Persistence: `demandas.classification` column in PostgreSQL

## Acceptance Criteria
- [ ] `npx prisma validate` passes
- [ ] `npx prisma db push` syncs schema to DB
- [ ] `npx prisma generate` regenerates client with classification
- [ ] PUT test with classification passes
- [ ] All 148+ tests pass
- [ ] `npx tsc --noEmit` — 0 errors
- [ ] Manual test: edit demanda with classification saves OK

## Technical Decisions
Root cause: `prisma db push` + `prisma generate` were not run after adding `classification` to schema.prisma.

## Dependencies
- Depends on: schema.prisma (already correct), route.ts (already correct)
- Blocks: all demanda editing with classification
