import { describe, it, expect } from 'vitest'
import { resolveStatus, STATUSES, COLUMN_HELP } from './status.js'

describe('resolveStatus', () => {
  it('accepts canonical statuses verbatim', () => {
    for (const s of STATUSES) {
      expect(resolveStatus(s)).toBe(s)
    }
  })

  it('maps human column labels (singular) to status', () => {
    expect(resolveStatus('Solicitada')).toBe('solicitada')
    expect(resolveStatus('Selecionada')).toBe('selecionada')
    expect(resolveStatus('Em Andamento')).toBe('em_andamento')
    expect(resolveStatus('Concluida')).toBe('concluida')
    expect(resolveStatus('Bloqueada')).toBe('bloqueada')
  })

  it('is accent-insensitive (Concluída → concluida)', () => {
    expect(resolveStatus('Concluída')).toBe('concluida')
  })

  it('is case-insensitive and trims whitespace', () => {
    expect(resolveStatus('  EM ANDAMENTO  ')).toBe('em_andamento')
    expect(resolveStatus('em andamento')).toBe('em_andamento')
  })

  it('accepts plural label variants used in stats UI', () => {
    expect(resolveStatus('Solicitadas')).toBe('solicitada')
    expect(resolveStatus('Selecionadas')).toBe('selecionada')
    expect(resolveStatus('Concluidas')).toBe('concluida')
  })

  it('accepts common english/synonym aliases', () => {
    expect(resolveStatus('in progress')).toBe('em_andamento')
    expect(resolveStatus('done')).toBe('concluida')
    expect(resolveStatus('blocked')).toBe('bloqueada')
  })

  it('throws an actionable error listing valid columns for unknown input', () => {
    expect(() => resolveStatus('Arquivada')).toThrowError(/coluna/i)
    // a mensagem deve conter as opções válidas para guiar o agente
    expect(() => resolveStatus('xyz')).toThrowError(/em_andamento/)
  })

  it('COLUMN_HELP lists every canonical status', () => {
    for (const s of STATUSES) {
      expect(COLUMN_HELP).toContain(s)
    }
  })
})
