import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { mockAuthenticated, mockUnauthenticated } from '@/test/mocks/auth'
import { createRequest } from '@/test/mocks/next-server'

// Mock Gemini — must use function (not arrow) for constructor mock
vi.mock('@google/generative-ai', () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    response: { text: () => '# Relatorio\n\nConteudo gerado pela IA.' },
  })
  function MockGoogleGenerativeAI() {
    return {
      getGenerativeModel: () => ({ generateContent: mockGenerateContent }),
    }
  }
  return { GoogleGenerativeAI: MockGoogleGenerativeAI }
})

// Set env
vi.stubEnv('GEMINI_API_KEY', 'test-key')

import { POST } from '../route'

const sampleDemandas = [
  {
    id: '1',
    title: 'Implementar login',
    description: 'Login com email e senha',
    classification: 'tecnologia',
    assignee: 'Marcos',
    status: 'concluida',
    dateDone: new Date('2026-03-28'),
    subtasks: [
      { title: 'Frontend', completed: true },
      { title: 'Backend', completed: true },
    ],
    links: [{ label: 'Figma', url: 'https://figma.com/mock' }],
  },
  {
    id: '2',
    title: 'Revisao contratual',
    description: null,
    classification: 'juridico',
    assignee: null,
    status: 'concluida',
    dateDone: new Date('2026-03-29'),
    subtasks: [],
    links: [],
  },
]

describe('Executive Report API', () => {
  beforeEach(() => {
    Object.values(mockDb.demanda).forEach((fn) => fn.mockReset())
  })

  it('gera relatorio para admin', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.demanda.findMany.mockResolvedValue(sampleDemandas)

    const req = createRequest('POST', { body: { period: '7d' } })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.markdown).toContain('Relatorio')
    expect(json.data.demandaCount).toBe(2)
  })

  it('retorna mensagem quando nao ha demandas', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.demanda.findMany.mockResolvedValue([])

    const req = createRequest('POST', { body: { period: '7d' } })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.data.markdown).toContain('Nenhuma demanda concluida')
  })

  it('403 para user normal', async () => {
    mockAuthenticated({ role: 'user' })
    const req = createRequest('POST', { body: { period: '7d' } })
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('401 se nao autenticado', async () => {
    mockUnauthenticated()
    const req = createRequest('POST', { body: { period: '7d' } })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('400 se periodo invalido', async () => {
    mockAuthenticated({ role: 'admin' })
    const req = createRequest('POST', { body: { period: 'invalid' } })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('gerencia filtra por companyId', async () => {
    mockAuthenticated({ role: 'gerencia', companyId: 'comp-1' })
    mockDb.demanda.findMany.mockResolvedValue(sampleDemandas)

    const req = createRequest('POST', { body: { period: '30d' } })
    await POST(req)

    expect(mockDb.demanda.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 'comp-1' }),
      })
    )
  })

  it('aceita periodo custom com datas', async () => {
    mockAuthenticated({ role: 'admin' })
    mockDb.demanda.findMany.mockResolvedValue(sampleDemandas)

    const req = createRequest('POST', {
      body: { period: 'custom', startDate: '2026-03-01', endDate: '2026-03-31' },
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
  })

  it('400 para custom sem startDate', async () => {
    mockAuthenticated({ role: 'admin' })
    const req = createRequest('POST', { body: { period: 'custom' } })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
