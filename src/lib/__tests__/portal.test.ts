import { describe, it, expect } from 'vitest'
import { normalizeCnpj, normalizeEmail, formatProtocol } from '../portal'

describe('normalizeCnpj', () => {
  it('retorna apenas dígitos de um CNPJ com máscara', () => {
    expect(normalizeCnpj('11.222.333/0001-81')).toBe('11222333000181')
  })

  it('retorna apenas dígitos de um CNPJ sem máscara', () => {
    expect(normalizeCnpj('11222333000181')).toBe('11222333000181')
  })

  it('remove espaços e caracteres especiais', () => {
    expect(normalizeCnpj('  11 222 333 0001 81  ')).toBe('11222333000181')
  })

  it('string vazia retorna vazia', () => {
    expect(normalizeCnpj('')).toBe('')
  })
})

describe('normalizeEmail', () => {
  it('converte para lowercase', () => {
    expect(normalizeEmail('TESTE@Cliente.COM.BR')).toBe('teste@cliente.com.br')
  })

  it('remove espaços em branco', () => {
    expect(normalizeEmail('  teste@cliente.com.br  ')).toBe('teste@cliente.com.br')
  })

  it('já normalizado retorna igual', () => {
    expect(normalizeEmail('teste@cliente.com.br')).toBe('teste@cliente.com.br')
  })
})

describe('formatProtocol', () => {
  it('gera protocolo no formato correto com zero-pad', () => {
    expect(formatProtocol(2026, 123)).toBe('SD-2026-000123')
  })

  it('seq 1 → 000001', () => {
    expect(formatProtocol(2026, 1)).toBe('SD-2026-000001')
  })

  it('seq com 6 dígitos não adiciona zeros', () => {
    expect(formatProtocol(2026, 999999)).toBe('SD-2026-999999')
  })

  it('ano diferente reflete corretamente', () => {
    expect(formatProtocol(2027, 42)).toBe('SD-2027-000042')
  })
})
