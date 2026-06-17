// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DemandaModal } from '../demanda-modal'

const sessionMock = vi.fn()
vi.mock('next-auth/react', () => ({
  useSession: () => sessionMock(),
}))

beforeEach(() => {
  vi.clearAllMocks()
  global.fetch = vi.fn((url: string) => {
    if (typeof url === 'string' && url.includes('/api/companies')) {
      return Promise.resolve({
        json: () =>
          Promise.resolve({
            success: true,
            data: [
              { id: 'c1', name: 'Defenz' },
              { id: 'c2', name: 'Cow Cycling' },
            ],
          }),
      })
    }
    // /api/users
    return Promise.resolve({ json: () => Promise.resolve({ success: true, data: [] }) })
  }) as unknown as typeof fetch
})

const noop = () => {}

describe('DemandaModal — campo Empresa/Projeto', () => {
  it('admin vê o seletor de empresa ao criar', async () => {
    sessionMock.mockReturnValue({ data: { user: { role: 'admin' } } })
    render(<DemandaModal demanda={null} open onOpenChange={noop} onSave={noop} onDelete={noop} />)
    expect(await screen.findByText(/Empresa \/ Projeto/i)).toBeInTheDocument()
  })

  it('usuário comum NÃO vê o seletor de empresa', async () => {
    sessionMock.mockReturnValue({ data: { user: { role: 'user' } } })
    render(<DemandaModal demanda={null} open onOpenChange={noop} onSave={noop} onDelete={noop} />)
    // aguarda o modal montar (título sempre presente)
    await screen.findByText('Nova Demanda')
    expect(screen.queryByText(/Empresa \/ Projeto/i)).not.toBeInTheDocument()
  })
})
