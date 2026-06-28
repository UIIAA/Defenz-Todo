import { describe, it, expect, vi, beforeEach } from 'vitest'

// ─── Mock DB (factory inline — sem variáveis top-level por causa do hoisting) ─

vi.mock('@/lib/db', () => {
  const authorizedClient = { findFirst: vi.fn() }
  const user = { findUnique: vi.fn() }
  const company = { findFirst: vi.fn() }
  const ticketSequence = { upsert: vi.fn(), update: vi.fn() }
  const $transaction = vi.fn()
  return {
    db: { company, user, authorizedClient, ticketSequence, $transaction },
  }
})

// ─── Imports (depois dos mocks) ───────────────────────────────────────────────

import { db } from '@/lib/db'
import {
  resolveDefenzCompanyId,
  _resetDefenzCompanyIdCache,
  verifyAuthorizedClient,
  nextTicketProtocol,
  getPortalSystemUserId,
  _resetPortalSystemUserIdCache,
} from '../service-desk-server'

// Acesso tipado aos mocks depois do import
const mockDb = db as unknown as {
  company: { findFirst: ReturnType<typeof vi.fn> }
  user: { findUnique: ReturnType<typeof vi.fn> }
  authorizedClient: { findFirst: ReturnType<typeof vi.fn> }
  ticketSequence: { upsert: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

// ─── resolveDefenzCompanyId ───────────────────────────────────────────────────

describe('resolveDefenzCompanyId', () => {
  beforeEach(() => {
    _resetDefenzCompanyIdCache()
    vi.clearAllMocks()
  })

  it('retorna o companyId quando a empresa Defenz existe', async () => {
    mockDb.company.findFirst.mockResolvedValue({ id: 'comp-defenz', name: 'Defenz' })
    const id = await resolveDefenzCompanyId()
    expect(id).toBe('comp-defenz')
    expect(mockDb.company.findFirst).toHaveBeenCalledWith({ where: { name: 'Defenz' } })
  })

  it('lança ApiError 500 se empresa Defenz não existe', async () => {
    mockDb.company.findFirst.mockResolvedValue(null)
    await expect(resolveDefenzCompanyId()).rejects.toMatchObject({
      statusCode: 500,
      message: expect.stringContaining('Defenz'),
    })
  })

  it('usa cache após primeira chamada (não repete round-trip)', async () => {
    mockDb.company.findFirst.mockResolvedValue({ id: 'comp-defenz', name: 'Defenz' })
    await resolveDefenzCompanyId()
    await resolveDefenzCompanyId()
    expect(mockDb.company.findFirst).toHaveBeenCalledTimes(1)
  })
})

// ─── getPortalSystemUserId ────────────────────────────────────────────────────

describe('getPortalSystemUserId', () => {
  beforeEach(() => {
    _resetPortalSystemUserIdCache()
    vi.clearAllMocks()
  })

  it('retorna id do usuário-sistema quando existe', async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: 'user-portal' })
    const id = await getPortalSystemUserId()
    expect(id).toBe('user-portal')
    expect(mockDb.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'portal@defenz.com.br' },
      select: { id: true },
    })
  })

  it('lança ApiError 500 se usuário-sistema não existe', async () => {
    mockDb.user.findUnique.mockResolvedValue(null)
    await expect(getPortalSystemUserId()).rejects.toMatchObject({
      statusCode: 500,
      message: expect.stringContaining('portal@defenz.com.br'),
    })
  })

  it('usa cache após primeira chamada', async () => {
    mockDb.user.findUnique.mockResolvedValue({ id: 'user-portal' })
    await getPortalSystemUserId()
    await getPortalSystemUserId()
    expect(mockDb.user.findUnique).toHaveBeenCalledTimes(1)
  })
})

// ─── verifyAuthorizedClient ───────────────────────────────────────────────────

describe('verifyAuthorizedClient', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('retorna { ok: true, client } quando par CNPJ+email bate (normaliza antes)', async () => {
    const fakeClient = {
      id: 'ac-1',
      clientName: 'Cliente Teste',
      cnpj: '11222333000181',
      email: 'teste@cliente.com.br',
    }
    mockDb.authorizedClient.findFirst.mockResolvedValue(fakeClient)

    const result = await verifyAuthorizedClient(
      '11.222.333/0001-81', // com máscara
      'TESTE@cliente.com.br', // maiúsculas
      'comp-defenz'
    )

    expect(result.ok).toBe(true)
    expect(result.client).toEqual(fakeClient)

    // Verifica que normalizou antes de chamar o banco
    expect(mockDb.authorizedClient.findFirst).toHaveBeenCalledWith({
      where: {
        cnpj: '11222333000181',
        email: 'teste@cliente.com.br',
        active: true,
        companyId: 'comp-defenz',
      },
      select: { id: true, clientName: true, cnpj: true, email: true },
    })
  })

  it('retorna { ok: false } quando não há match (sem expor "não existe" vs "inativo")', async () => {
    mockDb.authorizedClient.findFirst.mockResolvedValue(null)

    const result = await verifyAuthorizedClient(
      '99999999000191',
      'inexistente@x.com',
      'comp-defenz'
    )

    expect(result.ok).toBe(false)
    expect(result.client).toBeUndefined()
  })
})

// ─── nextTicketProtocol ───────────────────────────────────────────────────────

describe('nextTicketProtocol', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('gera protocolo atomicamente com zero-pad correto', async () => {
    mockDb.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<number>) => {
      const fakeTx = {
        ticketSequence: {
          upsert: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue({ lastSeq: 42 }),
        },
      }
      return cb(fakeTx)
    })

    const protocol = await nextTicketProtocol(new Date('2026-06-27T12:00:00Z'))
    expect(protocol).toBe('SD-2026-000042')
  })

  it('usa o ano da data injetada (2027)', async () => {
    mockDb.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<number>) => {
      const fakeTx = {
        ticketSequence: {
          upsert: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue({ lastSeq: 1 }),
        },
      }
      return cb(fakeTx)
    })

    const protocol = await nextTicketProtocol(new Date('2027-01-01T00:00:00Z'))
    expect(protocol).toBe('SD-2027-000001')
  })

  it('usa $transaction (garantia de atomicidade — nunca count+1)', async () => {
    mockDb.$transaction.mockImplementation(async (cb: (tx: unknown) => Promise<number>) => {
      const fakeTx = {
        ticketSequence: {
          upsert: vi.fn().mockResolvedValue({}),
          update: vi.fn().mockResolvedValue({ lastSeq: 100 }),
        },
      }
      return cb(fakeTx)
    })

    await nextTicketProtocol(new Date('2026-06-27T12:00:00Z'))
    expect(mockDb.$transaction).toHaveBeenCalledTimes(1)
  })
})
