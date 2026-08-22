import { describe, it, expect } from 'vitest'
import { formatarDataSP, nomeArquivoApresentacao } from '../apresentacao-server'
import { createApresentacaoSchema } from '@/lib/validations/apresentacao'

describe('nome do arquivo', () => {
  // 03:30 UTC de 22/08 é ainda 22/08 em São Paulo (00:30). Se o código usasse
  // UTC direto, a data do arquivo pularia um dia — é a invariante I3.
  const quando = new Date('2026-08-22T03:30:00Z')

  it('leva empresa, data e HORÁRIO — não contador', () => {
    // Contador exigiria consultar o banco, e dois cliques simultâneos gerariam
    // o mesmo nome (spec §8).
    expect(nomeArquivoApresentacao('Clínica São Rafael', quando)).toBe(
      'Defenz_Apresentacao_Clinica-Sao-Rafael_2026-08-22_0030.pdf'
    )
  })

  it('empresa sem caractere aproveitável não gera nome quebrado', () => {
    expect(nomeArquivoApresentacao('///', quando)).toContain('Defenz_Apresentacao_Cliente_')
  })

  it('data sai no fuso de São Paulo', () => {
    expect(formatarDataSP(quando)).toBe('22/08/2026')
  })
})

describe('schema de emissão', () => {
  const base = { clienteNome: 'Dr. Antônio', empresaNome: 'Clínica São Rafael' }

  it('aceita o mínimo e assume Premium em destaque', () => {
    const r = createApresentacaoSchema.parse(base)
    expect(r.nivelDestaque).toBe('PREMIUM')
  })

  it('setor vazio é legítimo — sai institucional, sem inventar número de setor', () => {
    expect(createApresentacaoSchema.parse({ ...base, setor: null }).setor).toBeNull()
  })

  it('recusa sem empresa e recusa nível inexistente', () => {
    expect(() => createApresentacaoSchema.parse({ ...base, empresaNome: '  ' })).toThrow()
    expect(() =>
      createApresentacaoSchema.parse({ ...base, nivelDestaque: 'MEGA_PLUS' })
    ).toThrow()
  })
})
