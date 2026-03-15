# Feature: Board Compartilhado de Equipe
**Status:** Approved
**Priority:** P0
**Date:** 2026-03-15

## Objective
Transformar o Defenz de visao individual para board compartilhado de equipe. Todos veem todas as demandas. Filtro opcional por responsavel. Ideal para tela fixa (TV) onde toda equipe acompanha em tempo real.

## Mudancas Necessarias

### 1. API — Remover filtro userId no GET
- GET /api/demandas retorna TODAS as demandas (nao mais filtrada por userId)
- POST mantém userId como criador (para audit)
- PUT/DELETE: qualquer usuario autenticado pode editar/excluir (board colaborativo)
- Adicionar campo `createdBy` visivel nos dados retornados

### 2. Filtro por Responsavel no Frontend
- Novo filtro "Responsavel" ao lado dos filtros de origem
- Opcoes: "Todos", "Minhas" (filtra assignee === session.user.name), cada pessoa
- Pill button igual aos de origem

### 3. Auto-refresh para modo TV
- Polling a cada 30 segundos para atualizar dados
- Indicador "Atualizado ha X min" discreto
- Botao refresh manual

### 4. Dashboard Home tambem compartilhado
- KPIs mostram dados de toda equipe
- Atividade recente de todos

## Arquivos Afetados
- src/app/api/demandas/route.ts — remover userId filter no GET, flexibilizar PUT/DELETE
- src/app/dashboard/demandas/page.tsx — filtro responsavel + auto-refresh
- src/app/dashboard/page.tsx — dados compartilhados

## Acceptance Criteria
- [ ] GET /api/demandas retorna todas demandas
- [ ] Qualquer usuario pode editar/excluir qualquer demanda
- [ ] Filtro "Responsavel" funciona (Todos / Minhas / por pessoa)
- [ ] Auto-refresh a cada 30s
- [ ] Dashboard home mostra dados de equipe
- [ ] Testes passam
- [ ] Build passa
