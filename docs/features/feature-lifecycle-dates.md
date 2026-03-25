# Feature: Lifecycle de Datas das Demandas
**Status:** In Progress
**Priority:** P1
**Date:** 2026-03-23

## Objective
Rastrear quando o trabalho realmente comecou (`dateStarted`) e registrar reaberturas de demandas concluidas.

## Behavior
1. Quando demanda move para `em_andamento` pela primeira vez, `dateStarted` e setado
2. Quando demanda concluida e reaberta, `dateDone` e limpo e nota appended na description
3. Timeline (Gantt) filtra apenas `selecionada` e `em_andamento`, usando `dateStarted` como inicio da barra

## Business Rules
- `dateStarted` so e setado na PRIMEIRA vez em `em_andamento`. Nunca sobrescrito.
- Ida e volta (em_andamento -> bloqueada -> em_andamento) preserva `dateStarted`
- Reabertura (concluida -> qualquer): limpa `dateDone`, appenda nota na description
- Timeline mostra apenas demandas selecionadas e em andamento

## Edge Cases
- Demanda criada diretamente como `em_andamento` -> `dateStarted` setado no POST
- Demanda sem `dateStarted` em `em_andamento` no Gantt -> fallback para `dateIn`

## Data Contract
- Input: status change via PUT /api/demandas
- Output: `dateStarted: DateTime?` no modelo Demanda
- Persistence: campo `dateStarted` na tabela demandas

## Acceptance Criteria
- [ ] Mover para em_andamento seta dateStarted; ida e volta preserva o valor
- [ ] Reabertura: dateDone limpo, nota appended na description
- [ ] Timeline filtra apenas selecionada + em_andamento
- [ ] Barra de em_andamento usa dateStarted como inicio
- [ ] Modal exibe dateStarted read-only

## Technical Decisions
- Logica autoritativa no server (API route), optimistic update no client
- Sem funcao pura extraida — logica inline no handler

## Dependencies
- Depends on: schema Demanda existente
- Blocks: nenhum
