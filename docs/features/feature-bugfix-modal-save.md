# Feature: Bugfix — Modal de Demanda nao salva com Classificacao
**Status:** Done
**Priority:** P0
**Date:** 2026-03-19

## Objective
Fix silent save failure when creating/editing demandas with classification selected but no assignee.

## Behavior
1. When user creates a demanda with classification but without assignee
2. System accepts `assignee: null` in Zod validation
3. Result: demanda is saved and modal closes; errors show toast feedback

## Business Rules
- `assignee` field accepts `string | null | undefined`
- Failed saves must always show user-visible error feedback via toast

## Edge Cases
- `assignee: null` (no assignee selected) → accepted
- `assignee: undefined` (field omitted) → accepted
- `assignee: 123` (wrong type) → rejected by Zod
- API returns non-success → toast.error shown to user

## Acceptance Criteria
- [x] Zod schema accepts `null` for `assignee` field
- [x] `handleSave` shows toast.error when API returns `success: false`
- [x] `handleSave` shows toast.error on network/catch errors
- [x] All existing tests continue passing
- [x] New validation tests cover null/undefined/string/invalid assignee
- [x] New API tests cover null assignee + classification combo

## Technical Decisions
- Used `.nullable().optional()` pattern consistent with `dateDone` and `classification` fields
- Also fixed `importItemSchema` assignee for consistency

## Dependencies
- Depends on: Feature K (Classification)
- Blocks: none
