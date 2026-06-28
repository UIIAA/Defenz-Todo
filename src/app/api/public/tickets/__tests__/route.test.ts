/**
 * TDD: POST /api/public/tickets
 *
 * Happy path: match cria ticket, devolve protocol, createdById=system, source=portal.
 * Sad path: no-match retorna 422 genérica, nenhum ticket criado.
 * Strict: body com campo de controle extra (assignedToId/status) rejeitado pelo strict → 422.
 * Dedup: segundo submit idêntico em <60s retorna protocolo existente sem criar novo ticket.
 * Honeypot: _hp preenchido → 422 genérica.
 * Tempo mínimo: _t presente e < 2000ms → 422 genérica.
 * CNPJ inválido: ≠ 14 dígitos (após normalização) → 422 genérica.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockDb } from '@/test/mocks/prisma'
import { createRequest } from '@/test/mocks/next-server'
import { POST } from '../route'

// ─── Mocks de módulos ─────────────────────────────────────────────────────────

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn().mockReturnValue(null),
}))

vi.mock('@/lib/service-desk-server', () => ({
  resolveDefenzCompanyId: vi.fn().mockResolvedValue('company-defenz'),
  verifyAuthorizedClient: vi.fn(),
  getPortalSystemUserId: vi.fn().mockResolvedValue('system-user-id'),
  nextTicketProtocol: vi.fn().mockResolvedValue('SD-2026-000001'),
}))

import { checkRateLimit } from '@/lib/rate-limit'
import {
  resolveDefenzCompanyId,
  verifyAuthorizedClient,
  getPortalSystemUserId,
  nextTicketProtocol,
} from '@/lib/service-desk-server'

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const VALID_BODY = {
  cnpj: '12.345.678/0001-95',
  email: 'Contato@Empresa.COM', // capitalização mista — o handler normaliza para lowercase
  name: 'João Silva',
  subject: 'Problema de acesso',
  description: 'Não consigo logar no sistema',
  _hp: '',
  _t: Date.now() - 5000, // 5s atrás — passa o limiar de 2s
}

const AUTHORIZED_CLIENT = {
  id: 'ac-001',
  clientName: 'Empresa Teste Ltda',
  cnpj: '12345678000195',
  email: 'contato@empresa.com',
}

const CREATED_TICKET = {
  id: 'ticket-001',
  subject: 'Problema de acesso',
  status: 'solicitado',
  source: 'portal',
  client: 'Empresa Teste Ltda',
  protocol: 'SD-2026-000001',
  createdById: 'system-user-id',
  requesterEmail: 'contato@empresa.com',
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()

  // Defaults que podem ser sobrepostos por cada teste.
  vi.mocked(checkRateLimit).mockReturnValue(null)
  vi.mocked(resolveDefenzCompanyId).mockResolvedValue('company-defenz')
  vi.mocked(verifyAuthorizedClient).mockResolvedValue({ ok: true, client: AUTHORIZED_CLIENT })
  vi.mocked(getPortalSystemUserId).mockResolvedValue('system-user-id')
  vi.mocked(nextTicketProtocol).mockResolvedValue('SD-2026-000001')

  // DB: sem ticket duplicado por padrão; criação bem-sucedida.
  mockDb.ticket.findFirst.mockResolvedValue(null)
  mockDb.ticket.create.mockResolvedValue(CREATED_TICKET)
  mockDb.auditLog.create.mockResolvedValue({ id: 'audit-001' })
})

// ─── Testes ───────────────────────────────────────────────────────────────────

describe('POST /api/public/tickets — happy path', () => {
  it('cria ticket e devolve apenas o protocol (não expõe ticket inteiro)', async () => {
    const res = await POST(createRequest('POST', { body: VALID_BODY }))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json).toEqual({ success: true, data: { protocol: 'SD-2026-000001' } })
    // Não pode ter id, status, client etc. no output.
    expect(json.data).not.toHaveProperty('id')
    expect(json.data).not.toHaveProperty('status')
  })

  it('grava companyId=Defenz, source=portal, createdById=system-user (não do body)', async () => {
    await POST(createRequest('POST', { body: VALID_BODY }))

    const createData = mockDb.ticket.create.mock.calls[0][0].data
    expect(createData.companyId).toBe('company-defenz')
    expect(createData.source).toBe('portal')
    expect(createData.createdById).toBe('system-user-id')
    expect(createData.status).toBe('solicitado')
  })

  it('grava client vindo do AuthorizedClient verificado (não do body)', async () => {
    await POST(createRequest('POST', { body: VALID_BODY }))

    const createData = mockDb.ticket.create.mock.calls[0][0].data
    expect(createData.client).toBe('Empresa Teste Ltda')
    expect(createData.requesterEmail).toBe('contato@empresa.com') // normalizado
    expect(createData.requester).toBe('João Silva')
  })

  it('normaliza e-mail (lowercase) antes de gravar', async () => {
    // VALID_BODY.email = 'Contato@Empresa.COM' — o handler faz lowercase antes de persistir
    await POST(createRequest('POST', { body: VALID_BODY }))

    const createData = mockDb.ticket.create.mock.calls[0][0].data
    expect(createData.requesterEmail).toBe('contato@empresa.com')
  })

  it('normaliza CNPJ (remove mascara) e e-mail antes de chamar verifyAuthorizedClient', async () => {
    // VALID_BODY.cnpj = '12.345.678/0001-95' → normaliza para '12345678000195'
    // VALID_BODY.email = 'Contato@Empresa.COM' → normaliza para 'contato@empresa.com'
    await POST(createRequest('POST', { body: VALID_BODY }))

    expect(verifyAuthorizedClient).toHaveBeenCalledWith(
      '12345678000195',
      'contato@empresa.com',
      'company-defenz'
    )
  })

  it('grava AuditLog com userId=system, userEmail=portal@defenz.com.br e changes com authorizedClientId', async () => {
    await POST(createRequest('POST', { body: VALID_BODY }))

    expect(mockDb.auditLog.create).toHaveBeenCalledOnce()
    const auditData = mockDb.auditLog.create.mock.calls[0][0].data
    expect(auditData.userId).toBe('system-user-id')
    expect(auditData.userEmail).toBe('portal@defenz.com.br')
    expect(auditData.entityType).toBe('Ticket')
    expect(auditData.action).toBe('CREATE')
    // changes deve ter source e authorizedClientId
    const changes = JSON.parse(auditData.changes)
    expect(changes.source).toEqual({ from: null, to: 'portal' })
    expect(changes.authorizedClientId).toEqual({ from: null, to: 'ac-001' })
  })

  it('priority default=media quando nao enviada', async () => {
    const bodyWithoutPriority = { ...VALID_BODY }
    delete (bodyWithoutPriority as { priority?: string }).priority

    await POST(createRequest('POST', { body: bodyWithoutPriority }))

    const createData = mockDb.ticket.create.mock.calls[0][0].data
    expect(createData.priority).toBe('media')
  })
})

describe('POST /api/public/tickets — dedup (idempotencia)', () => {
  it('retorna protocolo existente sem criar novo ticket quando dedup ativa', async () => {
    mockDb.ticket.findFirst.mockResolvedValue({ protocol: 'SD-2026-000001' })

    const res = await POST(createRequest('POST', { body: VALID_BODY }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ success: true, data: { protocol: 'SD-2026-000001' } })
    expect(mockDb.ticket.create).not.toHaveBeenCalled()
  })
})

describe('POST /api/public/tickets — sad path (anti-enumeracao, 422 generica)', () => {
  const EXPECTED_422 = {
    success: false,
    error: 'Nao foi possivel validar seus dados. Confira o CNPJ e o e-mail cadastrado na console.',
  }

  it('no-match no AuthorizedClient → 422 generica, sem criar ticket', async () => {
    vi.mocked(verifyAuthorizedClient).mockResolvedValue({ ok: false })

    const res = await POST(createRequest('POST', { body: VALID_BODY }))
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json).toEqual(EXPECTED_422)
    expect(mockDb.ticket.create).not.toHaveBeenCalled()
  })

  it('body com campo de controle extra (assignedToId) rejeitado pelo strict → 422 generica', async () => {
    const bodyWithExtra = { ...VALID_BODY, assignedToId: 'user-hacker' }

    const res = await POST(createRequest('POST', { body: bodyWithExtra }))
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json).toEqual(EXPECTED_422)
    expect(mockDb.ticket.create).not.toHaveBeenCalled()
  })

  it('body com status extra rejeitado pelo strict → 422 generica', async () => {
    const bodyWithStatus = { ...VALID_BODY, status: 'concluido' }

    const res = await POST(createRequest('POST', { body: bodyWithStatus }))
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json).toEqual(EXPECTED_422)
    expect(mockDb.ticket.create).not.toHaveBeenCalled()
  })

  it('body com companyId extra rejeitado pelo strict → 422 generica', async () => {
    const bodyWithCompany = { ...VALID_BODY, companyId: 'outra-empresa' }

    const res = await POST(createRequest('POST', { body: bodyWithCompany }))
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json).toEqual(EXPECTED_422)
    expect(mockDb.ticket.create).not.toHaveBeenCalled()
  })

  it('honeypot _hp preenchido → 422 generica', async () => {
    const bodyWithHoneypot = { ...VALID_BODY, _hp: 'bot preencheu isso' }

    const res = await POST(createRequest('POST', { body: bodyWithHoneypot }))
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json).toEqual(EXPECTED_422)
    expect(mockDb.ticket.create).not.toHaveBeenCalled()
  })

  it('tempo desde render < 2000ms (_t muito recente) → 422 generica', async () => {
    const bodyTooFast = { ...VALID_BODY, _t: Date.now() - 500 } // apenas 500ms atrás

    const res = await POST(createRequest('POST', { body: bodyTooFast }))
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json).toEqual(EXPECTED_422)
    expect(mockDb.ticket.create).not.toHaveBeenCalled()
  })

  it('CNPJ com menos de 14 digitos apos normalizacao → 422 generica', async () => {
    const bodyInvalidCnpj = { ...VALID_BODY, cnpj: '12.345.678/0001' } // falta dígito

    const res = await POST(createRequest('POST', { body: bodyInvalidCnpj }))
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json).toEqual(EXPECTED_422)
    expect(mockDb.ticket.create).not.toHaveBeenCalled()
  })

  it('CNPJ com mais de 14 digitos apos normalizacao → 422 generica', async () => {
    const bodyInvalidCnpj = { ...VALID_BODY, cnpj: '12345678000195999' } // excesso de dígitos

    const res = await POST(createRequest('POST', { body: bodyInvalidCnpj }))
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json).toEqual(EXPECTED_422)
    expect(mockDb.ticket.create).not.toHaveBeenCalled()
  })

  it('campo obrigatorio ausente (cnpj faltando) → 422 generica (nao vaza detalhes do Zod)', async () => {
    const { cnpj: _omit, ...bodyWithoutCnpj } = VALID_BODY

    const res = await POST(createRequest('POST', { body: bodyWithoutCnpj }))
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json).toEqual(EXPECTED_422)
    // Garante que details do Zod NAO foi exposto
    expect(json).not.toHaveProperty('details')
  })

  it('email invalido no body → 422 generica', async () => {
    const bodyBadEmail = { ...VALID_BODY, email: 'nao-e-um-email' }

    const res = await POST(createRequest('POST', { body: bodyBadEmail }))
    const json = await res.json()

    expect(res.status).toBe(422)
    expect(json).toEqual(EXPECTED_422)
  })
})

describe('POST /api/public/tickets — rate-limit', () => {
  it('retorna 429 quando rate-limit estoura (nao chega a parsear body)', async () => {
    const { NextResponse } = await import('next/server')
    vi.mocked(checkRateLimit).mockReturnValue(
      NextResponse.json({ error: 'Muitas tentativas. Tente novamente em alguns minutos.' }, { status: 429 })
    )

    const res = await POST(createRequest('POST', { body: VALID_BODY }))

    expect(res.status).toBe(429)
    // rate-limit dispara antes de tudo — nem resolve companyId.
    expect(resolveDefenzCompanyId).not.toHaveBeenCalled()
    expect(mockDb.ticket.create).not.toHaveBeenCalled()
  })
})
