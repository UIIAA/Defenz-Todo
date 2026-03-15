# Feature: Kanban/Timeline Scalability + Collapsible Sections
**Status:** Done
**Priority:** P1
**Date:** 2026-03-15

## Objective
Garantir que o Kanban e Timeline funcionam bem com 10, 20, 50+ demandas empilhadas corretamente, e que ambas secoes sejam colapsaveis (toggle show/hide) para caber na tela.

## Behavior
1. Kanban exibe cards empilhados verticalmente dentro de cada coluna, sem sobreposicao
2. Timeline exibe todas as demandas ativas com rows empilhados sem quebra
3. Ambas secoes (Kanban e Timeline) tem botao toggle para expandir/colapsar
4. Estado de colapso persiste durante a sessao (useState)
5. Com 50+ demandas, scroll vertical funciona dentro de cada coluna do Kanban

## Design Spec

### Kanban Columns
- Cada coluna tem max-height com scroll vertical: `max-h-[60vh] overflow-y-auto`
- Cards empilhados com `gap-2` (8px entre cards)
- Contador de items no header da coluna (ja existe)
- Scroll suave dentro da coluna

### Timeline
- Todas as rows empilhadas sequencialmente
- Container com max-height e scroll: `max-h-[50vh] overflow-y-auto`
- Header de ticks fixo no topo (sticky)

### Collapsible Sections
- Icone ChevronDown ao lado do titulo "KANBAN" e "TIMELINE"
- Click no titulo/icone toggle a secao
- Animacao suave de abertura/fechamento
- Quando colapsado: mostra apenas o header com titulo + contagem

## Acceptance Criteria
- [ ] Kanban com 50 demandas: cards empilhados sem sobreposicao
- [ ] Scroll vertical dentro de cada coluna do Kanban
- [ ] Timeline com 50 demandas: rows empilhados corretamente
- [ ] Scroll vertical na timeline
- [ ] Botao toggle no Kanban (expandir/colapsar)
- [ ] Botao toggle na Timeline (expandir/colapsar)
- [ ] Build passa
- [ ] Testes passam

## Technical Decisions
- useState para estado de colapso (nao precisa persistir)
- max-height + overflow-y-auto para scroll contido
- Sticky header nos ticks da timeline
