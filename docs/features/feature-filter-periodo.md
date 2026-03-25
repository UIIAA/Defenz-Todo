# Feature: Filtro de Periodo para Demandas
**Status:** In Progress
**Priority:** P1
**Date:** 2026-03-23

## Objective
Permitir filtrar demandas por periodo (esta semana, semana passada, este mes, personalizado) para facilitar reunioes de review semanal.

## Behavior
1. Usuario clica em uma pill de periodo na barra de filtros
2. Sistema filtra demandas concluidas por `dateDone` e demais por `dateIn`
3. Resultado mostra apenas demandas do periodo selecionado

## Business Rules
- Demandas com status "concluida": filtro age sobre `dateDone`
- Demais demandas: filtro age sobre `dateIn`
- Semana comeca na segunda-feira (padrao BR)
- Datas calculadas em timezone America/Sao_Paulo
- Demanda concluida sem `dateDone` e excluida do filtro de periodo
- Demanda nao-concluida sem `dateIn` e excluida do filtro de periodo

## Edge Cases
- Demanda concluida com dateDone null → excluida quando filtro de periodo ativo
- Demanda nao-concluida com dateIn null → excluida quando filtro de periodo ativo
- Filtro "Todas" → sem filtro de data (comportamento default)

## Data Contract
- Input: `PeriodFilter` ('all' | 'this_week' | 'last_week' | 'this_month' | 'custom')
- Input (custom): `customFrom?: string`, `customTo?: string` (YYYY-MM-DD)
- Output: array filtrado de Demanda[]

## Acceptance Criteria
- [ ] Filtro "Todas" retorna todas as demandas (default)
- [ ] Filtro "Esta semana" filtra concluidas por dateDone na semana atual
- [ ] Filtro "Esta semana" filtra nao-concluidas por dateIn na semana atual
- [ ] Filtro "Semana passada" filtra pela semana anterior
- [ ] Filtro "Este mes" filtra pelo mes atual
- [ ] Filtro "Personalizado" aceita range de/ate
- [ ] Edge case: concluida sem dateDone excluida
- [ ] Edge case: nao-concluida sem dateIn excluida
- [ ] Stats cards refletem filtro de periodo
- [ ] UI pills seguem mesmo padrao visual dos filtros existentes

## Technical Decisions
- Funcao `filterByPeriod()` pura em helpers.ts (testavel)
- Helpers de data em src/lib/date.ts (getWeekRange, getLastWeekRange, getMonthRange)
- Filtro client-side (mesmo padrao dos filtros existentes)

## Dependencies
- Depends on: campo `dateDone` no schema (ja existe)
- Depends on: campo `dateIn` no schema (ja existe)
- Blocks: nenhum
