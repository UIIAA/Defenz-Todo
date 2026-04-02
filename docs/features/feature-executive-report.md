# Feature: Relatorio Executivo com IA
**Status:** Done
**Priority:** P1
**Date:** 2026-04-02

## Objetivo
Gerar relatorio executivo a partir de demandas concluidas usando Gemini AI, para apresentar a stakeholders.

## Comportamento
1. Admin/gerencia acessa /dashboard/demandas/relatorio
2. Seleciona periodo (7d, 14d, 30d, 60d, 90d ou custom) + filtros de empresa/equipe
3. Clica "Gerar Relatorio" — IA analisa titulos, descricoes, subtasks e links
4. Relatorio renderizado em markdown com botoes Copiar e Imprimir

## Criterios de Aceitacao
- [x] API POST /api/report/executive com Gemini
- [x] Filtros por periodo, empresa, equipe
- [x] Role-based: admin/gerencia only
- [x] Pagina UI com react-markdown
- [x] Botoes Copiar e Imprimir
- [x] Link no sidebar (admin/gerencia)
- [x] 8 testes cobrindo API
