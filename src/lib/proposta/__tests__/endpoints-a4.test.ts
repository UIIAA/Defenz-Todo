import { describe, it, expect } from 'vitest'
import {
  renderPropostaHtml,
  totalPaginas,
  escapeHtml,
  formatarPercent,
  type PropostaDocumento,
} from '../templates/endpoints-a4'
import { calcularInvestimento } from '../calculo'
import type { PlanoId } from '../tabela-precos'

function doc(over: Partial<PropostaDocumento> = {}, planos: PlanoId[] = ['BUSINESS_SECURITY'], ajuste = 0): PropostaDocumento {
  return {
    codigo: 'DFZ-2026-01986',
    clienteNome: 'Maria Souza',
    empresaNome: 'Acme Indústria',
    dataFormatada: '09/08/2026',
    ano: 2026,
    vendedor: { nome: 'Vendedor Teste', email: 'vendedor@defenz.com.br' },
    investimento: calcularInvestimento({ quantidade: 30, planos, ajustePercent: ajuste }),
    ...over,
  }
}

describe('totalPaginas', () => {
  // 8 páginas fixas (capa, confidencialidade, 01..05 e encerramento) + uma de
  // investimento por plano.
  //
  // ⚠️ Era 9 até 21/08: a página "Alguns dos nossos clientes" saiu por decisão do
  // Marcos. Os dois documentos de referência (Buffo e Liquos) ainda a têm — este
  // teste deixou de espelhá-los DE PROPÓSITO, e é aqui que isso fica registrado.
  it('é 8 fixas + uma por plano — nunca constante', () => {
    expect(totalPaginas(1)).toBe(9)
    expect(totalPaginas(2)).toBe(10)
    expect(totalPaginas(3)).toBe(11)
  })
})

describe('renderPropostaHtml — estrutura', () => {
  it('gera uma página de investimento por plano marcado', () => {
    const um = renderPropostaHtml(doc({}, ['BUSINESS_SECURITY']))
    const tres = renderPropostaHtml(
      doc({}, ['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE'])
    )
    expect(contar(um, 'Investimento')).toBe(1)
    expect(contar(tres, 'Investimento')).toBe(3)
    expect(contar(tres, 'continuação')).toBe(2) // só da 2ª em diante
  })

  it('o rodapé traz o total REAL do documento, não um número fixo', () => {
    const um = renderPropostaHtml(doc({}, ['BUSINESS_SECURITY']))
    expect(um).toContain('Página 02 de 09')
    expect(um).toContain('Página 08 de 09') // única página de investimento
    expect(um).not.toContain('de 10')

    const tres = renderPropostaHtml(
      doc({}, ['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE'])
    )
    expect(tres).toContain('Página 08 de 11')
    expect(tres).toContain('Página 10 de 11')
    expect(tres).not.toContain('de 09')
  })

  it('conta exatamente uma section .page por página do documento', () => {
    const html = renderPropostaHtml(doc({}, ['BUSINESS_SECURITY', 'PREMIUM']))
    expect(contar(html, '<section class="page">')).toBe(totalPaginas(2))
  })

  it('não tem a página de clientes, e não cita iOS nem Android (21/08)', () => {
    const html = renderPropostaHtml(
      doc({}, ['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE'])
    )
    // A página inteira saiu: título, texto de apoio e a arte recortada.
    expect(html).not.toContain('Alguns dos nossos clientes')
    expect(html).not.toContain('empresa multidisciplinar')
    expect(html).not.toContain('mix-blend-mode')
    // As seções seguintes foram renumeradas — 06 não existe mais.
    expect(html).toContain('Parceria estratégica')
    expect(html).not.toMatch(/>06\.</)
    // Plataformas: o documento não promete mais mobile.
    expect(html).not.toMatch(/\biOS\b/)
    expect(html).not.toContain('Android')
    expect(html).toContain('Windows, Linux e Mac')
  })

  it('capa e encerramento não têm numeração de rodapé (como nos documentos reais)', () => {
    const html = renderPropostaHtml(doc({}, ['BUSINESS_SECURITY']))
    expect(contar(html, 'Página ')).toBe(7) // 02..08; capa e encerramento fora
  })
})

describe('renderPropostaHtml — nada do documento de referência vaza', () => {
  it('não contém dado de cliente de referência nem numeração antiga', () => {
    const html = renderPropostaHtml(
      doc({}, ['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE'], -5)
    )
    for (const proibido of [
      'João Buffo',
      'JOÃO BUFFO',
      'Joao Buffo',
      'Liquos',
      'LIQUOS',
      'VELOE',
      'Gustavo Figueira',
      'PBI-25-01642',
      'PBI-25-01608',
      'Neildes',
    ]) {
      expect(html).not.toContain(proibido)
    }
  })

  it('não fabrica métrica de console que contradiria o dimensionamento', () => {
    // O documento de referência traz "342 Endpoints protegidos" e "98% Security
    // Score" fixos, iguais para clientes de portes diferentes. Gerar isso numa
    // proposta de 30 licenças seria afirmar um número falso na mesma peça.
    const html = renderPropostaHtml(doc())
    expect(html).not.toContain('Security Score')
    expect(html).not.toContain('Endpoints protegidos')
    expect(html).not.toContain('>342<') // texto renderizado, não trecho de base64
    expect(html).toContain('GravityZone Console') // o painel continua existindo
  })

  it('não busca nada na rede — fonte e logo são data URI', () => {
    const html = renderPropostaHtml(doc())
    expect(html).not.toContain('fonts.googleapis.com')
    expect(html).not.toContain('fonts.gstatic.com')
    expect(html).not.toMatch(/src="(?!data:)[^"]*https?:/)
    expect(html).toContain("font-family: 'Manrope'")
    expect(html).toContain('data:font/woff2;base64,')
    expect(html).toContain('data:image/png;base64,')
  })

  it('é A4 com margem zero e quebra por página', () => {
    const html = renderPropostaHtml(doc())
    expect(html).toContain('@page { size: 210mm 297mm; margin: 0; }')
    expect(html).toContain('width: 210mm')
    expect(html).toContain('height: 297mm')
    expect(html).toContain('break-after: page')
  })
})

describe('renderPropostaHtml — dados do formulário', () => {
  it('escreve empresa, cliente, código, data e vendedor', () => {
    const html = renderPropostaHtml(doc())
    expect(html).toContain('Acme Indústria')
    expect(html).toContain('Maria Souza')
    expect(html).toContain('DFZ-2026-01986')
    expect(html).toContain('09/08/2026')
    expect(html).toContain('vendedor@defenz.com.br')
  })

  it('escapa markup vindo do formulário', () => {
    const html = renderPropostaHtml(doc({ empresaNome: '<script>alert(1)</script>' }))
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('usa o telefone institucional quando o vendedor não tem um', () => {
    const html = renderPropostaHtml(doc())
    expect(html).toContain('(11) 3040-2960')
  })
})

describe('renderPropostaHtml — bloco de investimento', () => {
  it('a coluna 36+12 é rotulada como tal e o unitário/mês divide por 48', () => {
    // O documento antigo escrevia "36 meses" e dividia por 48 — a conta estava
    // certa (é a oferta 36+12), o rótulo é que mentia. Aqui os dois batem.
    const html = renderPropostaHtml(doc({}, ['BUSINESS_SECURITY']))
    expect(html).toContain('36+12 meses')
    expect(html).toContain('R$ 3,58') // 171,97 / 48 meses de cobertura
    expect(html).not.toContain('>36 meses<') // nunca o rótulo enganoso sozinho
  })

  it('explica o bônus em texto, para o cliente não ter que deduzir', () => {
    const html = renderPropostaHtml(doc({}, ['BUSINESS_SECURITY']))
    expect(html).toContain('contrate 36 meses e receba mais 12')
    expect(html).toContain('48 meses no total pelo preço de 36')
  })

  it('sem ajuste: não existe linha de desconto, e o total final é o de tabela', () => {
    const html = renderPropostaHtml(doc({}, ['BUSINESS_SECURITY'], 0))
    expect(html).not.toContain('Desconto competitivo')
    expect(html).not.toContain('Acréscimo')
    expect(html).toContain('Total final')
    expect(html).toContain('R$ 5.159,10') // 171,97 × 30
  })

  it('desconto: rótulo "Desconto competitivo" com o percentual', () => {
    const html = renderPropostaHtml(doc({}, ['BUSINESS_SECURITY'], -10))
    expect(html).toContain('Desconto competitivo')
    expect(html).toContain('10%')
    expect(html).toContain('Unitário com desconto')
    expect(html).toContain('R$ 4.643,19') // 171,97 × 30 × 0,9
  })

  it('acréscimo: rótulo "Acréscimo", nunca "Desconto"', () => {
    const html = renderPropostaHtml(doc({}, ['PREMIUM'], 7.5))
    expect(html).toContain('Acréscimo')
    expect(html).toContain('7,5%')
    expect(html).not.toContain('Desconto competitivo')
  })

  it('mostra as três vigências e a faixa aplicada', () => {
    const html = renderPropostaHtml(doc({}, ['ENTERPRISE']))
    expect(html).toContain('12 meses')
    expect(html).toContain('24 meses')
    expect(html).toContain('36 meses')
    expect(html).toContain('faixa 25-49')
    expect(html).toContain('30 licenças')
  })
})

describe('helpers', () => {
  it('escapeHtml cobre os cinco caracteres', () => {
    expect(escapeHtml(`<&>"'`)).toBe('&lt;&amp;&gt;&quot;&#39;')
  })

  it('formatarPercent usa vírgula e valor absoluto', () => {
    expect(formatarPercent(-10)).toBe('10%')
    expect(formatarPercent(7.5)).toBe('7,5%')
  })
})

function contar(texto: string, agulha: string): number {
  return texto.split(agulha).length - 1
}

describe('re-download de proposta antiga (snapshot anterior à coluna 36+12)', () => {
  it('não imprime "undefined" quando o snapshot não tem rótulo', () => {
    // Snapshot no formato velho: sem `rotulo`, sem `bonusMeses`, cobertura 36.
    const antigo = doc({}, ['BUSINESS_SECURITY'])
    for (const v of antigo.investimento.planos[0].vigencias) {
      delete (v as Partial<typeof v>).rotulo
      delete (v as Partial<typeof v>).bonusMeses
    }
    antigo.investimento.planos[0].vigencias[2].meses = 36

    const html = renderPropostaHtml(antigo)
    expect(html).not.toContain('undefined')
    expect(html).toContain('36 meses') // cai no rótulo derivado dos meses
  })
})
