import { describe, it, expect } from 'vitest'
import {
  renderApresentacaoHtml,
  type ApresentacaoDocumento,
} from '../templates/institucional-a4'
import { fatosParaSetor } from '../mercado-fatos'
import { recomendarNivel } from '../comparativo'
import { PROIBIDO } from '../institucional-fatos'

function doc(over: Partial<ApresentacaoDocumento> = {}): ApresentacaoDocumento {
  const setor = over.setor ?? 'Saúde'
  return {
    clienteNome: 'Dr. Antônio Ribeiro',
    empresaNome: 'Clínica São Rafael',
    setor,
    dataFormatada: '21/08/2026',
    ano: 2026,
    vendedor: { nome: 'Gustavo Figueira', email: 'gustavo@defenz.com.br' },
    fatos: fatosParaSetor(setor),
    casos: [],
    nivelDestaque: 'PREMIUM',
    ...over,
  }
}

const secoes = (html: string) =>
  [...html.matchAll(/>(\d{2}\.)<\/span>/g)].map((m) => m[1])
const rodapes = (html: string) =>
  [...html.matchAll(/Página (\d{2}) de (\d{2})/g)]

describe('numeração — derivada, nunca escrita à mão', () => {
  // ⚠️ Esta é a cicatriz de 21/08: a proposta foi para produção pulando de 05
  // para 07 porque uma seção morava em outra função. Aqui o número sai do
  // índice do array, e o teste confere a SEQUÊNCIA.
  it('as seções são contíguas de 01 até a última, com e sem casos', () => {
    for (const casos of [[], [caso()]]) {
      const s = secoes(renderApresentacaoHtml(doc({ casos })))
      expect(s).toEqual(s.map((_, i) => String(i + 1).padStart(2, '0') + '.'))
      expect(s.length).toBeGreaterThanOrEqual(7)
    }
  })

  it('a página de casos entra e some, e a numeração se refaz sozinha', () => {
    const sem = secoes(renderApresentacaoHtml(doc({ casos: [] })))
    const com = secoes(renderApresentacaoHtml(doc({ casos: [caso()] })))
    expect(com.length).toBe(sem.length + 1)
  })

  it('os rodapés são contíguos de 02 até total-1, e o total bate', () => {
    const html = renderApresentacaoHtml(doc())
    const rs = rodapes(html)
    const total = Number(rs[0][2])
    expect(new Set(rs.map((r) => Number(r[2])))).toEqual(new Set([total]))
    expect(rs.map((r) => Number(r[1]))).toEqual(
      Array.from({ length: total - 2 }, (_, i) => i + 2)
    )
  })
})

describe('o documento se adequa ao nicho', () => {
  it('saúde traz o número da saúde; financeiro traz o do financeiro', () => {
    const saude = renderApresentacaoHtml(doc({ setor: 'Saúde', fatos: fatosParaSetor('Saúde') }))
    expect(saude).toContain('O que está acontecendo em Saúde')
    expect(saude).toContain('R$ 11,43 milhões')
    expect(saude).not.toContain('R$ 8,92 milhões')

    const fin = renderApresentacaoHtml(
      doc({ setor: 'Financeiro', fatos: fatosParaSetor('Financeiro') })
    )
    expect(fin).toContain('R$ 8,92 milhões')
    expect(fin).not.toContain('R$ 11,43 milhões')
  })

  it('setor sem fato próprio sai institucional, sem inventar número de setor', () => {
    const html = renderApresentacaoHtml(
      doc({ setor: 'Padaria', fatos: fatosParaSetor('Padaria') })
    )
    expect(html).toContain('R$ 7,19 milhões') // o dado nacional continua
    expect(html).not.toContain('R$ 11,43 milhões')
    expect(html).not.toContain('R$ 8,92 milhões')
  })

  it('destaca o nível recomendado, e só ele', () => {
    const html = renderApresentacaoHtml(doc({ nivelDestaque: recomendarNivel(['XDR_SENSORES']) }))
    expect(html).toContain('recomendado')
    expect((html.match(/recomendado/g) ?? []).length).toBe(1)
  })
})

describe('o que o documento não pode afirmar', () => {
  const html = renderApresentacaoHtml(doc({ casos: [caso()] }))

  it('não cita concorrente (A15) nem promete mobile (A16)', () => {
    for (const nome of PROIBIDO.concorrentes) {
      expect(html.toLowerCase(), `citou ${nome}`).not.toContain(nome.toLowerCase())
    }
    for (const frase of PROIBIDO.superlativos) {
      expect(html.toLowerCase(), `afirmou "${frase}"`).not.toContain(frase.toLowerCase())
    }
    expect(html).not.toMatch(/\biOS\b/)
    expect(html).not.toContain('Android')
  })

  it('não tem página de clientes (A16)', () => {
    expect(html).not.toContain('Alguns dos nossos clientes')
  })

  it('todo caso mostra veículo, ano e o recurso que responde', () => {
    expect(html).toContain('Folha de S.Paulo · 2025')
    expect(html).toContain('Responde por isso:')
    expect(html).toContain('Mitigação de Ransomware')
  })

  it('é A4, o mesmo da proposta', () => {
    expect(html).toContain('@page { size:210mm 297mm; margin:0; }')
    expect(html).toContain('width:210mm; height:297mm')
    // Sem sombra: o Skia rasteriza box-shadow como retângulo sólido e vira
    // borrão no papel. Os comentários do CSS saem antes — o próprio aviso
    // contra a sombra contém a palavra, e faria o teste falhar por si mesmo.
    const semComentarios = html.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(semComentarios).not.toContain('box-shadow')
  })
})

function caso() {
  return {
    oQueAconteceu:
      'Uma rede hospitalar brasileira teve prontuários criptografados e o atendimento eletivo suspenso.',
    necessidade:
      'Sem detecção de criptografia anormal em tempo real, o ataque só é percebido quando o dado já está inacessível.',
    funcionalidade: 'MITIGACAO_RANSOMWARE' as const,
    veiculo: 'Folha de S.Paulo',
    ano: 2025,
  }
}
