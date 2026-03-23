// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('DemandaModal responsive', () => {
  const filePath = path.resolve(__dirname, '../demanda-modal.tsx')
  const source = fs.readFileSync(filePath, 'utf-8')

  it('modal nao excede largura do viewport mobile', () => {
    expect(source).toContain('max-w-[calc(100vw-2rem)]')
  })

  it('campos de data empilham em coluna no mobile', () => {
    expect(source).toContain('grid-cols-1 sm:grid-cols-2')
  })

  it('status buttons formam grid 3 colunas no mobile', () => {
    expect(source).toContain('grid grid-cols-3 sm:flex')
  })

  it('botao delete de subtask é visivel sem hover no mobile', () => {
    expect(source).toContain('sm:opacity-0 sm:group-hover:opacity-100')
  })
})
