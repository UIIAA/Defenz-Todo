# Feature: Busca abre demanda selecionada
**Status:** In Progress
**Priority:** P1
**Date:** 2026-04-17

## Objective
Clicar em resultado da busca (Cmd+K) abre o modal da demanda para edição.

## Behavior
1. Usuário abre busca (Cmd+K), digita, clica no resultado.
2. Se não estiver em `/dashboard/demandas`, navega até lá com `?demandaId=<id>`.
3. Página lê o param, encontra a demanda, abre modal.
4. Param é limpo da URL após abrir.

## Acceptance Criteria
- [ ] Clicar resultado → modal abre com dados corretos.
- [ ] Funciona navegando de outra página e já estando na página.
- [ ] Param limpo após abrir (sem re-trigger no back).
- [ ] Demanda inexistente no array → nenhum crash.
- [ ] Tests + tsc + build verdes.
