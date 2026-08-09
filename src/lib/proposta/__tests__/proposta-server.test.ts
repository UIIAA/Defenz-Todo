import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/db', () => {
  const propostaSequence = { upsert: vi.fn(), update: vi.fn() }
  const $transaction = vi.fn()
  return { db: { propostaSequence, $transaction } }
})

import { db } from '@/lib/db'
import { formatarCodigo, nextPropostaCodigo, PRIMEIRA_SEQUENCIA } from '../numeracao'
import {
  anoEmSaoPaulo,
  nomeArquivo,
  reconstruirDocumento,
} from '../proposta-server'
import { calcularInvestimento } from '../calculo'
import { ajusteAssinado, createPropostaSchema } from '@/lib/validations/proposta'
import { ApiError } from '@/lib/api-helpers'

const mockDb = db as unknown as {
  propostaSequence: { upsert: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

describe('numeração', () => {
  beforeEach(() => vi.clearAllMocks())

  it('a primeira emissão é DFZ-<ano>-01986', () => {
    expect(formatarCodigo(2026, PRIMEIRA_SEQUENCIA)).toBe('DFZ-2026-01986')
  })

  it('mantém 5 dígitos e cresce além deles sem truncar', () => {
    expect(formatarCodigo(2026, 1987)).toBe('DFZ-2026-01987')
    expect(formatarCodigo(2026, 99999)).toBe('DFZ-2026-99999')
    expect(formatarCodigo(2026, 100000)).toBe('DFZ-2026-100000')
  })

  it('NÃO zera na virada do ano — o ano é rótulo, o número é contínuo', async () => {
    // A sequência é uma linha só (id=1). Se zerasse por ano, 2027 emitiria
    // 01986 de novo e dois documentos diferentes teriam o mesmo significado.
    mockDb.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn(mockDb)
    )
    mockDb.propostaSequence.upsert.mockResolvedValue({})
    mockDb.propostaSequence.update.mockResolvedValue({ lastSeq: 2050 })

    expect(await nextPropostaCodigo(2027)).toBe('DFZ-2027-02050')
    expect(mockDb.propostaSequence.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1 } })
    )
  })

  it('reserva com increment no banco, não com count+1 em memória', async () => {
    mockDb.$transaction.mockImplementation(async (fn: (tx: unknown) => unknown) =>
      fn(mockDb)
    )
    mockDb.propostaSequence.upsert.mockResolvedValue({})
    mockDb.propostaSequence.update.mockResolvedValue({ lastSeq: 1986 })

    await nextPropostaCodigo(2026)
    expect(mockDb.propostaSequence.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { lastSeq: { increment: 1 } } })
    )
  })
})

describe('anoEmSaoPaulo', () => {
  it('usa o fuso de SP, não UTC — 1º de janeiro às 02:00Z ainda é 31/12 em SP', () => {
    expect(anoEmSaoPaulo(new Date('2027-01-01T02:00:00Z'))).toBe(2026)
    expect(anoEmSaoPaulo(new Date('2026-08-09T12:00:00Z'))).toBe(2026)
  })
})

describe('nomeArquivo', () => {
  it('inclui o código e a empresa, sem acento nem caractere problemático', () => {
    expect(nomeArquivo('DFZ-2026-01986', 'Acme Indústria & Cia/Ltda')).toBe(
      'Proposta Defenz DFZ-2026-01986 - Acme-Industria-Cia-Ltda.pdf'
    )
  })

  it('aguenta empresa só com símbolo sem virar nome quebrado', () => {
    expect(nomeArquivo('DFZ-2026-01986', '///')).toBe('Proposta Defenz DFZ-2026-01986.pdf')
  })
})

describe('reconstruirDocumento — o re-download usa o snapshot, não a tabela de hoje', () => {
  const snapshot = calcularInvestimento({
    quantidade: 30,
    planos: ['BUSINESS_SECURITY'],
    ajustePercent: 0,
  })

  it('reimprime com o preço gravado', () => {
    // Simula tabela que mudou depois da emissão: o snapshot carrega 999,99 e é
    // ele que tem de sair, senão o mesmo número de proposta viraria outro preço.
    const congelado = structuredClone(snapshot)
    congelado.planos[0].vigencias[2].precoLicenca = 999.99

    const doc = reconstruirDocumento({
      codigo: 'DFZ-2026-01986',
      clienteNome: 'Maria Souza',
      empresaNome: 'Acme',
      precoSnapshot: congelado,
      createdAt: new Date('2026-08-09T15:00:00Z'),
      criadoPor: { name: 'Vendedor Teste', email: 'v@defenz.com.br' },
    })

    expect(doc.investimento.planos[0].vigencias[2].precoLicenca).toBe(999.99)
    expect(doc.codigo).toBe('DFZ-2026-01986')
    expect(doc.dataFormatada).toBe('09/08/2026') // data da emissão, não de hoje
  })

  it('recusa registro sem snapshot em vez de reimprimir preço inventado', () => {
    expect(() =>
      reconstruirDocumento({
        codigo: 'DFZ-2026-01986',
        clienteNome: 'x',
        empresaNome: 'y',
        precoSnapshot: null,
        createdAt: new Date(),
        criadoPor: null,
      })
    ).toThrow(ApiError)
  })

  it('não quebra quando o vendedor foi deletado (FK SetNull)', () => {
    const doc = reconstruirDocumento({
      codigo: 'DFZ-2026-01986',
      clienteNome: 'Maria',
      empresaNome: 'Acme',
      precoSnapshot: snapshot,
      createdAt: new Date('2026-08-09T15:00:00Z'),
      criadoPor: null,
    })
    expect(doc.vendedor.nome).toBe('Comercial Defenz')
  })
})

describe('validação do formulário', () => {
  const base = {
    clienteNome: 'Maria',
    empresaNome: 'Acme',
    quantidade: 30,
    planos: ['BUSINESS_SECURITY'],
    basePreco: 'tabela',
  }

  it('aceita o caminho feliz', () => {
    expect(createPropostaSchema.parse(base).quantidade).toBe(30)
  })

  it('recusa quantidade 4 e 1000 — fora da tabela pública', () => {
    expect(() => createPropostaSchema.parse({ ...base, quantidade: 4 })).toThrow()
    expect(() => createPropostaSchema.parse({ ...base, quantidade: 1000 })).toThrow()
  })

  it('recusa lista de planos vazia', () => {
    expect(() => createPropostaSchema.parse({ ...base, planos: [] })).toThrow()
  })

  it('exige percentual quando o preço não é o de tabela', () => {
    expect(() =>
      createPropostaSchema.parse({ ...base, basePreco: 'abaixo' })
    ).toThrow()
    expect(
      createPropostaSchema.parse({ ...base, basePreco: 'abaixo', percentual: 5 })
        .percentual
    ).toBe(5)
  })
})

describe('ajusteAssinado', () => {
  it('desconto vira negativo, acréscimo positivo', () => {
    expect(ajusteAssinado({ basePreco: 'abaixo', percentual: 10 })).toBe(-10)
    expect(ajusteAssinado({ basePreco: 'acima', percentual: 10 })).toBe(10)
  })

  it('tabela ignora percentual esquecido na tela — nada de desconto fantasma', () => {
    expect(ajusteAssinado({ basePreco: 'tabela', percentual: 25 })).toBe(0)
  })
})
