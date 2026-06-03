# Feature: Controle de Horas Gastas (Time Tracking)
**Status:** Done
**Priority:** P1
**Date:** 2026-06-03

## Objective
Registrar horas gastas (e estimadas, opcional) por Demanda e por Subtarefa no Kanban, para medir esforço real por tarefa — base para futura gestão de capacidade.

## Behavior
1. Ao editar uma Demanda, o usuário informa "Horas gastas" e, opcionalmente, "Horas estimadas" no modal.
2. Cada Subtarefa pode ter suas próprias horas gastas/estimadas.
3. O KanbanCard exibe um badge de relógio com o total gasto; se houver estimado, mostra `gasto/estimado` com alerta de cor quando gasto > estimado.
4. Total do card = horas próprias da demanda + soma das horas das subtarefas (aditivo, independente).

## Business Rules
- Entrada/exibição em horas decimais (`1,5h`); persistência canônica em minutos (Int).
- `estimatedMinutes` é opcional (nullable); `spentMinutes` default 0.
- Horas do card e das subtarefas são independentes e somadas (não há dupla contagem: card = trabalho fora de subtarefas).
- Alterações de horas em Demanda gravam AuditLog (regra crítica #5).

## Edge Cases
- Entrada vazia/inválida → 0 min (gasto) ou null (estimado), sem erro de UI.
- Valor negativo → rejeitado na validação Zod (400).
- Demanda sem subtarefas → total = horas próprias.
- Nenhum estimado preenchido → card mostra só "gasto", sem `/`.

## Data Contract
- Input (API, minutos): `estimatedMinutes: number|null`, `spentMinutes: number` em demanda e subtask (create/update).
- Output: campos retornados no objeto Demanda e em cada Subtask via `GET /api/demandas`.
- Persistence: colunas `estimatedMinutes Int?` e `spentMinutes Int @default(0)` em `Demanda` e `Subtask`.

## Acceptance Criteria
- [ ] Schema migrado com os dois campos em Demanda e Subtask (defaults seguros).
- [ ] Zod aceita minutos válidos e rejeita negativos (demanda + subtask).
- [ ] Helpers `parseHoursToMinutes`/`minutesToHoursLabel`/`totalSpentMinutes`/`totalEstimatedMinutes` corretos.
- [ ] PUT demanda persiste `spentMinutes`/`estimatedMinutes` e registra AuditLog.
- [ ] PUT subtask persiste horas.
- [ ] KanbanCard mostra badge quando há horas; modal e subtarefas editam horas.
- [ ] `npm run build && npx tsc --noEmit && npm test` passam.

## Technical Decisions
- Sem nova tabela (YAGNI): campos agregados nos modelos existentes. Log `TimeEntry` por usuário fica para evolução futura.
- Demanda usa rota PUT existente (não PATCH). Horas da demanda viajam no `DemandaForm`; horas de subtarefa via PUT do subtask (padrão do toggle).

## Dependencies
- Depends on: modelos `Demanda`/`Subtask` existentes.
- Blocks: futura agregação de horas no relatório (`/dashboard/demandas/relatorio`) e timesheet por usuário.
