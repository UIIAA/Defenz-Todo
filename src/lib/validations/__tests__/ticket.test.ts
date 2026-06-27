import { describe, it, expect } from 'vitest'
import {
  createTicketSchema,
  updateTicketSchema,
  createTicketMessageSchema,
  escalateTicketSchema,
  linkDemandaSchema,
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
