import { describe, it, expect } from 'vitest'
import {
  createPlaybookSchema,
  updatePlaybookSchema,
  assertKindInvariant,
} from '../playbook'

describe('createPlaybookSchema', () => {
  it('aceita POP sem externalUrl e aplica os defaults', () => {
    const r = createPlaybookSchema.parse({ title: 'Acesso BM', body: '# passo 1' })
    expect(r.kind).toBe('POP')
    expect(r.reviewIntervalDays).toBe(90)
    expect(r.tags).toEqual([])
  })

  it('rejeita título vazio', () => {
    expect(() => createPlaybookSchema.parse({ title: '', body: 'x' })).toThrow()
  })

  it('rejeita externalUrl que não é https', () => {
    expect(() =>
      createPlaybookSchema.parse({
        title: 'x',
        body: 'y',
        kind: 'BIBLIOTECA',
        externalUrl: 'javascript:alert(1)',
      })
    ).toThrow()
  })
})

describe('assertKindInvariant — valida o ESTADO MERGEADO, não o payload', () => {
  it('rejeita PUT que vira BIBLIOTECA quando o existente não tem externalUrl', () => {
    const existente = { kind: 'POP' as const, externalUrl: null }
    const payload = updatePlaybookSchema.parse({ kind: 'BIBLIOTECA' })
    expect(() => assertKindInvariant(existente, payload)).toThrow()
  })

  it('aceita PUT que vira BIBLIOTECA quando o existente já tem externalUrl', () => {
    const existente = { kind: 'POP' as const, externalUrl: 'https://drive.google.com/x' }
    const payload = updatePlaybookSchema.parse({ kind: 'BIBLIOTECA' })
    expect(() => assertKindInvariant(existente, payload)).not.toThrow()
  })

  it('rejeita PUT que apaga o externalUrl de um item BIBLIOTECA', () => {
    const existente = { kind: 'BIBLIOTECA' as const, externalUrl: 'https://drive.google.com/x' }
    const payload = updatePlaybookSchema.parse({ externalUrl: null })
    expect(() => assertKindInvariant(existente, payload)).toThrow()
  })
})
