import { createHash } from 'crypto'
import { describe, it, expect } from 'vitest'
import {
  renderApresentacaoHtml,
  templateVersaoDoDocumento,
  TEMPLATE_VERSAO,
  type ApresentacaoDocumento,
} from '../templates/institucional-a4'
import { secoesDlpBitdefender } from '../templates/dlp-secoes'
import { fatosParaSetor } from '../mercado-fatos'
import { DLP_FATOS, dlpFatosParaSetor } from '../dlp-fatos'
import {
  AGENTE_PLATAFORMA,
  ENDPOINT_BUNDLE,
  FRASE_ESCOPO,
  GTB_VIGENCIA,
  NOME_ENDPOINT,
  PROIBIDO_GTB,
} from '../gtb-fatos'
import { createApresentacaoSchema } from '@/lib/validations/apresentacao'
import { createPropostaSchema } from '@/lib/validations/proposta'

/** O texto visível: sem a fonte em base64, sem tags, com entidades resolvidas. */
function texto(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
}

const comum: Omit<ApresentacaoDocumento, 'fatos'> = {
  clienteNome: 'Carla Mendes',
  empresaNome: 'Empresa Exemplo Ltda',
  setor: 'Serviços financeiros',
  dataFormatada: '23/10/2026',
  ano: 2026,
  vendedor: { nome: 'Marcos Cruz', email: 'marcos@defenz.com.br' },
  casos: [],
  nivelDestaque: 'PREMIUM',
}

const modoB = renderApresentacaoHtml({
  ...comum,
  tipo: 'dlp',
  fatos: dlpFatosParaSetor(comum.setor),
})
const modoA = renderApresentacaoHtml({
  ...comum,
  setor: 'Indústria',
  fatos: fatosParaSetor('Indústria'),
  complementos: ['DLP_GTB'],
})
const paginasDlpModoA = secoesDlpBitdefender()
  .map((s) => s.corpo('01.'))
  .join('\n')

describe('DLP GTB · invariantes do documento', () => {
  it('I-G1: "Endpoint Protector" nunca aparece sem "GTB" antes', () => {
    for (const html of [modoB, modoA]) {
      const t = texto(html)
      expect(t).toContain(NOME_ENDPOINT)
      expect(t.match(/(?<!GTB )Endpoint Protector/g)).toBeNull()
    }
  })

  it('I-G2: no modo B, valor em moeda só aparece dentro dos fatos com fonte', () => {
    let t = texto(modoB)
    for (const f of DLP_FATOS) t = t.split(f.texto).join(' ').split(f.valor).join(' ')
    expect(t).not.toMatch(/(R|US)\$\s?\d/)
  })

  it('I-G3: nenhuma alegação recusada aparece no conteúdo GTB', () => {
    for (const t of [texto(modoB), texto(paginasDlpModoA)]) {
      for (const { termo } of PROIBIDO_GTB) expect(t).not.toContain(termo)
    }
  })

  it('I-G4: a página do produto separa o bundle do que é da plataforma', () => {
    const t = texto(modoB)
    const marco = 'Na plataforma, o agente também controla'
    const inicio = t.indexOf(`05. ${NOME_ENDPOINT}`)
    const corte = t.indexOf(marco, inicio)
    expect(inicio).toBeGreaterThan(-1)
    expect(corte).toBeGreaterThan(inicio)
    const doBundle = t.slice(inicio, corte)
    for (const [titulo] of ENDPOINT_BUNDLE.recursos) expect(doBundle).toContain(titulo)
    // O que o agente faz na plataforma NÃO pode subir para a lista do bundle.
    for (const [titulo] of AGENTE_PLATAFORMA.controles) expect(doBundle).not.toContain(titulo)
    // Toda página de plataforma carrega a frase de escopo.
    expect(t.split(FRASE_ESCOPO).length - 1).toBeGreaterThanOrEqual(4)
  })

  it('I-G5: sem certificação, o modo B não promete avaliação nem equipe certificada', () => {
    const t = texto(modoB)
    // A alegação, não a palavra: "certificados" digitais aparece legítimo na
    // grade de tipos de dado (2ª crítica).
    expect(t).not.toMatch(/especialistas certificados|equipe é certificada/i)
    expect(t).not.toMatch(/avalia[çc][ãa]o (assistida|sem custo)/i)
    expect(t).not.toMatch(/m[áa]quinas suas|seu pr[óo]prio ambiente|prova de conceito/i)
    expect(t).not.toMatch(/independente/i)
  })

  it('modo B: nenhuma página Bitdefender e numeração contínua', () => {
    const t = texto(modoB)
    expect(t).not.toMatch(/Bitdefender|GravityZone/)
    // 13 páginas: a última numerada é a 12 — o encerramento não tem rodapé.
    expect(t).toContain('Página 12 de 13')
    expect(t).toContain('10. Perguntas frequentes')
  })

  it('modo B: só os fatos do catálogo DLP (o R$ 7,19 mi não entra)', () => {
    expect(texto(modoB)).not.toContain('7,19')
    expect(texto(modoB)).toContain('Resolução nº 4.893/2021')
    // A guarda do template: mandar o catálogo errado é erro, não PDF errado.
    expect(() =>
      renderApresentacaoHtml({ ...comum, tipo: 'dlp', fatos: fatosParaSetor('Saúde') })
    ).toThrow(/fora do catálogo DLP/)
  })

  it('I-G6: a multa aparece como teto da lei, não como manchete', () => {
    const t = texto(modoB)
    expect(t.match(/R\$ ?50 milh/g)?.length).toBe(1)
    expect(t).toContain('limitada a R$ 50 milhões')
    expect(t).not.toMatch(/pode custar/i)
  })

  it('o fato de shadow AI aparece uma vez só', () => {
    expect(texto(modoB).split('US$ 670 mil').length - 1).toBe(1)
  })

  it('modo A: o DLP sai da lista genérica e ganha as duas páginas', () => {
    const t = texto(modoA)
    expect(t).toContain('Antivírus protege a máquina. DLP protege o dado.')
    expect(t).toContain(`07. ${NOME_ENDPOINT}`)
    expect(t).not.toContain('O que mais pode entrar')
  })

  it('modo A sem DLP: nada da GTB no documento', () => {
    const t = texto(
      renderApresentacaoHtml({ ...comum, fatos: fatosParaSetor(), complementos: ['PATCH_MANAGEMENT'] })
    )
    expect(t).not.toContain('GTB')
    expect(t).toContain('O que mais pode entrar')
  })
})

describe('DLP GTB · fatos por setor (D-A2)', () => {
  it('setor financeiro traz a Res. CMN 4.893 primeiro', () => {
    expect(dlpFatosParaSetor('Serviços financeiros')[0].id).toBe('D-CMN-4893')
    expect(dlpFatosParaSetor('Cooperativa de crédito')[0].id).toBe('D-CMN-4893')
  })

  it('seguro e banco de sangue não recebem a regra bancária', () => {
    for (const setor of ['Seguros', 'Banco de sangue', 'Saúde', undefined]) {
      expect(dlpFatosParaSetor(setor).map((f) => f.id)).not.toContain('D-CMN-4893')
    }
  })
})

describe('DLP GTB · versão do texto fixo', () => {
  it('o documento Bitdefender sem DLP mantém a versão de sempre', () => {
    expect(templateVersaoDoDocumento('bitdefender', ['PATCH_MANAGEMENT'])).toBe(TEMPLATE_VERSAO)
    expect(templateVersaoDoDocumento(undefined, undefined)).toBe(TEMPLATE_VERSAO)
  })

  it('com conteúdo GTB, a versão carrega a vigência da GTB', () => {
    const v = `${TEMPLATE_VERSAO}+gtb-${GTB_VIGENCIA}`
    expect(templateVersaoDoDocumento('dlp', [])).toBe(v)
    expect(templateVersaoDoDocumento('bitdefender', ['DLP_GTB'])).toBe(v)
  })

  /**
   * ⚠️ Crítica 🔴4: o conteúdo GTB vem do código no re-download. Se ele mudar sem
   * a vigência subir, um PDF já enviado sai diferente SEM o aviso de divergência.
   * Mudou o texto de propósito? Suba `GTB_VIGENCIA` e registre o hash novo aqui.
   */
  it('mudar o conteúdo GTB obriga a subir GTB_VIGENCIA', () => {
    const HASH_POR_VIGENCIA: Record<string, string> = {
      '2026-10': 'e8f45586b917141d',
    }
    const hash = createHash('sha256')
      .update(texto(modoB))
      .update(texto(paginasDlpModoA))
      .digest('hex')
      .slice(0, 16)
    expect(hash).toBe(HASH_POR_VIGENCIA[GTB_VIGENCIA])
  })
})

describe('DLP GTB · formulários', () => {
  it('a apresentação só-DLP recusa casos pesquisados', () => {
    const caso = {
      oQueAconteceu: 'x',
      necessidade: 'y',
      funcionalidade: 'EDR',
      veiculo: 'z',
      ano: 2025,
      fonteIdx: [0],
    }
    const base = { clienteNome: 'A', empresaNome: 'B', pesquisaId: 'ckabcdefghijklmnopqrstuvw' }
    expect(createApresentacaoSchema.safeParse({ ...base, tipo: 'dlp', casos: [caso] }).success).toBe(false)
    expect(createApresentacaoSchema.safeParse({ ...base, tipo: 'dlp' }).success).toBe(true)
  })

  it('proposta com DLP: mínimo de 25 na quantidade EFETIVA', () => {
    const base = {
      clienteNome: 'Maria',
      empresaNome: 'Acme',
      quantidade: 100,
      planos: ['BUSINESS_SECURITY'],
      basePreco: 'tabela',
      complementos: ['DLP_GTB'],
    }
    expect(createPropostaSchema.safeParse(base).success).toBe(true)
    expect(
      createPropostaSchema.safeParse({ ...base, quantidadesComplemento: { DLP_GTB: 25 } }).success
    ).toBe(true)
    const r = createPropostaSchema.safeParse({ ...base, quantidadesComplemento: { DLP_GTB: 24 } })
    expect(r.success).toBe(false)
    expect(JSON.stringify(r.error?.issues)).toMatch(/a partir de 25 licenças/)
    // Sem quantidade própria, herda a do principal — e o principal com 10 não passa.
    expect(createPropostaSchema.safeParse({ ...base, quantidade: 10 }).success).toBe(false)
  })
})
