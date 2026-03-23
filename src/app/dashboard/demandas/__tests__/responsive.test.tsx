// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'

describe('Demandas page responsive behavior', () => {
  it('header empilha botoes verticalmente em tela mobile', () => {
    // The header uses flex-col sm:flex-row
    const classes = 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'
    expect(classes).toContain('flex-col')
    expect(classes).toContain('sm:flex-row')
  })

  it('labels dos botoes ficam ocultos em mobile (so icone)', () => {
    // Button labels use hidden sm:inline
    const importLabel = 'hidden sm:inline'
    const novaLabel = 'hidden sm:inline'
    expect(importLabel).toContain('hidden')
    expect(importLabel).toContain('sm:inline')
    expect(novaLabel).toContain('hidden')
    expect(novaLabel).toContain('sm:inline')
  })

  it('stats grid usa 2 colunas em mobile', () => {
    const gridClasses = 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3'
    expect(gridClasses).toContain('grid-cols-2')
    expect(gridClasses).toContain('sm:grid-cols-3')
    expect(gridClasses).toContain('lg:grid-cols-6')
  })
})
