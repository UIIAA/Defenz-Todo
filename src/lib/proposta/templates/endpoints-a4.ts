// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE A4 · Proposta de Licenciamento Bitdefender GravityZone
// feature-portal-proposta.md §7
//
// Derivado de `Defenz Proposta A4.dc.html` (molde nomeado pelo brandbook) e
// conferido contra as duas propostas reais de cliente (João Buffo e Liquos).
// As páginas institucionais são transcrição: o diff textual entre os dois
// clientes não achou diferença nenhuma nelas (spec §2.2).
//
// O A4 entregue ao cliente NUNCA foi o PPTX exportado — os metadados do PDF
// real dizem `Skia/PDF` + `Mozilla/5.0`, ou seja, HTML impresso pelo Chrome
// (spec §2.3). Este arquivo é esse HTML, agora gerado por código.
//
// ⚠️ NADA aqui pode buscar recurso na rede. Fonte e logo vêm de `assets/embedded.ts`
// como data URI. Fonte que não carrega = PDF quebrado em silêncio (risco R2).
// ─────────────────────────────────────────────────────────────────────────────

import { UNICODE_RANGES_EMBUTIDAS } from '@/lib/pdf/fonte-embutida'

import {
  LOGO_HORIZONTAL_INK_PNG,
  MANROPE_LATIN_EXT_WOFF2,
  MANROPE_LATIN_WOFF2,
} from '../assets/embedded'
import { formatarBRL, type BlocoPlano, type Investimento } from '../calculo'
import type { BlocoComplemento, Consolidado } from '../calculo-complementos'

// Paleta do brandbook. ~70% papel, ~22% tinta, ~8% crimson.
const C = {
  accent: '#C1121F',
  ink: '#16191D',
  paper: '#F6F3EE',
  surface: '#FBF9F4',
  body: '#3C3A34',
  muted: '#6B6459',
  faint: '#A39C8D',
  line: '#E3DED4',
} as const

/** Telefone institucional. Os dois documentos reais usam esta linha, não a do vendedor. */
export const TELEFONE_DEFENZ = '(11) 3040-2960'

export interface VendedorDoc {
  nome: string
  email: string
  telefone?: string
}

export interface PropostaDocumento {
  /** DFZ-2026-01986 */
  codigo: string
  clienteNome: string
  empresaNome: string
  /** Já formatada em dd/mm/aaaa no fuso de São Paulo. */
  dataFormatada: string
  /** Ano para o rodapé de copyright. */
  ano: number
  vendedor: VendedorDoc
  investimento: Investimento
  /** Complementos escolhidos. Vazio = proposta idêntica à de antes desta feature. */
  complementos?: BlocoComplemento[]
  /** A soma de tudo. Só existe quando há complemento. */
  consolidado?: Consolidado
}

/** Escapa tudo que vem do formulário. Nome de cliente com `<` não pode virar markup. */
export function escapeHtml(valor: string): string {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Total de páginas do documento.
 *
 * 8 páginas fixas (capa, confidencialidade, conheça-nos, porque nós, serviços,
 * parceria, governança, encerramento) + UMA de investimento por plano.
 * NUNCA é constante — muda com quantos planos o vendedor marcou.
 *
 * ⚠️ Era 9 até 21/08, quando a página "Alguns dos nossos clientes" foi REMOVIDA por
 * decisão do Marcos. Os dois documentos de referência (Buffo e Liquos) ainda a têm;
 * o documento emitido daqui em diante, não.
 */
export const PAGINAS_FIXAS = 8
/** Páginas que vêm ANTES do investimento: capa, confidencialidade, 01…05. */
export const PAGINAS_ANTES_DO_INVESTIMENTO = 7
/** Cabem 2 complementos por página sem espremer descrição. */
export const COMPLEMENTOS_POR_PAGINA = 2

export function paginasDeComplementos(qtdComplementos: number): number {
  return Math.ceil(qtdComplementos / COMPLEMENTOS_POR_PAGINA)
}

/**
 * ⚠️ A assinatura antiga (só `qtdPlanos`) continua valendo: proposta sem
 * complemento tem exatamente as mesmas páginas de antes.
 */
export function totalPaginas(qtdPlanos: number, qtdComplementos = 0): number {
  const extras = qtdComplementos > 0 ? paginasDeComplementos(qtdComplementos) + 1 : 0
  return PAGINAS_FIXAS + qtdPlanos + extras
}

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Percentual pt-BR sem casa decimal inútil: 5 → "5%", 12.5 → "12,5%". */
export function formatarPercent(valor: number): string {
  const abs = Math.abs(valor)
  const s = Number.isInteger(abs) ? String(abs) : String(abs).replace('.', ',')
  return `${s}%`
}

// ─── pedaços reutilizáveis ───────────────────────────────────────────────────

/**
 * Logo como classe CSS, não como `<img src="data:…">` repetido.
 *
 * O logo aparece ~20 vezes no documento. Inline, o data URI de 28 KB era
 * copiado em cada ocorrência: 716 KB de HTML e um PDF de 705 KB para mandar por
 * e-mail. Declarado uma vez em CSS, o recurso é único.
 */
// Proporção do PNG embutido (480×131). O arquivo é propositalmente pequeno: o
// logo é redesenhado a cada página e o Skia embute o bitmap em cada uma delas,
// então um PNG de 2000px viraria centenas de KB no PDF que vai por e-mail.
const LOGO_RATIO = 480 / 131

function logo(alturaPx: number): string {
  const largura = Math.round(alturaPx * LOGO_RATIO)
  return `<span class="dz-logo" style="height:${alturaPx}px; width:${largura}px;"></span>`
}

function cabecalhoCorrido(empresaNome: string): string {
  return `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="font-size:11px; color:${C.faint}; font-weight:600; line-height:1.8;"><div style="text-transform:uppercase; letter-spacing:0.04em;">${escapeHtml(empresaNome)} · Licenciamento Bitdefender GravityZone</div></div>
        ${logo(20)}
      </div>`
}

function rodape(pagina: number, total: number, ano: number, margemTopo = 'auto'): string {
  return `
      <div style="margin-top:${margemTopo}; padding-top:20px; display:flex; justify-content:space-between; align-items:flex-end;">
        ${logo(22)}
        <div style="text-align:right; font-size:11px; color:${C.faint}; font-weight:600; line-height:1.7;"><div>Página ${pad2(pagina)} de ${pad2(total)}</div><div>© Defenz Cybersecurity ${ano} · Confidencial</div></div>
      </div>`
}

/**
 * Numeração das seções, em UM lugar só.
 *
 * ⚠️ Existe porque em 21/08 a página de clientes saiu, as seções fixas foram
 * renumeradas à mão e o **Investimento ficou para trás em '07.'** — ele mora em
 * outra função, fora do bloco que foi renumerado. O documento passou a pular de
 * `05.` para `07.` na cara do cliente, e quem viu foi o Marcos, não o teste.
 *
 * Agora o número vem daqui e `secoesContiguas()` exige a sequência sem buraco.
 */
/**
 * Versão do texto FIXO do documento (o que não vem do formulário).
 *
 * ⚠️ Existe porque o re-download reimprime a partir do `precoSnapshot`, mas o
 * texto institucional vem do CÓDIGO — então mudar o template muda, em silêncio,
 * o que sai ao rebaixar uma proposta antiga. Em 21/08 isso deixou de ser
 * teórico: a página de clientes saiu e o documento passou de 12 para 11
 * páginas, enquanto 6 propostas já emitidas tinham a página.
 *
 * Não tenta reimprimir versões antigas (isso exigiria guardar os templates
 * todos). Faz o que resolve o problema real: o registro sabe com qual versão
 * nasceu, e o re-download AVISA quando diverge, em vez de entregar outro
 * documento calado.
 *
 * Subir quando o texto fixo mudar: páginas, seções, numeração, promessas.
 */
export const TEMPLATE_VERSAO = '2026-08-21'

export const SECOES = {
  CONHECA_NOS: '01.',
  PORQUE_NOS: '02.',
  SERVICOS: '03.',
  PARCERIA: '04.',
  GOVERNANCA: '05.',
  INVESTIMENTO: '06.',
  COMPLEMENTOS: '07.',
  RESUMO: '08.',
} as const

/**
 * Os números de seção que aparecem no HTML, na ordem, sem repetição consecutiva.
 * (Investimento repete o mesmo número em cada página de plano — é a mesma seção.)
 */
export function secoesNoHtml(html: string): string[] {
  const achados = [...html.matchAll(/>(\d{2}\.)<\/span>/g)].map((m) => m[1])
  return achados.filter((n, i) => n !== achados[i - 1])
}

function tituloSecao(numero: string, texto: string, sufixo = ''): string {
  return `
        <div style="width:56px; height:4px; background:${C.accent}; margin-bottom:22px;"></div>
        <h2 style="font-size:40px; font-weight:800; letter-spacing:-0.02em; margin:0 0 22px;"><span style="color:${C.accent};">${numero}</span>&nbsp;&nbsp;${texto}${sufixo}</h2>`
}

function pagina(conteudo: string): string {
  return `
  <section class="page">
    <div style="height:100%; padding:56px 66px 44px; display:flex; flex-direction:column;">${conteudo}
    </div>
  </section>`
}

// ─── página de investimento (a única que calcula) ────────────────────────────

function linhaGrid(
  rotulo: string,
  valores: string[],
  opts: { destaqueUltimo?: boolean; corRotulo?: string; corValor?: string; peso?: string } = {}
): string {
  const { destaqueUltimo = true, corRotulo = C.muted, corValor = '', peso = '' } = opts
  const celulas = valores
    .map((v, i) => {
      const ultimo = i === valores.length - 1
      const cor = ultimo && destaqueUltimo ? `color:${C.accent}; font-weight:700;` : corValor
      return `<div style="padding:8px 6px; text-align:center; border-top:1px solid ${C.line}; ${cor}${peso}">${v}</div>`
    })
    .join('\n            ')
  return `<div style="padding:8px 6px; color:${corRotulo}; font-weight:600; border-top:1px solid ${C.line};">${rotulo}</div>
            ${celulas}`
}

function tabelaPlano(bloco: BlocoPlano, inv: Investimento): string {
  const vs = bloco.vigencias
  const rotuloFinal =
    inv.ajustePercent < 0 ? 'Unitário com desconto' : 'Unitário com acréscimo'

  // As duas linhas de ajuste só existem quando há ajuste. Com preço de tabela,
  // um rótulo fixo "Desconto competitivo · 0%" mentiria para o cliente.
  const linhasAjuste = inv.temAjuste
    ? `
            ${linhaGrid(
              inv.rotuloAjuste!,
              vs.map(() => formatarPercent(inv.ajustePercent)),
              { destaqueUltimo: false, corValor: `color:${C.accent}; font-weight:700;` }
            )}

            ${linhaGrid(
              rotuloFinal,
              vs.map((v) => formatarBRL(v.precoLicencaFinal)),
              { corRotulo: C.ink, peso: ' font-weight:800;' }
            )}
`
    : ''

  const totais = vs
    .map((v, i) => {
      const ultimo = i === vs.length - 1
      const fundo = ultimo ? C.accent : C.ink
      const raio = ultimo ? 'border-radius:0 8px 8px 0;' : ''
      return `<div style="padding:12px 4px; text-align:center; background:${fundo}; color:${ultimo ? '#fff' : '#F5F2EC'}; font-weight:${ultimo ? 800 : 700}; margin-top:8px; ${raio}">${formatarBRL(v.valorTotalFinal)}</div>`
    })
    .join('\n            ')

  return `
        <div style="margin-bottom:22px;">
          <div style="display:flex; align-items:baseline; gap:10px; margin-bottom:12px;">
            <span style="font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:${C.accent}; font-weight:800;">Bitdefender GravityZone</span>
            <span style="font-size:19px; font-weight:800; letter-spacing:-0.02em;">${escapeHtml(bloco.label)}</span>
          </div>
          <div style="display:grid; grid-template-columns:1.9fr 1fr 1fr 1fr; font-size:13px;">
            <div style="padding:8px 6px; color:${C.faint}; font-weight:700; font-size:11.5px;">${inv.quantidade} licenças</div>
            ${vs
              .map(
                (v, i) =>
                  // `?? meses` protege o re-download de uma proposta emitida
                  // ANTES da coluna 36+12 existir: snapshot velho não tem
                  // `rotulo`, e sem isto o PDF sairia com "undefined".
                  `<div style="padding:8px 6px; text-align:center; font-weight:800;${i === vs.length - 1 ? ` color:${C.accent};` : ''}">${escapeHtml(v.rotulo ?? `${v.meses} meses`)}</div>`
              )
              .join('\n            ')}

            ${linhaGrid(
              'Valor unitário / mês',
              vs.map((v) => formatarBRL(v.valorUnitarioMesFinal))
            )}

            ${linhaGrid(
              'Valor unitário',
              vs.map((v) => formatarBRL(v.precoLicenca))
            )}

            ${linhaGrid(
              'Valor total',
              vs.map((v) => formatarBRL(v.valorTotal)),
              { destaqueUltimo: false, corValor: `color:${C.muted};` }
            )}
${linhasAjuste}
            <div style="padding:12px 14px; color:#fff; font-weight:800; background:${C.ink}; border-radius:8px 0 0 8px; margin-top:8px;">Total final</div>
            ${totais}
          </div>
        </div>`
}

/**
 * Explica o bônus para o cliente, em vez de deixar "36+12" solto no cabeçalho.
 *
 * Sai dos dados, não de texto fixo: se um dia a coluna deixar de ter bônus, a
 * frase some sozinha em vez de virar promessa que o preço não sustenta.
 */
function notaBonus(bloco: BlocoPlano): string {
  const comBonus = bloco.vigencias.find((v) => v.bonusMeses > 0)
  if (!comBonus) return ''
  const pagos = comBonus.meses - comBonus.bonusMeses
  return `<strong>${escapeHtml(comBonus.rotulo)}</strong>: contrate ${pagos} meses e receba mais ${comBonus.bonusMeses} de proteção, ${comBonus.meses} meses no total pelo preço de ${pagos}. &middot; `
}

function paginaInvestimento(
  bloco: BlocoPlano,
  indice: number,
  doc: PropostaDocumento,
  numeroPagina: number,
  total: number
): string {
  const inv = doc.investimento
  const continuacao = indice > 0
  const nota = inv.temAjuste
    ? `Os valores já contemplam o ${(inv.rotuloAjuste ?? '').toLowerCase()} de ${formatarPercent(inv.ajustePercent)} aplicado a cada vigência.`
    : 'Valores conforme tabela vigente, por vigência contratada.'

  return pagina(`${cabecalhoCorrido(doc.empresaNome)}
      <div style="margin-top:66px;">${tituloSecao(
        SECOES.INVESTIMENTO,
        'Investimento',
        continuacao
          ? ` &nbsp;<span style="font-size:22px; color:${C.faint}; font-weight:700;">continuação</span>`
          : ''
      )}
        <p style="font-size:16px; line-height:1.8; color:${C.body}; margin:0; max-width:600px; text-align:justify;">Dimensionamento para <strong>${inv.quantidade} licenças</strong> na linha <strong>${escapeHtml(bloco.label)}</strong> do Bitdefender GravityZone. ${nota}</p>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">${tabelaPlano(bloco, inv)}
      </div>

      <div style="font-size:12.5px; color:${C.faint}; font-weight:600; text-align:center;">${notaBonus(bloco)}Valores em reais. Dimensionamento para ${inv.quantidade} licenças · faixa ${inv.faixa} da tabela vigente.</div>
${rodape(numeroPagina, total, doc.ano, '24px')}`)
}


// ─── complementos ────────────────────────────────────────────────────────────

/**
 * Um complemento: a tabela dele e a descrição do que ele faz.
 *
 * A descrição vem do catálogo (`complementos.ts`), resumida do material oficial
 * da Bitdefender e com a fonte impressa ao lado. Não é texto gerado.
 */
function tabelaComplemento(c: BlocoComplemento, quantidade: number): string {
  const vs = c.vigencias

  const linhasDesconto = c.temDesconto
    ? `
            ${linhaGrid(
              'Desconto competitivo',
              vs.map(() => formatarPercent(c.descontoPercent)),
              { destaqueUltimo: false, corValor: `color:${C.accent}; font-weight:700;` }
            )}

            ${linhaGrid(
              'Unitário com desconto',
              vs.map((v) => formatarBRL(v.precoLicencaFinal)),
              { corRotulo: C.ink, peso: ' font-weight:800;' }
            )}
`
    : ''

  const totais = vs
    .map((v, i) => {
      const ultimo = i === vs.length - 1
      const fundo = ultimo ? C.accent : C.ink
      const raio = ultimo ? 'border-radius:0 8px 8px 0;' : ''
      return `<div style="padding:10px 4px; text-align:center; background:${fundo}; color:${ultimo ? '#fff' : '#F5F2EC'}; font-weight:${ultimo ? 800 : 700}; margin-top:8px; ${raio}">${formatarBRL(v.valorTotalFinal)}</div>`
    })
    .join('\n            ')

  return `
        <div style="margin-bottom:26px;">
          <div style="font-size:17px; font-weight:800; letter-spacing:-0.02em; margin-bottom:8px;">${escapeHtml(c.nome)}</div>
          <p style="font-size:12.5px; line-height:1.7; color:${C.body}; margin:0 0 12px; text-align:justify;">${escapeHtml(c.descricao)}</p>
          <div style="display:grid; grid-template-columns:1.9fr 1fr 1fr 1fr; font-size:12.5px;">
            <div style="padding:8px 6px; color:${C.faint}; font-weight:700; font-size:11.5px;">${quantidade} licenças</div>
            ${vs
              .map(
                (v, i) =>
                  `<div style="padding:8px 6px; text-align:center; font-weight:800;${i === vs.length - 1 ? ` color:${C.accent};` : ''}">${escapeHtml(v.rotulo)}</div>`
              )
              .join('\n            ')}

            ${linhaGrid(
              'Valor unitário / mês',
              vs.map((v) => formatarBRL(v.valorUnitarioMesFinal))
            )}

            ${linhaGrid(
              'Valor unitário',
              vs.map((v) => formatarBRL(v.precoLicenca)),
              { destaqueUltimo: !c.temDesconto }
            )}
${linhasDesconto}
            <div style="padding:10px 14px; color:#fff; font-weight:800; background:${C.ink}; border-radius:8px 0 0 8px; margin-top:8px;">Total</div>
            ${totais}
          </div>
          <div style="margin-top:8px; font-size:10px; color:${C.faint}; font-weight:600;">${escapeHtml(c.fonte)}</div>
        </div>`
}

function paginaComplementos(
  grupo: BlocoComplemento[],
  indice: number,
  doc: PropostaDocumento,
  numeroPagina: number,
  total: number
): string {
  const quantidade = doc.investimento.quantidade
  const continuacao = indice > 0

  return pagina(`${cabecalhoCorrido(doc.empresaNome)}
      <div style="margin-top:56px;">${tituloSecao(
        SECOES.COMPLEMENTOS,
        'Complementos',
        continuacao
          ? ` &nbsp;<span style="font-size:22px; color:${C.faint}; font-weight:700;">continuação</span>`
          : ''
      )}
        ${
          continuacao
            ? ''
            : `<p style="font-size:15px; line-height:1.8; color:${C.body}; margin:0 0 8px; max-width:600px; text-align:justify;">Módulos que somam ao GravityZone contratado. Cada um é cobrado à parte, pelas mesmas ${quantidade} licenças, e pode entrar ou sair sem alterar o restante da proposta.</p>`
        }
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">${grupo
        .map((c) => tabelaComplemento(c, quantidade))
        .join('\n')}
      </div>

      <div style="font-size:12px; color:${C.faint}; font-weight:600; text-align:center;">Valores em reais, por licença, pelo período contratado &middot; ${quantidade} licenças.</div>
${rodape(numeroPagina, total, doc.ano, '18px')}`)
}

/**
 * A última página do investimento: tudo somado.
 *
 * ⚠️ Quando o principal e os complementos não cobrem o mesmo tempo, a página é
 * OBRIGADA a dizer — e diz, a partir de `coberturasDivergem`, não de texto fixo.
 * Um total de 36+12 somado com complemento de 36 meses, sem essa frase, promete
 * uma cobertura que o preço não sustenta.
 */
function paginaResumo(
  consolidado: Consolidado,
  doc: PropostaDocumento,
  numeroPagina: number,
  total: number
): string {
  const ls = consolidado.linhas
  const quantidade = doc.investimento.quantidade

  const cabecalhos = ls
    .map(
      (l, i) =>
        `<div style="padding:8px 6px; text-align:center; font-weight:800;${i === ls.length - 1 ? ` color:${C.accent};` : ''}">${escapeHtml(l.rotulo)}</div>`
    )
    .join('\n            ')

  const totais = ls
    .map((l, i) => {
      const ultimo = i === ls.length - 1
      const fundo = ultimo ? C.accent : C.ink
      const raio = ultimo ? 'border-radius:0 8px 8px 0;' : ''
      return `<div style="padding:14px 4px; text-align:center; background:${fundo}; color:${ultimo ? '#fff' : '#F5F2EC'}; font-weight:800; font-size:15px; margin-top:8px; ${raio}">${formatarBRL(l.total)}</div>`
    })
    .join('\n            ')

  const notaCobertura = consolidado.coberturasDivergem
    ? `<div style="margin-top:18px; padding:14px 16px; background:${C.surface}; border-left:4px solid ${C.accent}; font-size:12.5px; line-height:1.7; color:${C.body};">
             <strong>Sobre a coluna de 36 meses:</strong> o ${escapeHtml(consolidado.planoLabel)} é contratado na condição <strong>36+12</strong> — paga-se 36 meses e a proteção vale por 48. Os complementos acima <strong>cobrem 36 meses</strong>, sem o bônus. A soma desta página junta as duas coisas, e é por isso que a cobertura de cada linha vem escrita ao lado.
           </div>`
    : ''

  const itens = consolidado.itens
    .map(
      (i) =>
        `<li style="margin-bottom:6px; font-size:13.5px; color:${C.body};">${escapeHtml(i)}</li>`
    )
    .join('\n              ')

  return pagina(`${cabecalhoCorrido(doc.empresaNome)}
      <div style="margin-top:56px;">${tituloSecao(SECOES.RESUMO, 'Resumo do investimento')}
        <p style="font-size:15px; line-height:1.8; color:${C.body}; margin:0; max-width:600px; text-align:justify;">A solução completa para <strong>${quantidade} licenças</strong>, com tudo o que foi selecionado nesta proposta.</p>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">
        <div style="margin-bottom:20px;">
          <div style="font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:${C.accent}; font-weight:800; margin-bottom:10px;">O que está incluído</div>
          <ul style="margin:0 0 22px; padding-left:20px;">
              ${itens}
          </ul>

          <div style="display:grid; grid-template-columns:1.9fr 1fr 1fr 1fr; font-size:13px;">
            <div style="padding:8px 6px; color:${C.faint}; font-weight:700; font-size:11.5px;">Período</div>
            ${cabecalhos}

            ${linhaGrid(
              'Cobertura do GravityZone',
              ls.map((l) => `${l.mesesPrincipal} meses`),
              { destaqueUltimo: false, corValor: `color:${C.muted};` }
            )}

            ${linhaGrid(
              'Cobertura dos complementos',
              ls.map((l) => (l.totalComplementos > 0 ? `${l.mesesComplementos} meses` : '—')),
              { destaqueUltimo: false, corValor: `color:${C.muted};` }
            )}

            ${linhaGrid(
              `${escapeHtml(consolidado.planoLabel)} (${quantidade} licenças)`,
              ls.map((l) => formatarBRL(l.totalPrincipal))
            )}

            ${linhaGrid(
              'Complementos',
              ls.map((l) => formatarBRL(l.totalComplementos))
            )}

            <div style="padding:14px; color:#fff; font-weight:800; background:${C.ink}; border-radius:8px 0 0 8px; margin-top:8px; font-size:15px;">Investimento total</div>
            ${totais}
          </div>

          ${notaCobertura}
        </div>
      </div>

      <div style="font-size:12px; color:${C.faint}; font-weight:600; text-align:center;">Valores em reais &middot; ${quantidade} licenças &middot; faixa ${doc.investimento.faixa} da tabela vigente.</div>
${rodape(numeroPagina, total, doc.ano, '18px')}`)
}

// ─── documento ───────────────────────────────────────────────────────────────


export function renderPropostaHtml(doc: PropostaDocumento): string {
  const planos = doc.investimento.planos
  const total = totalPaginas(planos.length, (doc.complementos ?? []).length)
  const empresa = escapeHtml(doc.empresaNome)
  const cliente = escapeHtml(doc.clienteNome)
  const vend = doc.vendedor
  const telefone = escapeHtml(vend.telefone || TELEFONE_DEFENZ)

  const paginasInvestimento = planos
    .map((bloco, i) =>
      paginaInvestimento(bloco, i, doc, PAGINAS_ANTES_DO_INVESTIMENTO + 1 + i, total)
    )
    .join('\n')

  // Complementos e resumo entram DEPOIS do investimento e só existem se houver
  // complemento escolhido — sem eles o documento é byte a byte o de antes.
  const comps = doc.complementos ?? []
  const grupos: BlocoComplemento[][] = []
  for (let i = 0; i < comps.length; i += COMPLEMENTOS_POR_PAGINA) {
    grupos.push(comps.slice(i, i + COMPLEMENTOS_POR_PAGINA))
  }
  const primeiraComplemento = PAGINAS_ANTES_DO_INVESTIMENTO + 1 + planos.length

  const paginasComplementos = grupos
    .map((g, i) => paginaComplementos(g, i, doc, primeiraComplemento + i, total))
    .join('\n')

  const paginaDoResumo =
    comps.length > 0 && doc.consolidado
      ? paginaResumo(doc.consolidado, doc, primeiraComplemento + grupos.length, total)
      : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Proposta Defenz ${escapeHtml(doc.codigo)} · ${empresa}</title>
<style>
  /* Manrope embutida (variable 400..800). Sem rede: se cair para fonte
     substituta, o documento sai visualmente errado sem avisar (R2).
     As faixas vêm de @/lib/pdf/fonte-embutida — mesma fonte que alimenta a
     guarda de glifo (23/08: o tique sumiu do PDF do cliente por estar fora
     delas). Nunca escrever a lista à mão aqui. */
  @font-face {
    font-family: 'Manrope';
    font-style: normal;
    font-weight: 400 800;
    font-display: block;
    src: url(${MANROPE_LATIN_WOFF2}) format('woff2');
    unicode-range: ${UNICODE_RANGES_EMBUTIDAS[0]};
  }
  @font-face {
    font-family: 'Manrope';
    font-style: normal;
    font-weight: 400 800;
    font-display: block;
    src: url(${MANROPE_LATIN_EXT_WOFF2}) format('woff2');
    unicode-range: ${UNICODE_RANGES_EMBUTIDAS[1]};
  }

  /* Logo declarado UMA vez. Repetir o data URI em ~20 <img> inchava o PDF. */
  .dz-logo {
    display: inline-block;
    background-image: url(${LOGO_HORIZONTAL_INK_PNG});
    background-repeat: no-repeat;
    background-position: left center;
    background-size: contain;
  }

  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: ${C.paper}; }
  body { font-family: 'Manrope', sans-serif; color: ${C.ink}; }
  p { text-wrap: pretty; }

  /* A4 = 210×297mm. O documento real mede exatamente isso (spec §2.3). */
  .page {
    width: 210mm;
    height: 297mm;
    background: ${C.paper};
    color: ${C.ink};
    position: relative;
    overflow: hidden;
    break-inside: avoid;
    break-after: page;
  }
  .page:last-child { break-after: auto; }

  @page { size: 210mm 297mm; margin: 0; }
</style>
</head>
<body>

  <!-- ===================== CAPA ===================== -->
  <section class="page">
    <svg width="520" height="620" viewBox="0 0 520 620" fill="none" style="position:absolute; right:-40px; top:-30px; opacity:0.5;">
      <g stroke="#E0DACE" stroke-width="1.5" fill="none">
        <path d="M120 40 L200 40 L240 110 L200 180 L120 180 L80 110 Z"></path>
        <path d="M280 40 L360 40 L400 110 L360 180 L280 180 L240 110 Z"></path>
        <path d="M200 180 L280 180 L320 250 L280 320 L200 320 L160 250 Z"></path>
        <path d="M360 180 L440 180 L480 250 L440 320 L360 320 L320 250 Z"></path>
        <path d="M120 320 L200 320 L240 390 L200 460 L120 460 L80 390 Z"></path>
        <path d="M280 320 L360 320 L400 390 L360 460 L280 460 L240 390 Z"></path>
      </g>
      <g fill="${C.accent}" opacity="0.5">
        <circle cx="240" cy="110" r="4"></circle><circle cx="320" cy="250" r="4"></circle><circle cx="200" cy="320" r="4"></circle><circle cx="360" cy="320" r="4"></circle>
      </g>
    </svg>
    <div style="position:absolute; left:0; top:0; bottom:0; width:8px; background:${C.accent};"></div>

    <div style="position:relative; height:100%; padding:64px 66px 56px; display:flex; flex-direction:column;">
      <div style="align-self:flex-start;">${logo(34)}</div>

      <div style="margin-top:190px;">
        <div style="width:56px; height:4px; background:${C.accent}; margin-bottom:26px;"></div>
        <div style="font-size:22px; font-weight:700; color:${C.muted}; margin-bottom:10px;">Proposta Comercial</div>
        <div style="font-size:15px; color:#8A8577; font-weight:600; margin-bottom:8px;">Preparado para: <span style="color:${C.ink}; font-weight:800;">${empresa}</span></div>
        <div style="font-size:14px; color:#8A8577; font-weight:600; margin-bottom:36px;">A/C <span style="color:${C.ink}; font-weight:700;">${cliente}</span></div>
        <h1 style="font-size:52px; line-height:1.08; font-weight:800; letter-spacing:-0.03em; margin:0; max-width:600px;">Produto de Cibersegurança Gerenciada</h1>
      </div>

      <div style="margin-top:auto; display:flex; align-items:flex-end; justify-content:space-between;">
        <div style="font-size:14px; line-height:1.9; color:${C.muted};">
          <div style="font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:${C.faint}; font-weight:700; margin-bottom:6px;">Data do documento</div>
          <div style="font-weight:600; margin-bottom:16px;">${escapeHtml(doc.dataFormatada)}</div>
          <div style="font-size:12px; letter-spacing:0.12em; text-transform:uppercase; color:${C.faint}; font-weight:700; margin-bottom:6px;">Proposta nº</div>
          <div style="font-weight:800; color:${C.ink};">${escapeHtml(doc.codigo)}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:13px; letter-spacing:0.1em; text-transform:uppercase; color:${C.accent}; font-weight:800; margin-bottom:6px;">Contato comercial</div>
          <div style="font-size:19px; font-weight:800; margin-bottom:2px;">${escapeHtml(vend.nome)}</div>
          <div style="font-size:14px; color:${C.muted}; font-weight:600;">${escapeHtml(vend.email)}</div>
          <div style="font-size:14px; color:${C.muted}; font-weight:600;">${telefone}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ===================== CONFIDENCIALIDADE ===================== -->
${pagina(`${cabecalhoCorrido(doc.empresaNome)}
      <div style="margin-top:78px;">
        <div style="width:56px; height:4px; background:${C.accent}; margin-bottom:24px;"></div>
        <h2 style="font-size:40px; font-weight:800; letter-spacing:-0.02em; margin:0 0 34px;">Confidencialidade</h2>
        <div style="max-width:600px; display:flex; flex-direction:column; gap:22px;">
          <p style="font-size:16px; line-height:1.8; color:${C.body}; margin:0; text-align:justify;">Este documento é de propriedade da <strong>Defenz Cybersecurity</strong> e contém informações de caráter estritamente confidencial. As informações aqui apresentadas destinam-se exclusivamente ao uso do destinatário desta proposta, para fins de avaliação da contratação dos serviços descritos.</p>
          <p style="font-size:16px; line-height:1.8; color:${C.body}; margin:0; text-align:justify;">É vedada a reprodução, divulgação ou distribuição deste conteúdo, no todo ou em parte, a terceiros, por qualquer meio, sem a autorização prévia e por escrito da Defenz. Caso o receptor não seja o destinatário autorizado, fica notificado de que qualquer manuseio indevido deste material é expressamente proibido.</p>
          <p style="font-size:16px; line-height:1.8; color:${C.body}; margin:0; text-align:justify;">Ao dar seguimento à análise desta proposta, o destinatário concorda em preservar o sigilo das informações nela contidas.</p>
        </div>
        <div style="margin-top:44px; border-left:3px solid ${C.accent}; padding-left:22px; max-width:560px;">
          <div style="font-size:22px; font-weight:800; letter-spacing:-0.01em; line-height:1.3;">Nós transparecemos <span style="color:${C.accent};">confiança.</span></div>
        </div>
      </div>
${rodape(2, total, doc.ano)}`)}

  <!-- ===================== 01 · CONHEÇA-NOS ===================== -->
${pagina(`${cabecalhoCorrido(doc.empresaNome)}
      <div style="margin-top:66px;">${tituloSecao(SECOES.CONHECA_NOS, 'Conheça-nos')}
        <div style="max-width:600px; display:flex; flex-direction:column; gap:22px;">
          <p style="font-size:16px; line-height:1.8; color:${C.body}; margin:0; text-align:justify;">A <strong>Defenz</strong> é uma empresa especializada em soluções de cibersegurança para empresas que não podem parar. Reunimos a tecnologia líder global de proteção à excelência operacional de uma equipe brasileira, entregando defesa em camadas sob uma única console gerenciada.</p>
          <p style="font-size:16px; line-height:1.8; color:${C.body}; margin:0; text-align:justify;">Nossa premissa é simples: segurança de ponta não precisa ser complexa. Desenhamos cada operação para reduzir a superfície de risco sem impactar a produtividade do time, com curadoria de fornecedores, implementação conforme as boas práticas do fabricante e acompanhamento contínuo da base instalada.</p>
          <p style="font-size:16px; line-height:1.8; color:${C.body}; margin:0; text-align:justify;">Não vendemos apenas licenças. Entregamos tranquilidade, a certeza de que a infraestrutura, os dados e as pessoas da sua organização estão protegidos pelo melhor atendimento técnico do país.</p>
        </div>
        <div style="margin-top:46px; border-left:3px solid ${C.accent}; padding-left:22px; max-width:560px;">
          <div style="font-size:22px; font-weight:800; letter-spacing:-0.01em; line-height:1.35;">Nós transparecemos <span style="color:${C.accent};">segurança de verdade.</span></div>
        </div>
      </div>
${rodape(3, total, doc.ano)}`)}

  <!-- ===================== 02 · PORQUE NÓS ===================== -->
${pagina(`${cabecalhoCorrido(doc.empresaNome)}
      <div style="margin-top:66px;">${tituloSecao(SECOES.PORQUE_NOS, 'Porque nós')}
        <p style="font-size:16px; line-height:1.8; color:${C.body}; margin:0; max-width:600px; text-align:justify;">Trazemos ordem e simplicidade a ambientes complexos, facilitando a tomada de decisão. Nossos valores orientam tudo o que fazemos e sustentam uma jornada de sucesso mútuo com clientes e parceiros.</p>
      </div>

      <div style="flex:1; display:grid; grid-template-columns:1fr 1fr 1fr; gap:30px 24px; align-content:center; padding:20px 0;">
        ${VALORES.map(
          (v, i) => `<div style="display:flex; flex-direction:column; align-items:center; text-align:center;">
          <div style="width:118px; height:118px; border-radius:50%; border:3px solid ${i % 2 === 0 ? C.accent : C.ink}; display:flex; align-items:center; justify-content:center; margin-bottom:18px;">${v.icone}</div>
          <div style="font-size:19px; font-weight:800; letter-spacing:-0.01em; margin-bottom:8px;">${v.titulo}</div>
          <p style="font-size:13.5px; line-height:1.5; color:${C.muted}; margin:0; max-width:180px;">${v.texto}</p>
        </div>`
        ).join('\n        ')}
      </div>
${rodape(4, total, doc.ano)}`)}

  <!-- ===================== 03 · NOSSOS SERVIÇOS ===================== -->
${pagina(`${cabecalhoCorrido(doc.empresaNome)}
      <div style="margin-top:66px;">${tituloSecao(SECOES.SERVICOS, 'Nossos serviços')}
        <p style="font-size:16px; line-height:1.8; color:${C.body}; margin:0; max-width:600px; text-align:justify;">Oferecemos um serviço completo de proteção em camadas, com arquitetura modular e total aderência às boas práticas. Uma inteligência unificada (XDR) correlaciona prevenção, detecção, resposta e análise de risco sob uma única console.</p>
      </div>

      <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center;">
        <!-- 520px de largura, nao 400: com 400 o bloco do rotulo (150px) alcancava
                 o circulo central de 150px e "Analise de risco" saia POR BAIXO do
                 vermelho. Agora sobram ~35px de folga de cada lado. -->
            <div style="position:relative; width:520px; height:400px;">
          <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center;">
            <!-- SEM box-shadow: o Skia (motor de PDF do Chromium) rasteriza sombra como
                 RETANGULO solido, e no PDF isso virava um borrao vermelho quadrado
                 atras do circulo. Na tela ficava bonito; no papel, defeito. -->
            <div style="width:150px; height:150px; border-radius:50%; background:${C.accent}; color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center;">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" style="margin-bottom:6px;"><path d="M13 2 L4 13 H11 L11 22 L20 11 H13 Z" fill="#fff"></path></svg>
              <div style="font-size:19px; font-weight:800; line-height:1.05;">XDR</div>
              <div style="font-size:11px; font-weight:600; opacity:0.85;">Inteligência</div>
            </div>
          </div>
          <div style="position:absolute; top:0; left:50%; transform:translateX(-50%); width:150px; text-align:center;"><div style="width:74px; height:74px; margin:0 auto 8px; border-radius:50%; background:${C.surface}; border:2px solid ${C.line}; display:flex; align-items:center; justify-content:center;"><svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M12 3 L19 6 V11 C19 15.8 15.9 19.4 12 20.8 C8.1 19.4 5 15.8 5 11 V6 Z" stroke="${C.ink}" stroke-width="1.6" fill="none"></path><path d="M9 12 L11 14 L15 9.5" stroke="${C.accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></div><div style="font-size:15px; font-weight:800;">Prevenção</div></div>
          <div style="position:absolute; top:50%; right:0; transform:translateY(-50%); width:150px; text-align:center;"><div style="width:74px; height:74px; margin:0 auto 8px; border-radius:50%; background:${C.surface}; border:2px solid ${C.line}; display:flex; align-items:center; justify-content:center;"><svg width="30" height="30" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="6" stroke="${C.ink}" stroke-width="1.6"></circle><path d="M15.5 15.5 L20 20" stroke="${C.accent}" stroke-width="1.8" stroke-linecap="round"></path></svg></div><div style="font-size:15px; font-weight:800;">Detecção</div></div>
          <div style="position:absolute; bottom:0; left:50%; transform:translateX(-50%); width:150px; text-align:center;"><div style="width:74px; height:74px; margin:0 auto 8px; border-radius:50%; background:${C.surface}; border:2px solid ${C.line}; display:flex; align-items:center; justify-content:center;"><svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M4 12 A8 8 0 1 1 6.5 17.8" stroke="${C.ink}" stroke-width="1.6" fill="none" stroke-linecap="round"></path><path d="M4 18 V13 H9" stroke="${C.accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg></div><div style="font-size:15px; font-weight:800;">Resposta</div></div>
          <div style="position:absolute; top:50%; left:0; transform:translateY(-50%); width:150px; text-align:center;"><div style="width:74px; height:74px; margin:0 auto 8px; border-radius:50%; background:${C.surface}; border:2px solid ${C.line}; display:flex; align-items:center; justify-content:center;"><svg width="30" height="30" viewBox="0 0 24 24" fill="none"><path d="M4 19 V10 M9 19 V6 M14 19 V12 M19 19 V4" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"></path><circle cx="19" cy="4" r="1.8" fill="${C.accent}"></circle></svg></div><div style="font-size:15px; font-weight:800;">Análise de risco</div></div>
        </div>
      </div>

      <div style="border-left:3px solid ${C.accent}; padding-left:22px; max-width:600px;">
        <div style="font-size:18px; font-weight:800; letter-spacing:-0.01em; margin-bottom:4px;">Cobertura total.</div>
        <p style="font-size:14.5px; line-height:1.6; color:${C.muted}; margin:0;">Windows, Linux e Mac protegidos sob uma única arquitetura gerenciada.</p>
      </div>
${rodape(5, total, doc.ano)}`)}

  <!-- ===================== 04 · PARCERIA ESTRATÉGICA ===================== -->
${pagina(`${cabecalhoCorrido(doc.empresaNome)}
      <div style="margin-top:66px;">
        <div style="width:56px; height:4px; background:${C.accent}; margin-bottom:22px;"></div>
        <h2 style="font-size:40px; font-weight:800; letter-spacing:-0.02em; margin:0 0 28px;"><span style="color:${C.accent};">${SECOES.PARCERIA}</span>&nbsp;&nbsp;Parceria estratégica</h2>
        <div style="max-width:600px; display:flex; flex-direction:column; gap:20px;">
          <p style="font-size:16px; line-height:1.8; color:${C.body}; margin:0; text-align:justify;">Para se manter à frente de um mercado competitivo, a <strong>sua operação</strong> estabelece uma referência de qualidade para seus clientes. A Defenz apresenta uma proposta de parceria baseada em experiência já adquirida em serviços de missão crítica, sustentando a alta disponibilidade dos recursos de tecnologia e a segurança da informação.</p>
          <p style="font-size:16px; line-height:1.8; color:${C.body}; margin:0; text-align:justify;">Somamos a excelência operacional local à <strong>Bitdefender</strong>, uma das maiores potências globais em cibersegurança, reconhecida como Visionária no Magic Quadrant da Gartner, 6× vencedora do Best Protection e parceira oficial da Scuderia Ferrari.</p>
        </div>
      </div>

      <div style="margin-top:38px;">
        <div style="font-size:13px; letter-spacing:0.14em; text-transform:uppercase; color:${C.accent}; font-weight:800; margin-bottom:20px;">Conceitos-chave da parceria</div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px 40px; max-width:640px;">
          ${CONCEITOS.map(
            (c) =>
              `<div style="display:flex; gap:12px; align-items:flex-start;"><span style="color:${C.accent}; font-weight:800; font-size:16px; line-height:1.5;">·</span><span style="font-size:15px; color:#3A3833; font-weight:600;">${c}</span></div>`
          ).join('\n          ')}
        </div>
      </div>

      <div style="margin-top:auto; padding-top:24px;">
        <div style="border-left:3px solid ${C.accent}; padding-left:22px;"><div style="font-size:22px; font-weight:800; letter-spacing:-0.01em;">A decisão lógica para a sua segurança.</div></div>
      </div>
${rodape(6, total, doc.ano, '28px')}`)}

  <!-- ===================== 05 · GOVERNANÇA ===================== -->
${pagina(`${cabecalhoCorrido(doc.empresaNome)}
      <div style="margin-top:66px;">${tituloSecao(SECOES.GOVERNANCA, 'Governança tecnológica')}
        <p style="font-size:16px; line-height:1.8; color:${C.body}; margin:0; max-width:600px; text-align:justify;">Adotamos um modelo de entrega baseado no framework ITIL®V4, com padronização, previsibilidade e melhoria contínua. Toda a operação é conduzida em uma única console, visão 360° em <em>single-pane-of-glass</em>.</p>
      </div>

      <div style="margin-top:40px; display:flex; flex-direction:column; gap:22px;">
        ${GOVERNANCA.map(
          (g, i) => `<div style="display:flex; gap:20px; align-items:flex-start;">
          <div style="flex-shrink:0; width:52px; height:52px; border-radius:50%; border:3px solid ${i % 2 === 0 ? C.accent : C.ink}; display:flex; align-items:center; justify-content:center;">${g.icone}</div>
          <div style="padding-top:3px;"><div style="font-size:20px; font-weight:800; letter-spacing:-0.01em; margin-bottom:5px;">${g.titulo}</div><p style="font-size:15px; line-height:1.6; color:${C.muted}; margin:0; max-width:540px;">${g.texto}</p></div>
        </div>${i < GOVERNANCA.length - 1 ? `\n        <div style="height:1px; background:${C.line};"></div>` : ''}`
        ).join('\n        ')}
      </div>

      <div style="margin-top:40px; background:${C.surface}; border:1px solid ${C.line}; border-radius:16px; padding:26px 30px;">
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:18px;">
          <span style="font-size:12px; letter-spacing:0.14em; text-transform:uppercase; color:${C.faint}; font-weight:700;">GravityZone Console</span>
          <span style="display:inline-block; background:${C.accent}; color:#fff; font-size:12px; font-weight:800; padding:6px 14px; border-radius:8px;">Single-Pane-of-Glass</span>
        </div>
        <!-- Grade de 3 colunas, não flex-wrap: com wrap sobrava um separador
             vertical pendurado no fim da primeira linha. -->
        <div style="display:grid; grid-template-columns:1fr 1fr 1fr; align-items:center;">
          <div style="font-size:13.5px; color:${C.body}; font-weight:600; padding-right:18px;">Inventário de estações e servidores</div>
          <div style="font-size:13.5px; color:${C.body}; font-weight:600; padding:0 18px; border-left:1px solid ${C.line};">Postura de segurança e risco</div>
          <div style="font-size:13.5px; color:${C.body}; font-weight:600; padding-left:18px; border-left:1px solid ${C.line};">Incidentes e resposta</div>
        </div>
      </div>
${rodape(7, total, doc.ano)}`)}

  <!-- ===================== INVESTIMENTO (uma página por plano) ===================== -->
${paginasInvestimento}
${paginasComplementos}
${paginaDoResumo}

  <!-- ===================== ENCERRAMENTO ===================== -->
  <section class="page">
    <div style="position:absolute; left:0; top:0; bottom:0; width:8px; background:${C.accent};"></div>
    <div style="height:100%; padding:64px 66px 56px; display:flex; flex-direction:column;">
      <div style="align-self:flex-start;">${logo(34)}</div>
      <div style="margin-top:auto; margin-bottom:auto;">
        <div style="width:56px; height:4px; background:${C.accent}; margin-bottom:28px;"></div>
        <h1 style="font-size:56px; line-height:1.05; font-weight:800; letter-spacing:-0.03em; margin:0 0 24px;">Vamos proteger o<br>que não pode parar.</h1>
        <p style="font-size:18px; line-height:1.7; color:#4A4740; margin:0; max-width:520px;">Estamos à disposição para detalhar o escopo, ajustar o dimensionamento e iniciar a implementação com a nossa equipe.</p>
      </div>
      <div style="display:flex; align-items:flex-end; justify-content:space-between; padding-top:32px; border-top:1px solid ${C.line};">
        <div>
          <div style="font-size:13px; letter-spacing:0.1em; text-transform:uppercase; color:${C.accent}; font-weight:800; margin-bottom:8px;">Contato</div>
          <div style="font-size:16px; color:#3A3833; font-weight:700; line-height:1.7;">${escapeHtml(vend.nome)} · Comercial<br>${escapeHtml(vend.email)} · ${telefone}</div>
        </div>
        <div style="font-size:20px; font-weight:800; color:${C.accent};">defenz.com.br</div>
      </div>
    </div>
  </section>

</body>
</html>`
}

// ─── conteúdo institucional (transcrito, idêntico nos dois clientes reais) ───

const VALORES = [
  {
    titulo: 'Qualidade',
    texto: 'A melhor experiência unindo tecnologia, processo e pessoas.',
    icone: `<svg width="46" height="46" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="9" r="4.2" stroke="${C.ink}" stroke-width="1.5"></circle><path d="M12 13.2 V17 M9.5 20 L12 17 L14.5 20" stroke="${C.accent}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path><path d="M8 8.5 A4 4 0 0 1 16 8.5" stroke="${C.ink}" stroke-width="1.5" fill="none"></path></svg>`,
  },
  {
    titulo: 'Segurança',
    texto: 'Proteção de riscos com confiabilidade e produtividade.',
    icone: `<svg width="46" height="46" viewBox="0 0 24 24" fill="none"><path d="M12 3 L19 6 V11 C19 15.8 15.9 19.4 12 20.8 C8.1 19.4 5 15.8 5 11 V6 Z" stroke="${C.ink}" stroke-width="1.5" fill="none"></path><rect x="9.3" y="10.5" width="5.4" height="4.4" rx="0.8" stroke="${C.accent}" stroke-width="1.5"></rect><path d="M10.4 10.5 V9.3 A1.6 1.6 0 0 1 13.6 9.3 V10.5" stroke="${C.accent}" stroke-width="1.5"></path></svg>`,
  },
  {
    titulo: 'Simplicidade',
    texto: 'No simples, alcançamos resultados extraordinários.',
    icone: `<svg width="46" height="46" viewBox="0 0 24 24" fill="none"><path d="M12 3 A9 9 0 1 0 21 12" stroke="${C.ink}" stroke-width="1.5" fill="none" stroke-linecap="round"></path><path d="M12 7 V12 L15.5 14" stroke="${C.accent}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
  },
  {
    titulo: 'Eficiência',
    texto: 'Resultados otimizando recursos e melhoria contínua.',
    icone: `<svg width="46" height="46" viewBox="0 0 24 24" fill="none"><path d="M4 16 L9.5 10.5 L13 14 L20 7" stroke="${C.accent}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.5 7 H20 V11.5" stroke="${C.ink}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
  },
  {
    titulo: 'Comprometimento',
    texto: 'Compromisso genuíno com o resultado dos clientes.',
    icone: `<svg width="46" height="46" viewBox="0 0 24 24" fill="none"><path d="M12 20 C12 20 4 15 4 9.2 A3.8 3.8 0 0 1 12 7 A3.8 3.8 0 0 1 20 9.2 C20 15 12 20 12 20 Z" stroke="${C.ink}" stroke-width="1.5" fill="none" stroke-linejoin="round"></path></svg>`,
  },
  {
    titulo: 'Parceria',
    texto: 'Uma jornada de aprendizado e sucesso mútuo.',
    icone: `<svg width="46" height="46" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="9" r="2.6" stroke="${C.ink}" stroke-width="1.5"></circle><circle cx="16" cy="10.5" r="2.2" stroke="${C.accent}" stroke-width="1.5"></circle><path d="M4.5 18 C4.5 14.7 6.6 13 9 13 C11.4 13 13.5 14.7 13.5 18" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round"></path><path d="M14 18 C14 15.6 15 14.2 16.8 14.2 C18.6 14.2 19.5 15.6 19.5 18" stroke="${C.accent}" stroke-width="1.5" stroke-linecap="round"></path></svg>`,
  },
] as const


const CONCEITOS = [
  'Aderência às boas práticas de entrega',
  'Experiência e capital intelectual',
  'Atendimento do escopo técnico',
  'Automatização e melhoria contínua',
  'Custos adequados e escaláveis',
  'Gestão transparente',
  'Comprometimento com o combinado',
  'Flexibilidade e personalização',
] as const

const GOVERNANCA = [
  {
    titulo: 'Gestão unificada',
    texto:
      'Uma única plataforma nativa para gerenciar toda a complexidade da organização.',
    icone: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="11" rx="1.5" stroke="${C.ink}" stroke-width="1.6"></rect><path d="M8 20 H16 M12 16 V20" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"></path></svg>`,
  },
  {
    titulo: 'Redução de complexidade',
    texto: 'Simplificação de processos e diminuição drástica do tempo de gestão diária.',
    icone: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M6 18 L10 12 L14 15 L19 7" stroke="${C.accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path><path d="M4 5 V20 H20" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"></path></svg>`,
  },
  {
    titulo: 'Controle de qualidade',
    texto:
      'Alinhamento contínuo entre objetivos de negócio e métricas de resposta a incidentes.',
    icone: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="${C.ink}" stroke-width="1.6"></circle><path d="M8.5 12 L11 14.5 L15.5 9.5" stroke="${C.accent}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>`,
  },
] as const
