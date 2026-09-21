import { describe, it, expect } from 'vitest'
import {
  renderPropostaHtml,
  totalPaginas,
  secoesNoHtml,
  SECOES,
  escapeHtml,
  formatarPercent,
  type PropostaDocumento,
} from '../templates/endpoints-a4'
import { calcularInvestimento, formatarBRL } from '../calculo'
import { calcularComplementos, consolidar, servicosSobConsulta } from '../calculo-complementos'
import type { PlanoId } from '../tabela-precos'
import {
  UNICODE_RANGES_EMBUTIDAS,
  caracteresForaDaFonte,
  textoRenderizado,
} from '@/lib/pdf/fonte-embutida'

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
    // As seções seguintes foram renumeradas. ⚠️ Esta asserção dizia `not >06.<` e
    // PASSAVA — porque eu tinha renumerado só as fixas e esquecido o Investimento,
    // que ficou em 07. O teste espelhava o mesmo engano do código, e por isso não
    // pegou nada. Hoje 06 é o Investimento e o que não pode existir é 07.
    expect(html).toContain('Parceria estratégica')
    expect(html).toMatch(/>06\.</) // Investimento
    expect(html).not.toMatch(/>07\.</)
    // Plataformas: o documento não promete mais mobile.
    expect(html).not.toMatch(/\biOS\b/)
    expect(html).not.toContain('Android')
    expect(html).toContain('Windows, Linux e Mac')
  })

  // ⚠️ Este bloco existe por um bug que foi para PRODUÇÃO em 21/08 e quem viu foi o
  // Marcos: ao remover a página de clientes, as seções fixas foram renumeradas mas o
  // Investimento — que mora em outra função — ficou em '07.'. O documento pulava de
  // `05.` para `07.` na cara do cliente. Contar não basta; a sequência tem de ser
  // conferida como sequência.
  describe('numeração, conferida como sequência e não item a item', () => {
    it('as seções são contíguas de 01 até a última, com qualquer nº de planos', () => {
      for (const planos of [
        ['BUSINESS_SECURITY'],
        ['BUSINESS_SECURITY', 'PREMIUM'],
        ['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE'],
      ] as PlanoId[][]) {
        const secoes = secoesNoHtml(renderPropostaHtml(doc({}, planos)))
        expect(secoes).toEqual(['01.', '02.', '03.', '04.', '05.', '06.'])
        expect(secoes.at(-1)).toBe(SECOES.INVESTIMENTO) // a última é Investimento
      }
    })

    it('os rodapés são contíguos de 02 até total-1, e o total bate', () => {
      for (const qtd of [1, 2, 3]) {
        const planos = (['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE'] as PlanoId[]).slice(0, qtd)
        const html = renderPropostaHtml(doc({}, planos))
        const total = totalPaginas(qtd)
        const rodapes = [...html.matchAll(/Página (\d{2}) de (\d{2})/g)]

        // todos declaram o MESMO total, e é o total real
        expect(new Set(rodapes.map((m) => Number(m[2])))).toEqual(new Set([total]))
        // capa (01) e encerramento (último) não numeram; o miolo é contíguo
        const paginas = rodapes.map((m) => Number(m[1]))
        const esperado = Array.from({ length: total - 2 }, (_, i) => i + 2)
        expect(paginas).toEqual(esperado)
      }
    })
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

  // feature-proposta-acrescimo-oculto: o acréscimo existe só na tela de revisão.
  // O cliente vê o preço final como preço — sem a palavra, sem o percentual e
  // sem o valor de tabela ao lado, que deixaria a diferença fácil de calcular (K1).
  it('acréscimo: o documento não menciona o acréscimo nem mostra o preço de tabela', () => {
    const html = renderPropostaHtml(doc({}, ['PREMIUM'], 7.5))
    expect(html.toLowerCase()).not.toContain('acréscimo')
    expect(html).not.toContain('7,5%')
    expect(html).not.toContain('Desconto competitivo')
    expect(html).not.toContain('tabela vigente')
    // Premium 25-49 de tabela: 80,93 · 129,48 · 202,32 — e os totais × 30.
    for (const tabela of ['R$ 80,93', 'R$ 129,48', 'R$ 202,32', 'R$ 2.427,90', 'R$ 3.884,40', 'R$ 6.069,60']) {
      expect(html).not.toContain(tabela)
    }
    // O preço final aparece: 80,93 × 1,075 = 87,00 · × 30 = 2.609,99
    expect(html).toContain('R$ 87,00')
    expect(html).toContain('R$ 2.609,99')
  })

  it('acréscimo com complementos: o resumo e os complementos também não contam', () => {
    const base = doc({}, ['PREMIUM'], 7.5)
    const comps = calcularComplementos(['PATCH_MANAGEMENT'], 30)
    const html = renderPropostaHtml({
      ...base,
      complementos: comps,
      consolidado: consolidar(base.investimento, 0, comps),
    })
    expect(html.toLowerCase()).not.toContain('acréscimo')
    expect(html).not.toContain('7,5%')
    expect(html).not.toContain('não incide sobre os complementos')
    expect(html).not.toContain('tabela vigente')
  })

  // I-Q1 (feature-quantidade-acima-da-tabela): acima de 999 o preço continua
  // sendo o da faixa topo, mas o documento PARA de alegar cobertura da tabela.
  // "1400 licenças · faixa 500-999 da tabela vigente" é o papel se desmentindo
  // na mesma linha — e este vai para um Ministério Público.
  it('acima de 999 licenças não cita faixa nenhuma, mas mantém o preço da faixa topo', () => {
    const base = doc({}, ['PREMIUM'], -15)
    const html = renderPropostaHtml({
      ...base,
      investimento: calcularInvestimento({
        quantidade: 1400,
        planos: ['PREMIUM'],
        ajustePercent: -15,
      }),
    })
    expect(html).toContain('1400 licenças')
    expect(html).not.toContain('faixa 500-999')
    expect(html).not.toContain('faixa 500-999 da tabela vigente')
    // o preço impresso segue sendo o da faixa topo, com o desconto por cima
    expect(html).toContain(formatarBRL(120.28 * 0.85))
  })

  it('dentro da tabela a faixa continua sendo citada', () => {
    const html = renderPropostaHtml(doc({}, ['PREMIUM'], -15))
    expect(html).toContain('faixa 25-49 da tabela vigente')
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

describe('a proposta não depende de fonte do sistema', () => {
  // ⚠️ Mesma classe de bug que apagou o tique da apresentação em 23/08, aqui no
  // documento que leva PREÇO IMPRESSO. Caractere fora da `unicode-range` some do
  // PDF no Lambda sem erro nenhum — e funciona no Mac, o que faz o defeito
  // parecer lógica em vez de tipografia.
  it('todo caractere renderizado é desenhável pela fonte embutida', () => {
    for (const planos of [
      ['BUSINESS_SECURITY'],
      ['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE'],
    ] as PlanoId[][]) {
      const forasteiros = caracteresForaDaFonte(renderPropostaHtml(doc({}, planos, 12)))
      expect(
        forasteiros,
        `Caractere fora da fonte embutida. No Lambda ele SOME do PDF, sem erro. ` +
          `Se for ícone, desenhe em SVG: ${forasteiros.join(', ')}`
      ).toEqual([])
    }
  })

  it('a guarda enxerga o texto e reprova o caractere que causou o bug', () => {
    // Sem isto o teste acima poderia passar por não varrer nada.
    expect(textoRenderizado(renderPropostaHtml(doc()))).toContain('Acme Indústria')
    expect(caracteresForaDaFonte('<p>&#10003;</p>')).toEqual(['"✓" (U+2713)'])
    expect(caracteresForaDaFonte('<p>preço — R$ 1.234</p>')).toEqual([])
  })

  it('o @font-face publica exatamente as faixas da guarda', () => {
    const html = renderPropostaHtml(doc())
    for (const faixa of UNICODE_RANGES_EMBUTIDAS) {
      expect(html).toContain(`unicode-range: ${faixa};`)
    }
  })
})

describe('complementos no documento', () => {
  const comps = calcularComplementos(['PATCH_MANAGEMENT', 'CRIPTOGRAFIA_DISCO', 'PHASR'], 30)
  const base = doc({}, ['PREMIUM'])
  const comComplementos = {
    ...base,
    complementos: comps,
    consolidado: consolidar(base.investimento, 0, comps),
  }

  it('proposta SEM complemento continua idêntica à de antes', () => {
    expect(totalPaginas(1)).toBe(9)
    expect(renderPropostaHtml(doc({}, ['PREMIUM']))).not.toContain('Resumo do investimento')
  })

  it('as páginas passam a contar complementos e resumo, e a numeração fecha', () => {
    // 3 complementos = 2 páginas (2 por página) + 1 de resumo.
    expect(totalPaginas(1, 3)).toBe(12)
    const html = renderPropostaHtml(comComplementos)
    const rs = [...html.matchAll(/Página (\d{2}) de (\d{2})/g)]
    const total = Number(rs[0][2])
    expect(total).toBe(12)
    expect(new Set(rs.map((r) => Number(r[2])))).toEqual(new Set([total]))
    expect(rs.map((r) => Number(r[1]))).toEqual(
      Array.from({ length: total - 2 }, (_, i) => i + 2)
    )
  })

  it('as seções seguem contíguas: investimento, complementos, resumo', () => {
    expect(secoesNoHtml(renderPropostaHtml(comComplementos))).toEqual([
      '01.', '02.', '03.', '04.', '05.', '06.', '07.', '08.',
    ])
  })

  it('imprime o valor de cada complemento e a fonte da descrição', () => {
    const html = renderPropostaHtml(comComplementos)
    expect(html).toContain('Patch Management')
    expect(html).toContain('R$ 29,95') // 59,90 com os 50%
    expect(html).toContain('R$ 126,00') // PHASR, já líquido
    expect(html).toMatch(/Bitdefender · página oficial/)
  })

  // ⚠️ O ponto mais perigoso da feature: somar 36+12 (48 meses de cobertura) com
  // complemento de 36 sem dizer nada seria prometer cobertura que o preço não dá.
  it('a página de resumo DIZ que as coberturas divergem, e mostra as duas', () => {
    const html = renderPropostaHtml(comComplementos)
    expect(html).toContain('Resumo do investimento')
    expect(html).toContain('Investimento total')
    expect(html).toContain('Cobertura dos complementos')
    expect(html).toContain('cobrem 36 meses')
    expect(html).toContain('48')
  })

  it('o total consolidado é a soma do principal com os complementos', () => {
    const c = comComplementos.consolidado
    for (const l of c.linhas) {
      expect(l.total).toBeCloseTo(l.totalPrincipal + l.totalComplementos, 6)
    }
  })

  // A trava de fonte do documento com preço vale para o conteúdo NOVO também.
  it('nenhum caractere dos complementos está fora da fonte embutida', () => {
    expect(caracteresForaDaFonte(renderPropostaHtml(comComplementos))).toEqual([])
  })
})

describe('C2 — o desconto da proposta não vale para o complemento, e o documento diz', () => {
  const comps = calcularComplementos(['PATCH_MANAGEMENT'], 30)

  it('avisa quando há ajuste comercial no principal', () => {
    const base = doc({}, ['PREMIUM'], -10)
    const html = renderPropostaHtml({
      ...base,
      complementos: comps,
      consolidado: consolidar(base.investimento, 0, comps),
    })
    expect(html).toContain('não incide sobre os complementos')
  })

  it('não polui a página quando o preço é de tabela cheia', () => {
    const base = doc({}, ['PREMIUM'])
    const html = renderPropostaHtml({
      ...base,
      complementos: comps,
      consolidado: consolidar(base.investimento, 0, comps),
    })
    expect(html).not.toContain('não incide sobre os complementos')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// feature-catalogo-opcoes — DLP, MDR e desconto por item, no documento
// ─────────────────────────────────────────────────────────────────────────────

describe('DLP e MDR no documento', () => {
  const base = doc({}, ['PREMIUM'], 0)
  const inv = base.investimento

  function comDlp(ids: Parameters<typeof calcularComplementos>[0]) {
    const comps = calcularComplementos(ids, 30)
    const servicos = servicosSobConsulta(ids)
    return renderPropostaHtml({
      ...base,
      complementos: comps,
      servicos,
      consolidado: comps.length > 0 ? consolidar(inv, 0, comps) : undefined,
    })
  }

  it('DLP imprime a cotação e a data ao lado do preço convertido (I-N3)', () => {
    const html = comDlp(['DLP_GTB'])
    expect(html).toContain('R$ 247,30')
    expect(html).toContain('US$ 48,00')
    expect(html).toContain('R$ 5,1521')
    expect(html).toContain('17/09/2026')
  })

  it('DLP sai com UMA coluna, não três iguais (crítica C3)', () => {
    const html = comDlp(['DLP_GTB'])
    // O bloco do DLP tem uma coluna de valor; a grade dele nasce com 2 colunas.
    expect(html).toContain('grid-template-columns:1.9fr 1fr;')
    expect(html).toContain('renovação anual')
  })

  // O bloco próprio veio de um defeito visual (18/09): dentro da grade, o nome e
  // o prazo quebravam como "GTB Endpoint Protector (DLP) · 12" / "meses, fora do
  // total". Agora o prazo é dito uma vez no título do bloco.
  it('DLP aparece no resumo em bloco próprio, fora do total (D5)', () => {
    const html = comDlp(['PATCH_MANAGEMENT', 'DLP_GTB'])
    expect(html).toContain('Contratados por 12 meses, com renovação anual · fora do total acima')
    expect(html).toContain('R$ 7.419,00') // DLP: 247,30 × 30 licenças
    // O nome não carrega mais o prazo colado, que era o que quebrava a linha.
    expect(html).not.toContain('(DLP) <span')
    expect(html).not.toContain('meses, fora do total</span>')
  })

  it('item de preço líquido não inventa linha de desconto (D6)', () => {
    const comps = calcularComplementos(['PHASR'], 30, { PHASR: 20 })
    const html = renderPropostaHtml({
      ...base,
      complementos: comps,
      consolidado: consolidar(inv, 0, comps),
    })
    expect(html).not.toContain('Desconto competitivo')
    expect(html).toContain('R$ 100,80') // 126 − 20%
    expect(html).not.toContain('R$ 126,00')
  })

  it('MDR sai em página própria, sem preço e fora da soma (I-N2)', () => {
    const html = comDlp(['MDR_GERENCIADO'])
    expect(html).toContain('Serviços gerenciados')
    expect(html).toContain('Investimento sob consulta')
    expect(html).toContain('Não está incluído')
    expect(html).not.toContain('Resumo do investimento')
  })

  it('o texto do MDR no PDF não promete o que não funciona (I-N6)', () => {
    const texto = comDlp(['MDR_GERENCIADO']).toLowerCase()
    expect(texto).not.toContain('tempo real')
    expect(texto).not.toContain('isolamento automático')
    expect(texto).toContain('das 9h às 18h')
  })

  it('com serviço no meio, a numeração das seções continua contígua (achado 18)', () => {
    const html = comDlp(['PATCH_MANAGEMENT', 'MDR_GERENCIADO'])
    expect(secoesNoHtml(html)).toEqual([
      '01.', '02.', '03.', '04.', '05.', '06.', '07.', '08.', '09.',
    ])
    // 8 fixas + 1 plano + 1 de complemento + 1 de serviço + 1 de resumo = 12.
    // O encerramento não numera, então o último rodapé é o 11.
    expect(html).toContain('Página 11 de 12')
    expect(contar(html, '<section class="page">')).toBe(12)
    expect(html).not.toContain('de 11</div>')
  })

  it('snapshot ANTIGO, sem `coberturas`, ainda imprime a cobertura (achado 1)', () => {
    const comps = calcularComplementos(['PATCH_MANAGEMENT'], 30)
    const consolidado = consolidar(inv, 0, comps)
    // Como ficou gravado antes de 17/09: número, sem o array.
    const antigo = {
      ...consolidado,
      foraDoTotal: undefined,
      linhas: consolidado.linhas.map(({ coberturas: _, ...l }) => l),
    } as unknown as ReturnType<typeof consolidar>
    const html = renderPropostaHtml({ ...base, complementos: comps, consolidado: antigo })
    expect(html).toContain('36 meses')
    expect(html).not.toContain('undefined')
  })
})
