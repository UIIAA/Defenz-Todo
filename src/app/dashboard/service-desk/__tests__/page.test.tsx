// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ServiceDeskPage from '../page'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true, data: [] }) })
  )
})

describe('ServiceDeskPage', () => {
  it('renderiza o cabeçalho e o estado vazio', async () => {
    render(<ServiceDeskPage />)
    expect(screen.getByText('Service Desk')).toBeTruthy()
    expect(screen.getByText('Novo ticket')).toBeTruthy()
    expect(await screen.findByText(/nenhum ticket/i)).toBeTruthy()
  })
})
