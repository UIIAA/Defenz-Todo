// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AnaAnswer } from '../ana-answer'

describe('AnaAnswer', () => {
  it('renderiza markdown — listas e negrito, que é o que torna procedimento legível', () => {
    const { container } = render(
      <AnaAnswer text={'Campos obrigatórios:\n\n- **CNPJ**\n- **Telefone**'} />
    )
    expect(container.querySelectorAll('li')).toHaveLength(2)
    expect(container.querySelector('strong')?.textContent).toBe('CNPJ')
  })

  it('REGRA §7.2: link vindo do corpo de um POP NÃO vira elemento clicável', () => {
    const { container } = render(
      <AnaAnswer text={'Veja [este site](https://exemplo-malicioso.com) agora.'} />
    )
    expect(container.querySelector('a')).toBeNull()
    // O texto sobrevive — o usuário lê, mas não clica.
    expect(screen.getByText(/este site/)).toBeTruthy()
  })

  it('imagem injetada não é renderizada', () => {
    const { container } = render(<AnaAnswer text={'![x](https://exemplo.com/rastreador.png)'} />)
    expect(container.querySelector('img')).toBeNull()
  })

  it('HTML cru não passa (sem rehype-raw)', () => {
    const { container } = render(
      <AnaAnswer text={'<a href="https://mau.com">clique</a> e <script>alert(1)</script>'} />
    )
    expect(container.querySelector('a')).toBeNull()
    expect(container.querySelector('script')).toBeNull()
  })

  it('esquema perigoso não sobrevive nem como link', () => {
    const { container } = render(<AnaAnswer text={'[x](javascript:alert(1))'} />)
    expect(container.querySelector('a')).toBeNull()
  })
})
