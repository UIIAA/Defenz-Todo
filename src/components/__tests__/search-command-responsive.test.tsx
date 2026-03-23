// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

describe('SearchCommand responsive', () => {
  const filePath = path.resolve(__dirname, '../search-command.tsx')
  const source = fs.readFileSync(filePath, 'utf-8')

  it('search dialog nao excede viewport mobile', () => {
    expect(source).toContain('max-w-[calc(100vw-2rem)]')
    expect(source).toContain('sm:max-w-lg')
  })
})
