import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/db', () => ({ db: { proposta: { update: vi.fn() } } }))

import { db } from '@/lib/db'
import { arquivarNoOneDrive } from '../arquivamento'

const mockDb = db as unknown as { proposta: { update: ReturnType<typeof vi.fn> } }

const entrada = {
  propostaId: 'p1',
  codigo: 'DFZ-2026-01986',
  arquivoNome: 'Proposta Defenz DFZ-2026-01986 - Acme.pdf',
  empresaNome: 'Acme',
  pdf: Buffer.from('%PDF-1.4 fake'),
}

describe('arquivamento no OneDrive — falha NUNCA derruba a geração (R5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.N8N_PROPOSTA_ARQUIVO_WEBHOOK_URL
  })

  it('sem webhook configurado fica inerte, sem erro', async () => {
    await expect(arquivarNoOneDrive(entrada)).resolves.toBe(false)
    expect(mockDb.proposta.update).not.toHaveBeenCalled()
  })

  it('recusa webhook que não seja https — documento comercial não vai em claro', async () => {
    process.env.N8N_PROPOSTA_ARQUIVO_WEBHOOK_URL = 'http://inseguro.example/hook'
    await expect(arquivarNoOneDrive(entrada)).resolves.toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('n8n fora do ar → false, sem lançar, sem marcar arquivado', async () => {
    process.env.N8N_PROPOSTA_ARQUIVO_WEBHOOK_URL = 'https://n8n.example/hook'
    ;(fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('ECONNREFUSED'))

    await expect(arquivarNoOneDrive(entrada)).resolves.toBe(false)
    expect(mockDb.proposta.update).not.toHaveBeenCalled()
  })

  it('HTTP 500 do n8n → false', async () => {
    process.env.N8N_PROPOSTA_ARQUIVO_WEBHOOK_URL = 'https://n8n.example/hook'
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 500 })

    await expect(arquivarNoOneDrive(entrada)).resolves.toBe(false)
    expect(mockDb.proposta.update).not.toHaveBeenCalled()
  })

  it('200 sem itemId não vira "arquivado" — sem prova, não finge', async () => {
    process.env.N8N_PROPOSTA_ARQUIVO_WEBHOOK_URL = 'https://n8n.example/hook'
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    })

    await expect(arquivarNoOneDrive(entrada)).resolves.toBe(false)
    expect(mockDb.proposta.update).not.toHaveBeenCalled()
  })

  it('caminho feliz marca oneDriveItemId e arquivadoEm', async () => {
    process.env.N8N_PROPOSTA_ARQUIVO_WEBHOOK_URL = 'https://n8n.example/hook'
    ;(fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ itemId: '01ABCDEF' }),
    })
    mockDb.proposta.update.mockResolvedValue({})

    await expect(arquivarNoOneDrive(entrada)).resolves.toBe(true)
    expect(mockDb.proposta.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'p1' },
        data: expect.objectContaining({ oneDriveItemId: '01ABCDEF' }),
      })
    )
  })
})
