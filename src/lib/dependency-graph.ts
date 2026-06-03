// Detecção de ciclo em grafo de dependências dirigido (DFS).
// Usado para impedir que uma entidade dependa (direta ou transitivamente) de si mesma.

/**
 * Retorna o caminho do ciclo (ex.: [A, B, A]) ao adicionar `proposedDeps` em `targetId`,
 * ou `null` se não houver ciclo.
 *
 * @param targetId        id da entidade sendo editada
 * @param proposedDeps    novas dependências propostas para targetId
 * @param allDepsMap      mapa id → dependências atuais de todas as entidades do escopo
 */
export function detectCycle(
  targetId: string,
  proposedDeps: string[],
  allDepsMap: Map<string, string[]>
): string[] | null {
  const graph = new Map(allDepsMap)
  graph.set(targetId, proposedDeps)

  const inStack = new Set<string>()
  const visited = new Set<string>()

  function dfs(node: string, path: string[]): string[] | null {
    if (inStack.has(node)) {
      const cycleStart = path.indexOf(node)
      return [...path.slice(cycleStart), node]
    }
    if (visited.has(node)) return null

    visited.add(node)
    inStack.add(node)
    path.push(node)

    for (const dep of graph.get(node) || []) {
      const cycle = dfs(dep, path)
      if (cycle) return cycle
    }

    path.pop()
    inStack.delete(node)
    return null
  }

  return dfs(targetId, [])
}
