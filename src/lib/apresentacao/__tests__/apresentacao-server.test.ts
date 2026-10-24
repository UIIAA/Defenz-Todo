import { describe, it, expect } from 'vitest'
import {
  formatarDataSP,
  nomeArquivoApresentacao,
  inicioDoDiaSP,
  auditoriaEmissao,
  auditoriaReDownload,
} from '../apresentacao-server'
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

  it('modo só DLP não sai com o mesmo nome do documento Bitdefender', () => {
    expect(nomeArquivoApresentacao('Clínica São Rafael', quando, 'dlp')).toBe(
      'Defenz_Apresentacao_DLP_Clinica-Sao-Rafael_2026-08-22_0030.pdf'
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

describe('inicioDoDiaSP — o cap diário é do dia do vendedor, não do servidor', () => {
  // ⚠️ Na Vercel o servidor é UTC. `setHours(0,0,0,0)` faria o dia começar às 21h
  // de ontem em São Paulo, dando três horas de pesquisa de brinde toda noite.
  it('vira o dia à meia-noite de São Paulo, não à do UTC', () => {
    // 02/09 às 01:00 UTC = 01/09 às 22:00 em SP: ainda é dia 01 lá.
    expect(inicioDoDiaSP(new Date('2026-09-02T01:00:00Z')).toISOString()).toBe(
      '2026-09-01T03:00:00.000Z'
    )
    // 02/09 às 12:00 UTC = 02/09 às 09:00 em SP.
    expect(inicioDoDiaSP(new Date('2026-09-02T12:00:00Z')).toISOString()).toBe(
      '2026-09-02T03:00:00.000Z'
    )
  })
})

describe('AuditLog da apresentação', () => {
  const base = {
    empresaNome: 'Clínica São Rafael',
    clienteNome: 'Dr. Antônio',
    setor: 'saude',
    nivelDestaque: 'premium',
    complementos: ['DLP_GTB'],
    casos: 2,
    casosRecusados: 1,
    arquivoNome: 'Defenz_Apresentacao_x.pdf',
    templateVersao: '2026-09-17+gtb-2026-10',
  }

  it('emissão Bitdefender registra nível, complementos e casos barrados', () => {
    const m = auditoriaEmissao({ ...base, tipo: 'bitdefender' })
    expect(m.tipo.to).toBe('Bitdefender')
    expect(m.complementos.to).toBe('DLP_GTB')
    expect(m.casos.to).toBe('2 citado(s) · 1 barrado(s) pela revisão')
    expect(m.templateVersao.to).toBe('2026-09-17+gtb-2026-10')
  })

  it('emissão só DLP não registra nível nem casos (o documento não tem)', () => {
    const m = auditoriaEmissao({ ...base, tipo: 'dlp', setor: null })
    expect(m.tipo.to).toBe('Só DLP')
    expect(m.setor.to).toBe('institucional')
    expect(m.nivelDestaque).toBeUndefined()
    expect(m.casos).toBeUndefined()
  })

  it('re-download com modelo divergente registra de qual para qual', () => {
    const emitidaEm = new Date('2026-08-22T15:00:00Z')
    const igual = auditoriaReDownload({ arquivoNome: 'a.pdf', emitidaEm, templateVersao: 'v1', templateAtual: 'v1' })
    expect(igual.modelo).toBeUndefined()
    const diverge = auditoriaReDownload({ arquivoNome: 'a.pdf', emitidaEm, templateVersao: 'v1', templateAtual: 'v2' })
    expect(diverge.modelo).toEqual({ from: 'v1', to: 'v2' })
    expect(diverge.emitidaEm.to).toBe('22/08/2026')
  })
})
