// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const signIn = vi.fn()
vi.mock('next-auth/react', () => ({ signIn: (...a: unknown[]) => signIn(...a) }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }))
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))

import LoginPage from '../page'

// 23/09/2026: com a página em `/?error=undefined`, o NextAuth usava o endereço
// atual como destino, o login dava CERTO (200) e mesmo assim a tela dizia
// "Credenciais invalidas" — o cliente lia `error=undefined` da URL de volta.
// Toda senha falhava, inclusive a certa. O destino tem de ser fixo.
describe('LoginPage', () => {
  beforeEach(() => {
    signIn.mockReset()
    signIn.mockResolvedValue({ ok: true, status: 200, error: null, url: '/dashboard' })
  })

  it('manda um destino fixo, nunca o endereço atual da página', async () => {
    window.history.pushState({}, '', '/?error=undefined')
    const { container } = render(<LoginPage />)
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'marcos@defenz.com.br' } })
    fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: 'qualquer' } })
    fireEvent.submit(container.querySelector('form')!)

    await waitFor(() => expect(signIn).toHaveBeenCalled())
    const opcoes = signIn.mock.calls[0][1]
    expect(opcoes.callbackUrl).toBe('/dashboard')
    expect(opcoes.redirect).toBe(false)
  })
})
