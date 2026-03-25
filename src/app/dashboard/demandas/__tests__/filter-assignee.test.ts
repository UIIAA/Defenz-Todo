import { describe, it, expect } from 'vitest'
import { filterByAssignee, type Demanda } from '../helpers'

const makeDemanda = (assignee: string | null): Demanda => ({
  id: crypto.randomUUID(),
  title: 'Test',
  description: null,
  origin: 'fernando',
  status: 'solicitada',
  priority: 'media',
  classification: null,
  assignee,
  dateIn: '2026-01-01',
  deadline: null,
  dateDone: null,
})

describe('filterByAssignee', () => {
  const demandas = [
    makeDemanda('Marcos Vinicius da Cruz'),
    makeDemanda('marcos vinicius da cruz'),
    makeDemanda('Fernando Souza'),
    makeDemanda(null),
  ]

  it('filtro __mine__ encontra demandas pelo nome (case-insensitive)', () => {
    const result = filterByAssignee(demandas, '__mine__', 'MARCOS VINICIUS DA CRUZ', '')
    expect(result).toHaveLength(2)
    expect(result.every((d) => d.assignee?.toLowerCase() === 'marcos vinicius da cruz')).toBe(true)
  })

  it('filtro __mine__ encontra demandas pelo email quando assignee é email', () => {
    const withEmail = [...demandas, makeDemanda('marcos@defenz.com')]
    const result = filterByAssignee(withEmail, '__mine__', 'Outro Nome', 'Marcos@defenz.com')
    expect(result).toHaveLength(1)
    expect(result[0].assignee).toBe('marcos@defenz.com')
  })

  it('filtro __mine__ retorna vazio quando nenhuma demanda pertence ao usuario', () => {
    const result = filterByAssignee(demandas, '__mine__', 'Admin Defenz', 'admin@defenz.com')
    expect(result).toHaveLength(0)
  })

  it('filtro por nome especifico funciona com case diferente', () => {
    const result = filterByAssignee(demandas, 'fernando souza', '', '')
    expect(result).toHaveLength(1)
    expect(result[0].assignee).toBe('Fernando Souza')
  })

  it('filtro all retorna todas as demandas', () => {
    const result = filterByAssignee(demandas, 'all', 'Marcos', 'marcos@x.com')
    expect(result).toHaveLength(4)
  })
})
