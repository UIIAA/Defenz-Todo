// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('KanbanColumn responsive', () => {
  const filePath = path.resolve(__dirname, '../kanban-column.tsx')
  const source = fs.readFileSync(filePath, 'utf-8')

  it('coluna usa min-w-140px em mobile', () => {
    expect(source).toContain('min-w-[140px]')
  })

  it('coluna usa min-w-180px em desktop', () => {
    expect(source).toContain('sm:min-w-[180px]')
  })
})
