// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('ImportModal responsive', () => {
  const filePath = path.resolve(__dirname, '../import-modal.tsx')
  const source = fs.readFileSync(filePath, 'utf-8')

  it('import modal nao excede viewport mobile', () => {
    expect(source).toContain('max-w-[calc(100vw-2rem)]')
  })

  it('grid de campos empilha em coluna no mobile', () => {
    expect(source).toContain('grid-cols-1 sm:grid-cols-2')
  })
})
