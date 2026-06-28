import { describe, it, expect } from 'vitest'
import {
  createTicketSchema,
  updateTicketSchema,
  createTicketMessageSchema,
  escalateTicketSchema,
  linkDemandaSchema,
  publicCreateTicketSchema,
} from '../ticket'

describe('createTicketSchema', () => {
  it('aceita um ticket válido com defaults', () => {
    const r = createTicketSchema.parse({ subject: 'Acesso BM da Sheila' })
    expect(r.subject).toBe('Acesso BM da Sheila')
    expect(r.priority).toBe('media')
  })

  it('rejeita subject vazio', () => {
    expect(() => createTicketSchema.parse({ subject: '' })).toThrow()
  })

  it('rejeita channel inválido', () => {
    expect(() => createTicketSchema.parse({ subject: 'x', channel: 'pombo-correio' })).toThrow()
  })
})

describe('updateTicketSchema', () => {
  it('aceita transição de status', () => {
    expect(updateTicketSchema.parse({ status: 'concluido' }).status).toBe('concluido')
  })
  it('rejeita status fora do conjunto', () => {
    expect(() => updateTicketSchema.parse({ status: 'fechado' })).toThrow()
  })
})

describe('createTicketMessageSchema', () => {
  it('default kind=reply', () => {
    expect(createTicketMessageSchema.parse({ body: 'respondendo' }).kind).toBe('reply')
  })
  it('aceita note', () => {
    expect(createTicketMessageSchema.parse({ body: 'nota interna', kind: 'note' }).kind).toBe('note')
  })
  it('rejeita body vazio', () => {
    expect(() => createTicketMessageSchema.parse({ body: '' })).toThrow()
  })
})

describe('escalateTicketSchema', () => {
  it('exige escalatedTo não-vazio', () => {
    expect(escalateTicketSchema.parse({ escalatedTo: 'SecuriSoft' }).escalatedTo).toBe('SecuriSoft')
    expect(() => escalateTicketSchema.parse({ escalatedTo: '' })).toThrow()
  })
})

describe('linkDemandaSchema', () => {
  it('exige demandaId', () => {
    expect(linkDemandaSchema.parse({ demandaId: 'd1' }).demandaId).toBe('d1')
    expect(() => linkDemandaSchema.parse({})).toThrow()
  })
})

describe('publicCreateTicketSchema', () => {
  const validPayload = {
    cnpj: '11.222.333/0001-81',
    email: 'contato@cliente.com.br',
    name: 'João Silva',
    subject: 'Problema de acesso',
    description: 'Não consigo acessar o painel.',
  }

  it('aceita payload válido com campos obrigatórios', () => {
    const r = publicCreateTicketSchema.parse(validPayload)
    expect(r.cnpj).toBe('11.222.333/0001-81')
    expect(r.subject).toBe('Problema de acesso')
    expect(r.priority).toBeUndefined()
  })

  it('aceita payload com campos opcionais (priority, _hp, _t)', () => {
    const r = publicCreateTicketSchema.parse({
      ...validPayload,
      priority: 'alta',
      _hp: '',
      _t: 4000,
    })
    expect(r.priority).toBe('alta')
    expect(r._hp).toBe('')
    expect(r._t).toBe(4000)
  })

  it('rejeita campo extra (assignedToId) — .strict()', () => {
    expect(() =>
      publicCreateTicketSchema.parse({ ...validPayload, assignedToId: 'user-123' })
    ).toThrow()
  })

  it('rejeita campo extra (status) — .strict()', () => {
    expect(() =>
      publicCreateTicketSchema.parse({ ...validPayload, status: 'concluido' })
    ).toThrow()
  })

  it('rejeita campo extra (companyId) — .strict()', () => {
    expect(() =>
      publicCreateTicketSchema.parse({ ...validPayload, companyId: 'cmp-abc' })
    ).toThrow()
  })

  it('rejeita subject com mais de 200 caracteres', () => {
    expect(() =>
      publicCreateTicketSchema.parse({ ...validPayload, subject: 'x'.repeat(201) })
    ).toThrow()
  })

  it('rejeita description com mais de 5000 caracteres', () => {
    expect(() =>
      publicCreateTicketSchema.parse({ ...validPayload, description: 'x'.repeat(5001) })
    ).toThrow()
  })

  it('rejeita e-mail inválido', () => {
    expect(() =>
      publicCreateTicketSchema.parse({ ...validPayload, email: 'nao-e-email' })
    ).toThrow()
  })

  it('rejeita priority inválida', () => {
    expect(() =>
      publicCreateTicketSchema.parse({ ...validPayload, priority: 'urgente' })
    ).toThrow()
  })
})
