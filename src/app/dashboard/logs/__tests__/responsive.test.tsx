// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Logs page responsive', () => {
  const filePath = path.resolve(__dirname, '../page.tsx')
  const source = fs.readFileSync(filePath, 'utf-8')

  it('tabela logs esconde colunas Tipo e Alteracoes no mobile', () => {
    // Tipo th
    expect(source).toContain('hidden sm:table-cell">Tipo')
    // Alteracoes th
    expect(source).toContain('hidden sm:table-cell">Alteracoes')
  })

  it('tabela logs mantem Data, Acao, Usuario visiveis', () => {
    // Data th should NOT have hidden class
    expect(source).toMatch(/text-muted-foreground">Data/)
    // Acao th should NOT have hidden class
    expect(source).toMatch(/text-muted-foreground">Acao/)
    // Usuario th should NOT have hidden class
    expect(source).toMatch(/text-muted-foreground">Usuario/)
  })
})
