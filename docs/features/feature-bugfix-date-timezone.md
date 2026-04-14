# Feature: Bugfix — Datas perdem 1 dia ao salvar
**Status:** Approved
**Priority:** P0
**Date:** 2026-04-14

## Objective
Corrigir bug em produção onde `dateIn`, `deadline`, `dateDone` e `reminderDate` perdem 1 dia ao salvar uma demanda.

## Problema
`src/app/api/demandas/route.ts` usa `new Date("YYYY-MM-DD")` para parsear inputs do form. Em Node, essa string é interpretada como UTC midnight (`2026-04-13T00:00:00Z`). Convertida para America/Sao_Paulo (GMT-3), vira `2026-04-12 21:00`. A leitura (`toDateStr` em `src/lib/date.ts`) formata em SP corretamente, então o usuário vê 12 em vez de 13.

## Behavior (correto)
1. Usuário cria demanda com data 13/04.
2. Form envia `"2026-04-13"`.
3. API parseia como meia-noite de São Paulo → `2026-04-13T03:00:00Z`.
4. Formatado em SP → `13/04/2026`. ✅

## Data Contract
- Input do form: `"YYYY-MM-DD"` (input type=date) ou ISO completo com timezone.
- Novo helper: `parseLocalDate(str: string | null | undefined): Date | null` em `src/lib/date.ts`.
  - `"2026-04-13"` → `new Date("2026-04-13T00:00:00-03:00")`.
  - `"2026-04-13T15:30:00Z"` ou outro ISO completo → passa direto (`new Date(str)`).
  - `null` / `undefined` / `""` → `null`.

## Business Rules
- Brasil não tem DST desde 2019 — offset fixo `-03:00`.
- `dateStarted` (set pelo servidor com `new Date()`) é timestamp, não date-only — mantém comportamento.
- Campos afetados: `dateIn`, `deadline`, `dateDone`, `reminderDate`.

## Acceptance Criteria
- [ ] Helper `parseLocalDate` em `src/lib/date.ts` com testes.
- [ ] POST `/api/demandas` usa `parseLocalDate` para `dateIn`, `deadline`, `dateDone`.
- [ ] PUT `/api/demandas` usa `parseLocalDate` para `dateIn`, `deadline`, `dateDone`, `reminderDate`.
- [ ] Teste: criar demanda com `dateIn="2026-04-13"` → após ler, `toDateStr(demanda.dateIn) === "2026-04-13"`.
- [ ] Teste: ISO completo passa direto sem alteração.
- [ ] `npm test && npx tsc --noEmit && npm run build` verde.

## Verify
```bash
npx vitest run src/lib/__tests__/date.test.ts
npm test
npm run build
```

Manual prod: criar demanda 13/04, salvar, reabrir — deve continuar 13/04.
