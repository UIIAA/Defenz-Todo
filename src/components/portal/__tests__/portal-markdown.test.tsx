// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PortalMarkdown, safeUrl } from '../portal-markdown'

describe('safeUrl (allowlist de esquema)', () => {
  it('deixa passar https', () => {
    expect(safeUrl('https://drive.google.com/x')).toBe('https://drive.google.com/x')
  })

  it('deixa passar mailto', () => {
    expect(safeUrl('mailto:suporte@defenz.com.br')).toBe('mailto:suporte@defenz.com.br')
  })

  it('corta javascript:', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('')
  })

  it('corta data:', () => {
    expect(safeUrl('data:text/html,<script>alert(1)</script>')).toBe('')
  })

  it('corta http (não criptografado)', () => {
    expect(safeUrl('http://exemplo.com')).toBe('')
  })
})

describe('PortalMarkdown', () => {
  it('renderiza o markdown', () => {
    render(<PortalMarkdown body={'# Título\n\ntexto do pop'} />)
    expect(screen.getByText('texto do pop')).toBeInTheDocument()
  })

  it('XSS: não injeta HTML cru no DOM', () => {
    const { container } = render(
      <PortalMarkdown body={'<script>window.__x=1</script>ok'} />
    )
    expect(container.querySelector('script')).toBeNull()
  })

  it('XSS: link com javascript: fica sem href perigoso', () => {
    const { container } = render(<PortalMarkdown body={'[clique](javascript:alert(1))'} />)
    const href = container.querySelector('a')?.getAttribute('href') ?? ''
    expect(href).not.toContain('javascript:')
  })
})
