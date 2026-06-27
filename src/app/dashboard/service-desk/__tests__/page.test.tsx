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
    // A página mostra Skeleton durante o load; conteúdo aparece após o fetch resolver.
    expect(await screen.findByText('Service Desk')).toBeTruthy()
    expect(await screen.findByText('Novo ticket')).toBeTruthy()
    expect(await screen.findByText(/nenhum ticket/i)).toBeTruthy()
  })
})
