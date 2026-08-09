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

describe('PortalTabs', () => {
  beforeEach(() => vi.clearAllMocks())

  it('mostra as 4 abas e o botão de ação', () => {
    mockPathname.mockReturnValue('/dashboard/portal')
    render(<PortalTabs />)
    for (const r of ['POPs', 'Biblioteca', 'IA Defenz', 'Propostas']) {
      expect(screen.getByText(r)).toBeTruthy()
    }
    expect(screen.getByText('Nova proposta')).toBeTruthy()
  })

  it('no log, a aba Propostas acende E o botão continua à mostra', () => {
    // A armadilha: `/propostas` começa com `/proposta`. Um startsWith no
    // controle do botão o esconderia justo na tela onde ele é mais útil.
    mockPathname.mockReturnValue('/dashboard/portal/propostas')
    render(<PortalTabs />)
    expect(ativa('Propostas')).toBe(true)
    expect(screen.queryByText('Nova proposta')).not.toBeNull()
  })

  it('no formulário, a aba Propostas acende e o botão some (não duplica a ação)', () => {
    mockPathname.mockReturnValue('/dashboard/portal/proposta')
    render(<PortalTabs />)
    expect(ativa('Propostas')).toBe(true)
    expect(screen.queryByText('Nova proposta')).toBeNull()
  })

  it('POPs só acende na raiz e no detalhe de POP, não nas outras abas', () => {
    mockPathname.mockReturnValue('/dashboard/portal/pops/abc123')
    render(<PortalTabs />)
    expect(ativa('POPs')).toBe(true)
    expect(ativa('Propostas')).toBe(false)
  })
})
