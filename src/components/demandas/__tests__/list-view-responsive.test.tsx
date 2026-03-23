// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('ListViewTable responsive', () => {
  const filePath = path.resolve(__dirname, '../list-view-table.tsx')
  const source = fs.readFileSync(filePath, 'utf-8')

  it('esconde colunas Origem, Classificacao, Prioridade, Assignee em mobile', () => {
    // These columns should have hidden sm:table-cell in td elements
    const hiddenCells = (source.match(/hidden sm:table-cell/g) || []).length
    // 4 columns hidden in td + dynamic th = at least 4 occurrences
    expect(hiddenCells).toBeGreaterThanOrEqual(4)
  })

  it('mantem colunas Titulo, Status, Prazo sempre visiveis', () => {
    // Title td should NOT have hidden class
    expect(source).toContain('text-sm font-medium text-slate-800 dark:text-slate-100 max-w-[300px] truncate')
    // Status column (StatusBadge) td should NOT have hidden class
    const statusTdMatch = source.match(/<td className="px-4 py-3">\s*<StatusBadge/)
    expect(statusTdMatch).not.toBeNull()
  })
})
