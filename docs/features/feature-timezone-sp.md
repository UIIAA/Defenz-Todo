# Feature: Timezone Sao Paulo em todas as datas
**Status:** Done
**Priority:** P1
**Date:** 2026-03-23

## Objective
Garantir que todas as datas exibidas no sistema usem timezone America/Sao_Paulo explicitamente, independente do timezone do navegador ou servidor.

## Behavior
1. Toda exibicao de data/hora usa `timeZone: 'America/Sao_Paulo'` via `Intl.DateTimeFormat`
2. Funcoes `toDateStr()` e `todayStr()` retornam YYYY-MM-DD no fuso de SP
3. API continua retornando UTC (padrao correto) — a conversao acontece no frontend

## Business Rules
- Timezone fixo em America/Sao_Paulo (UTC-3 / UTC-2 no horario de verao)
- Banco armazena em UTC (padrao PostgreSQL) — nao alterar
- Formatacao centralizada em `src/lib/date.ts`

## Edge Cases
- Data UTC meia-noite (00:00Z) pode ser dia anterior em SP -> tratado corretamente
- Horario de verao brasileiro -> `Intl.DateTimeFormat` lida automaticamente

## Acceptance Criteria
- [x] Datas no Kanban card exibidas em SP timezone
- [x] Datas na lista de demandas exibidas em SP timezone
- [x] Datas nos logs de auditoria exibidas em SP timezone
- [x] Datas na pagina de usuarios exibidas em SP timezone
- [x] Gantt chart usa SP timezone
- [x] toDateStr/todayStr retornam data em SP timezone
- [x] Testes existentes atualizados para refletir timezone SP

## Technical Decisions
- Helper centralizado em `src/lib/date.ts` com funcoes: formatDateTime, formatDate, formatDateShort, formatDateShortYear, toDateStr, todayStr
- Re-export de toDateStr/todayStr em helpers.ts para manter compatibilidade com imports existentes
- Uso de `Intl.DateTimeFormat('en-CA')` para gerar YYYY-MM-DD (formato nativo do locale en-CA)

## Dependencies
- Nenhuma dependencia externa adicionada
