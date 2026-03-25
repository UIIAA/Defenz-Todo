# Feature: Filtro por Classificacao
**Status:** In Progress
**Priority:** P0
**Date:** 2026-03-24

## Objective
Permitir filtrar demandas por classificacao (marketing, tecnologia, vendas, etc.) no board, seguindo o mesmo padrao visual dos filtros de Origem e Responsavel.

## Behavior
1. Quando o usuario clica em uma classificacao no filter bar
2. Sistema filtra demandas mostrando apenas as da classificacao selecionada
3. Kanban, List View e Timeline refletem o filtro
4. Botao "Todas" remove o filtro

## Business Rules
- Demandas sem classificacao (null) nao aparecem quando um filtro especifico esta ativo
- Filtro compoe com os demais (Origem, Responsavel, Periodo)
- Botao ativo usa a cor da classificacao como background

## Edge Cases
- Demanda com classification = null → nao aparece ao filtrar por categoria especifica
- Nenhuma demanda na categoria → board vazio, stats zerados

## Data Contract
- Input: `Demanda.classification` (string | null), ja existente
- Output: lista filtrada de demandas
- Persistence: nenhuma (filtro client-side)

## Acceptance Criteria
- [ ] Filter bar mostra todas as 9 classificacoes como botoes
- [ ] Clicar em classificacao filtra board, list e timeline
- [ ] "Todas" mostra todas as demandas
- [ ] Filtro compoe com Origem, Responsavel e Periodo
- [ ] Testes unitarios passam

## Technical Decisions
- Reutiliza `CLASSIFICATIONS` de `helpers.ts` (ja existente)
- Zero mudancas em API, schema ou helpers
- Padrao visual identico ao filtro de Origem

## Dependencies
- Depends on: CLASSIFICATIONS constant, Demanda.classification field
- Blocks: nenhum
