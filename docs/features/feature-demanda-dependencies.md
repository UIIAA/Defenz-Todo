# Feature: Edição de Dependências de Demanda (finalizar dependencies-v1)
**Status:** Done
**Priority:** P1
**Date:** 2026-06-03

## Objective
Permitir definir as dependências de uma Demanda pela UI (combobox no modal), persistindo com guarda de ciclo/auto-referência — fechando a dependencies-v1 (cuja visualização já está pronta).

## Estado atual (diagnóstico)
- **Pronto:** visualização (badge no card, overlay SVG no Kanban, setas no Gantt) — tudo consome `Demanda.dependsOn`.
- **Faltando:** não há UI para definir `dependsOn`; o schema/route de Demanda não aceitam nem persistem `dependsOn`; não há detecção de ciclo para Demandas.
- **Órfão:** módulo `activities` (`/api/activities`, `components/activities/`, testes) — protótipo de referência não montado em nenhuma página. **Será deletado** e o padrão (detectCycle + combobox) portado para Demandas.

## Behavior
1. No modal de Demanda, campo "Depende de": busca por título, multi-seleção com badges removíveis.
2. Ao salvar (PUT/POST atual do form), `dependsOn` é validado e persistido.
3. Self-dependency, ID inexistente ou ciclo → erro 400 com mensagem pt-BR; modal mostra toast e não fecha.

## Business Rules
- `dependsOn` persiste como JSON string (padrão do projeto); API expõe `dependsOn: string[]`.
- Candidatos limitados às demandas visíveis ao usuário (tenant scope por empresa).
- Ciclo detectado por DFS sobre o grafo de dependências da empresa.

## Edge Cases
- Demanda nova (sem id): pode escolher deps; valida só existência (ciclo impossível para nó novo).
- Dep removida/!existe mais → ignorada na validação (rejeita ID inválido no save).
- Lista vazia → `dependsOn = []`.

## Data Contract
- Input: `dependsOn: string[]` (opcional) em create/update da Demanda.
- Output: `dependsOn: string[]` no GET (já implementado).
- Persistence: coluna `Demanda.dependsOn String @default("[]")` (já existe).

## Plano técnico
### 1. Extrair detecção de ciclo
- Novo `src/lib/dependency-graph.ts` com `detectCycle(targetId, proposedDeps, allDepsMap)` (portado da rota de activities, que será deletada). Teste dedicado.

### 2. API Demanda — `src/lib/validations/demanda.ts` + `src/app/api/demandas/route.ts`
- Schemas create/update: `dependsOn: z.array(z.string()).optional()`.
- POST: validar que cada ID existe na empresa; persistir `JSON.stringify(dependsOn ?? [])`.
- PUT: se `dependsOn` veio →
  - self-dep (`dependsOn.includes(id)`) → `ApiError('Uma demanda não pode depender de si mesma', 400)`.
  - validar IDs existem (tenant scope) → `ApiError('Dependência inválida', 400)`.
  - montar `allDepsMap` das demandas da empresa + `detectCycle` → `ApiError('Isso criaria um ciclo de dependências', 400)`.
  - persistir `JSON.stringify(dependsOn)`.
- `dependsOn` fica fora de `TRACKED_FIELDS` (array vs string geraria diff ruidoso no audit).

### 3. UI — `src/components/demandas/demanda-depends-on-combobox.tsx` + `demanda-modal.tsx`
- Novo combobox (porte do `ActivityDependsOnCombobox`): fetch `/api/demandas`, opções = outras demandas (exclui self + já selecionadas), filtra por título, badges.
- Modal: bloco "Depende de" ligando `form.dependsOn`. `emptyForm` ganha `dependsOn: []`; load seta `demanda.dependsOn ?? []`.
- `handleSave` já envia o form inteiro → `dependsOn` viaja no PUT/POST. Tratar erro estruturado → toast pt-BR, modal não fecha.

### 4. Deletar módulo activities
- Remover `src/app/api/activities/`, `src/components/activities/` e seus `__tests__`.
- `Activity.dependsOn` (coluna) fica no schema (remoção exigiria migration destrutiva; é aditiva e inócua) — anotado como débito.

## Testes (proporcional)
- `dependency-graph.test.ts`: ciclo de 2 e 3 nós + sem ciclo (portado).
- Validação demanda: aceita `dependsOn`.
- Route demanda PUT: persiste deps (happy); rejeita self/ciclo/ID inválido (sad).
- Combobox: render leve (selecionados + candidatos).

## Acceptance Criteria
- [ ] Combobox no modal define dependências e salva.
- [ ] Self/ciclo/ID inválido bloqueados com toast.
- [ ] Badge/overlay/Gantt refletem as deps definidas pela UI.
- [ ] Módulo activities removido; sem refs quebradas.
- [ ] `npm run build && npx tsc --noEmit && npm test` verdes.

## Dependencies
- Depends on: visualização dependencies-v1 (pronta), `Demanda.dependsOn` (existe).
- Ships junto com feature-time-tracking num único push.
