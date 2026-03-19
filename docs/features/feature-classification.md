# Feature: Campo Classificacao nas Demandas
**Status:** Done
**Priority:** P1
**Date:** 2026-03-19

## Objective
Adicionar campo "Classificacao" nas Demandas para categorizar por area/departamento, com visualizacao no Kanban, Lista, Timeline e Analises.

## Behavior
1. Ao criar/editar demanda, usuario seleciona classificacao opcional
2. Classificacao aparece como badge colorido no Kanban card
3. Classificacao aparece como coluna na lista
4. Timeline agrupa demandas por classificacao com secoes recolhiveis
5. Analises mostra grafico de distribuicao por classificacao + filtro

## Business Rules
- Campo opcional (nullable)
- 9 categorias fixas: Marketing, Administrativo, Vendas, Financeiro, Operacional, Tecnologia, Juridico, RH, Estrategico
- Cada categoria tem cor propria
- Demandas sem classificacao ficam em grupo "Sem classificacao" na timeline

## Edge Cases
- Demanda sem classificacao -> exibida normalmente, sem badge
- Filtro por classificacao nas analises inclui opcao "Sem classificacao"
- Timeline com todas as classificacoes colapsadas -> apenas headers visiveis

## Data Contract
- Input: classification?: string (enum) no create/update
- Output: classification no GET (campo no objeto Demanda)
- Persistence: coluna classification String? no model Demanda (PostgreSQL)

## Acceptance Criteria
- [x] Campo classification adicionado no schema Prisma
- [x] Zod valida classification como enum opcional
- [x] API POST/PUT aceita e persiste classification
- [x] API GET retorna classification
- [x] Modal de demanda tem dropdown de classificacao
- [x] Kanban card mostra badge de classificacao
- [x] Lista mostra coluna Classificacao
- [x] Timeline agrupa por classificacao com expand/collapse
- [x] Analises mostra grafico por classificacao
- [x] Analises tem filtro por classificacao
- [x] CLASSIFICATIONS constante exportada em helpers.ts
- [x] emptyForm inclui classification: null
- [x] Testes cobrem validacao, API, helpers e tipos

## Technical Decisions
- Categorias hardcoded (nao precisa CRUD de categorias por ora)
- String em vez de enum no Prisma (mais flexivel para adicionar categorias)
- Agrupamento na timeline gerenciado com useState local

## Dependencies
- Depends on: Demanda model, Kanban, Lista, Gantt, Analises
- Blocks: nada
