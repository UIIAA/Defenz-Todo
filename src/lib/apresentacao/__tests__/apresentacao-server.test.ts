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

describe('re-download reimprime o que foi afirmado, não o catálogo de hoje', () => {
  it('o snapshot basta para remontar o documento', async () => {
    const { renderApresentacaoHtml } = await import('../templates/institucional-a4')
    // Um fato que NÃO existe mais no catálogo: se a renderização dependesse do
    // catálogo vivo, ele sumiria do re-download — que é exatamente o buraco que
    // a Proposta pagou em 21/08.
    const snapshot = [
      {
        id: 'M-antigo',
        texto: 'Um dado de mercado que saiu do catálogo depois.',
        valor: 'R$ 1,23 milhão',
        fonte: 'Instituto Fictício',
        ano: 2025,
      },
    ]
    const html = renderApresentacaoHtml({
      clienteNome: 'Fulano',
      empresaNome: 'Empresa X',
      setor: 'Saúde',
      dataFormatada: '22/08/2026',
      ano: 2026,
      vendedor: { nome: 'V', email: 'v@defenz.com.br' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fatos: snapshot as any,
      casos: [],
      nivelDestaque: 'PREMIUM',
    })
    expect(html).toContain('R$ 1,23 milhão')
    expect(html).toContain('Instituto Fictício')
    // e o número de hoje NÃO aparece
    expect(html).not.toContain('R$ 11,43 milhões')
  })
})
