# LEARNINGS

## Dep-04 — SVG Overlay de dependências no Kanban (2026-05-19)

**Contexto:** Feature `dependencies-v1`. Precisávamos de setas SVG Bézier conectando cards dependentes no Kanban, com toggle on/off.

**Padrão de SVG overlay sobre container com scroll:**
- Container wrapper `relative` com `ref` no nível acima de colunas + BlockedLane
- SVG com `absolute inset-0 w-full h-full pointer-events-none overflow-visible z-20`
- `overflow: visible` no SVG permite que as setas se estendam além dos limites do container (essencial quando cards estão em colunas com scroll parcial)
- Coordenadas: `getBoundingClientRect()` é viewport-relative; subtrair `.left/.top` do container rect para obter coordenadas relativas ao SVG

**Recálculo de posições — trindade de triggers:**
1. `useEffect([calculate])` + `requestAnimationFrame` — roda após cada re-render com dados novos (DnD optimistic update, fetch)
2. `ResizeObserver` no container — pega resize de janela, colapso de painel, etc.
3. `addEventListener('scroll', ..., { capture: true })` no container — captura scroll de qualquer sub-elemento (colunas scrollam independentemente com `overflow-y-auto`)

**Visibilidade:** só desenhar seta quando ambos os cards estão visíveis na viewport do container — garante que coordenadas SVG nunca ficam fora da área da tela e evita setas apontando para lugar vazio.

**Cálculo da curva Bézier:**
- Origem: bottom-center do card filho; destino: top-center do card pai
- Control points verticais: `(x1, y1 + tension)` → `(x2, y2 - tension)` onde `tension = clamp(28, dy*0.45, 72)`
- Curva fica natural tanto para cards na mesma coluna quanto em colunas distantes

**Código de cor das setas:**
- `concluida` → cinza (#94a3b8) opacity 0.4, tracejada — sem urgência visual
- `em_andamento` → amarelo (#f59e0b) opacity 0.9, sólida
- demais (solicitada, selecionada, bloqueada) → vermelho (#ef4444) opacity 0.85, sólida

**Marker SVG:** `<defs>` com 3 markers fixos (um por cor), referenciados por `markerEnd="url(#dep-{hex})"`. IDs baseados no hex sem `#` para evitar caracteres especiais.

## Dep-06 — SVG dep lines no GanttChart com coloração semântica (2026-05-20)

**Contexto:** Feature `dependencies-v1`. Linhas Bézier conectando barra-pai (direita) → barra-filha (esquerda) no Gantt, com cor semântica verde/vermelho/cinza.

**Armadilha AC#3 — pai concluído fora do barCoords:**
`getLineColor()` retorna verde/vermelho apenas quando `parent.status === 'concluida'`. Mas `barCoords` só inclui `selecionada`/`em_andamento`. Logo: pais `concluida` nunca têm entrada em `barCoords`, `if (!parentCoord) continue` os pula, e 100% das linhas geradas seriam cinza — coloração semântica completamente inoperante.

**Fix:** No `depLines` useMemo, tratar pais `concluida` ausentes do `barCoords` separadamente:
- Computar `x1` a partir de `dateDone || deadline || dateIn + 7d`, clampado a `[minDate, maxDate]`
- Usar `y1 = childCoord.yCenterPx` — linha horizontal no nível da filha (indica "dep resolvida, vem de antes")
- Para pais com status != `concluida` sem barCoord: `continue` (mantém cinza somente para pais ativos sem barra)

**Deps do useMemo:** ao computar coords de pais concluídos diretamente no `depLines`, adicionar `minDate, maxDate, totalMs, DAY_MS` ao array de dependências (antes omitidos porque todo cálculo ia via barCoords).

**Padrão de cores no Gantt:**
- Verde (#22c55e): pai `concluida` com `dateDone <= childStart`
- Vermelho (#ef4444): pai `concluida` com `dateDone > childStart` (overlap problemático)
- Cinza (#94a3b8): pai não concluído (indefinido quando termina)

## Dep-04 (revisão QA 2026-05-20) — Label de toggle de feature

**Contexto:** QA retornou `needs_clarification` para a feature de overlay de dependências.

**Lição:** Um toggle de feature cujo label é apenas o nome interno (ex: "Deps") pode confundir QA automatizado que busca pelo texto do critério de aceitação ("Mostrar dependências"). Usar label dinâmico que descreve a ação: `{active ? 'Ocultar' : 'Mostrar'} deps` satisfaz tanto o AC quanto o UX (label contextual indica o que o click vai fazer, não o estado atual).

**Padrão:** Botões toggle de visibilidade devem descrever a ação futura, não o estado atual. `aria-pressed={active}` comunica o estado para screen readers.

---

## Dep-03 — Badge de dependências no KanbanCard (2026-05-19)

**Contexto:** Feature `dependencies-v1` adicionou `dependsOn String @default("[]")` ao modelo `Demanda`. A UI do Kanban precisava exibir badges para dependências.

**Padrão estabelecido para JSON arrays em campos String do Prisma:**
- DB armazena como JSON string serializada (`"[\"id1\",\"id2\"]"`)
- API parseia com `JSON.parse(d.dependsOn || '[]')` antes de retornar
- TypeScript type usa `string[]` no lado do cliente

**Prop threading para enriquecer cards com dados cross-card:**
- Computar `demandaMap: Record<string, {id, title, status}>` com `useMemo` na page
- Passar como prop opcional por KanbanColumn → KanbanCard e BlockedLane → BlockedDropZone → KanbanCard
- Cada card faz o lookup `(d.dependsOn ?? []).map(id => demandaMap[id]).filter(Boolean)`
- Padrão zero-re-fetch: tudo derivado do state `demandas` já em memória

**Badges mutually exclusive:**
- Badge azul: `depCount > 0 && !isBlocked` — todas dependências concluídas
- Badge vermelho: `depCount > 0 && isBlocked` — ao menos uma não concluída
- Não mostrar badge nenhum quando não há dependências (zero noise)
- Tooltip `title` nativo (não shadcn Tooltip) — consistente com o padrão existente no card
