# Feature: Fix Filtros "Minhas" e Por Usuario
**Status:** Done
**Priority:** P1
**Date:** 2026-03-23

## Objective
Tornar os filtros de assignee robustos com comparacao case-insensitive e fallback por email.

## Behavior
1. Quando usuario seleciona "Minhas", o sistema filtra demandas cujo assignee corresponde ao nome OU email do usuario logado (case-insensitive)
2. Quando usuario seleciona um nome especifico, o sistema filtra com comparacao case-insensitive
3. Quando usuario seleciona "Todos", todas as demandas sao exibidas

## Business Rules
- Comparacao de assignee e sempre case-insensitive
- Filtro "Minhas" tenta match por nome e por email (fallback)
- Se usuario nao tem demandas atribuidas, filtro retorna vazio (comportamento correto)

## Edge Cases
- Assignee salvo como email em vez de nome -> match pelo email
- Nome com capitalizacao diferente -> match case-insensitive
- Assignee null -> nunca faz match

## Data Contract
- Input: lista de Demanda[], filterAssignee string, userName string, userEmail string
- Output: Demanda[] filtradas

## Acceptance Criteria
- [x] Filtro __mine__ encontra demandas pelo nome (case-insensitive)
- [x] Filtro __mine__ encontra demandas pelo email quando assignee e email
- [x] Filtro __mine__ retorna vazio quando nenhuma demanda pertence ao usuario
- [x] Filtro por nome especifico funciona com case diferente
- [x] Filtro 'all' retorna todas as demandas

## Technical Decisions
- Funcao `filterByAssignee` extraida para `helpers.ts` como funcao pura testavel
- Mantido `assignee` como string (nome) — nao migrado para ID por ser suficiente
- Comparacao case-insensitive via `.toLowerCase()`
