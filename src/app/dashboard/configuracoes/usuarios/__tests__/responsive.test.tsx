// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('Usuarios page responsive', () => {
  const filePath = path.resolve(__dirname, '../page.tsx')
  const source = fs.readFileSync(filePath, 'utf-8')

  it('tabela users esconde Email, Cargo, Data no mobile', () => {
    // Email column header should have hidden sm:table-cell
    expect(source).toContain('hidden sm:table-cell">Email')
    // Cargo column header should have hidden sm:table-cell
    expect(source).toContain('hidden sm:table-cell">Cargo')
    // Data cadastro column header should have hidden sm:table-cell
    expect(source).toContain('hidden sm:table-cell">Data cadastro')
  })

  it('tabela invites esconde Criado por, Data, Link no mobile', () => {
    expect(source).toContain('hidden sm:table-cell">Criado por')
    expect(source).toContain('hidden sm:table-cell">Data criacao')
    expect(source).toContain('hidden sm:table-cell">Link')
  })

  it('header empilha verticalmente no mobile', () => {
    expect(source).toContain('flex-col sm:flex-row')
    expect(source).toContain('items-start sm:items-center')
  })
})
