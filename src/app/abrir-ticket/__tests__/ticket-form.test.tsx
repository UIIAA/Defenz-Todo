// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TicketForm } from '../ticket-form'

// --- helpers -----------------------------------------------------------

function fillForm(user: ReturnType<typeof userEvent.setup>) {
  return async () => {
    await user.type(screen.getByLabelText(/cnpj/i), '11222333000181')
    await user.type(screen.getByLabelText(/e-mail da console/i), 'contato@empresa.com')
    await user.type(screen.getByLabelText(/seu nome/i), 'Joao Silva')
    await user.type(screen.getByLabelText(/assunto/i), 'Problema de acesso')
    await user.type(screen.getByLabelText(/descricao/i), 'Nao consigo acessar o portal.')
  }
}

// --- setup -------------------------------------------------------------

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn())
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

// --- testes ------------------------------------------------------------

describe('TicketForm', () => {
  it('(happy) submit com sucesso exibe o protocolo e limpa o formulario', async () => {
    const user = userEvent.setup()

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { protocol: 'SD-2026-000001' } }),
    } as Response)

    render(<TicketForm />)

    await fillForm(user)()

    await user.click(screen.getByRole('button', { name: /abrir chamado/i }))

    // Confirmacao visivel
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
    expect(screen.getByText(/SD-2026-000001/)).toBeInTheDocument()
    expect(screen.getByText(/chamado aberto com sucesso/i)).toBeInTheDocument()

    // Formulario nao esta mais visivel (foi substituido pela tela de sucesso)
    expect(screen.queryByLabelText(/assunto/i)).not.toBeInTheDocument()
  })

  it('(sad) submit com 422 exibe mensagem de erro e MANTEM os campos preenchidos', async () => {
    const user = userEvent.setup()

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({
        success: false,
        error: 'Nao foi possivel validar seus dados. Confira o CNPJ e o e-mail cadastrado na console.',
      }),
    } as Response)

    render(<TicketForm />)

    await fillForm(user)()

    await user.click(screen.getByRole('button', { name: /abrir chamado/i }))

    // Erro visivel
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(
      screen.getByText(/nao foi possivel validar seus dados/i)
    ).toBeInTheDocument()

    // Formulario continua visivel e campos MANTEM o valor
    expect(screen.getByLabelText(/assunto/i)).toHaveValue('Problema de acesso')
    expect(screen.getByLabelText(/seu nome/i)).toHaveValue('Joao Silva')
    expect(screen.getByLabelText(/descricao/i)).toHaveValue('Nao consigo acessar o portal.')

    // Nao ha tela de sucesso
    expect(screen.queryByText(/chamado aberto com sucesso/i)).not.toBeInTheDocument()
  })

  it('(sad) 429 exibe mensagem de rate limit e MANTEM os campos', async () => {
    const user = userEvent.setup()

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'rate limit' }),
    } as Response)

    render(<TicketForm />)

    await fillForm(user)()
    await user.click(screen.getByRole('button', { name: /abrir chamado/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(screen.getByText(/muitas tentativas/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/assunto/i)).toHaveValue('Problema de acesso')
  })

  it('(happy) botao "abrir outro" volta ao formulario limpo apos sucesso', async () => {
    const user = userEvent.setup()

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: { protocol: 'SD-2026-000002' } }),
    } as Response)

    render(<TicketForm />)

    await fillForm(user)()
    await user.click(screen.getByRole('button', { name: /abrir chamado/i }))

    await waitFor(() => expect(screen.getByText(/SD-2026-000002/)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /abrir outro/i }))

    // Formulario voltou vazio
    expect(screen.getByLabelText(/assunto/i)).toHaveValue('')
    expect(screen.getByLabelText(/seu nome/i)).toHaveValue('')
  })
})
