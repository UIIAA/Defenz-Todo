// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

const mockPathname = vi.fn()
vi.mock('next/navigation', () => ({ usePathname: () => mockPathname() }))
vi.mock('next/link', () => ({
  default: ({ href, children, className }: never) =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (require('react') as typeof import('react')).createElement(
      'a',
      { href, className },
      children as never
    ),
}))

import { PortalTabs } from '../portal-tabs'

const ativa = (rotulo: string) =>
  screen.getByText(rotulo).className.includes('border-b-2')

/** A ação está clicável? Vira `<span>` sem href na tela em que já se está. */
const clicavel = (rotulo: string) =>
  screen.getByText(rotulo).closest('a')?.getAttribute('href') ?? null

describe('PortalTabs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mostra as 4 abas e as DUAS emissões na caixa', () => {
    // Os três caminhos do Marcos (22/08) são igualmente comuns: só apresentação,
    // as duas, ou só proposta. Por isso as duas ficam à mostra, lado a lado.
    mockPathname.mockReturnValue('/dashboard/portal')
    render(<PortalTabs />)
    for (const r of ['POPs', 'Biblioteca', 'IA Defenz', 'Propostas']) {
      expect(screen.getByText(r)).toBeTruthy()
    }
    expect(clicavel('Apresentação')).toBe('/dashboard/portal/apresentacao')
    expect(clicavel('Proposta')).toBe('/dashboard/portal/proposta')
  })

  it('no log, a aba Propostas acende E as duas emissões continuam clicáveis', () => {
    // A armadilha: `/propostas` começa com `/proposta`. Um startsWith no
    // controle da ação a esconderia justo na tela onde ela é mais útil.
    mockPathname.mockReturnValue('/dashboard/portal/propostas')
    render(<PortalTabs />)
    expect(ativa('Propostas')).toBe(true)
    expect(clicavel('Proposta')).toBe('/dashboard/portal/proposta')
    expect(clicavel('Apresentação')).toBe('/dashboard/portal/apresentacao')
  })

  it('no formulário de proposta, só a proposta apaga — a apresentação segue à mão', () => {
    // É o caso "gerei a proposta, agora quero a apresentação também": o caminho
    // não pode custar uma volta pelo menu.
    mockPathname.mockReturnValue('/dashboard/portal/proposta')
    render(<PortalTabs />)
    expect(ativa('Propostas')).toBe(true)
    expect(clicavel('Proposta')).toBeNull()
    expect(clicavel('Apresentação')).toBe('/dashboard/portal/apresentacao')
  })

  it('no formulário de apresentação, só a apresentação apaga', () => {
    mockPathname.mockReturnValue('/dashboard/portal/apresentacao')
    render(<PortalTabs />)
    expect(clicavel('Apresentação')).toBeNull()
    expect(clicavel('Proposta')).toBe('/dashboard/portal/proposta')
  })

  it('POPs só acende na raiz e no detalhe de POP, não nas outras abas', () => {
    mockPathname.mockReturnValue('/dashboard/portal/pops/abc123')
    render(<PortalTabs />)
    expect(ativa('POPs')).toBe(true)
    expect(ativa('Propostas')).toBe(false)
  })
})
