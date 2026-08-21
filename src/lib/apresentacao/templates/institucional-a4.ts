// ─────────────────────────────────────────────────────────────────────────────
// TEMPLATE A4 · Apresentação institucional Bitdefender + Defenz
// feature-portal-apresentacao.md §7
//
// ⚠️ A4, não 16:9. A spec v2 tinha derivado 16:9 ("é deck"); o Marcos corrigiu
// em 21/08: MESMO formato A4 da proposta. Some a geometria nova e o documento
// entra na mesma família visual do que o cliente já recebe.
//
// ⚠️ Nada busca recurso na rede: fonte e logo vêm de `proposta/assets/embedded.ts`
// como data URI. Fonte que não carrega = documento errado em silêncio (I10).
//
// ⚠️ A numeração de seções e páginas é DERIVADA da lista de páginas, nunca
// escrita à mão. Em 21/08 a proposta foi para produção pulando de 05 para 07
// porque uma seção morava noutra função e ficou para trás. Aqui isso não tem
// como acontecer: quem numera é o índice do array.
// ─────────────────────────────────────────────────────────────────────────────

import {
  LOGO_HORIZONTAL_INK_PNG,
  MANROPE_LATIN_EXT_WOFF2,
  MANROPE_LATIN_WOFF2,
} from '@/lib/proposta/assets/embedded'
import {
  COMPARATIVO,
  NIVEIS,
  NIVEL_NOME,
  disponivelEm,
  funcionalidade,
  type FuncionalidadeId,
  type NivelId,
} from '../comparativo'
import { BITDEFENDER, PROVAS } from '../institucional-fatos'
import type { FatoMercado } from '../mercado-fatos'

/** Paleta do brandbook, a mesma da proposta. ~70% papel, ~22% tinta, ~8% crimson. */
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

export const TELEFONE_DEFENZ = '(11) 3040-2960'
export const TEMPLATE_VERSAO = '2026-08-21'

export interface CasoApresentado {
  oQueAconteceu: string
  necessidade: string
  funcionalidade: FuncionalidadeId
  veiculo: string
  ano: number
}

export interface ApresentacaoDocumento {
  clienteNome: string
  empresaNome: string
  /** Rótulo do setor, já confirmado pelo vendedor (passo zero da spec §4). */
  setor?: string
  dataFormatada: string
  ano: number
  vendedor: { nome: string; email: string; telefone?: string }
  /** Resolvidos por `fatosParaSetor()` — específico do setor primeiro. */
  fatos: FatoMercado[]
  /** Vazio na F2 (sem IA) e sempre que a pesquisa não achar nada (spec §6.7). */
  casos: CasoApresentado[]
  nivelDestaque: NivelId
}

export function escapeHtml(valor: string): string {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const LOGO_RATIO = 480 / 131

function logo(alturaPx: number): string {
  return `<span class="dz-logo" style="height:${alturaPx}px; width:${Math.round(alturaPx * LOGO_RATIO)}px;"></span>`
}

function cabecalho(doc: ApresentacaoDocumento): string {
  return `
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        <div style="font-size:11px; color:${C.faint}; font-weight:600; text-transform:uppercase; letter-spacing:0.04em; line-height:1.8;">${escapeHtml(doc.empresaNome)} · Bitdefender GravityZone com a Defenz</div>
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

function tituloSecao(numero: string, texto: string): string {
  return `
        <div style="width:56px; height:4px; background:${C.accent}; margin-bottom:22px;"></div>
        <h2 style="font-size:38px; font-weight:800; letter-spacing:-0.02em; margin:0 0 22px; line-height:1.1;"><span style="color:${C.accent};">${numero}</span>&nbsp;&nbsp;${texto}</h2>`
}

function linhaFonte(texto: string): string {
  return `<div style="font-size:11px; color:${C.faint}; font-weight:600; margin-top:6px;">${texto}</div>`
}

/** Cartão de dado: o número grande, a frase, e a fonte embaixo. */
function cartaoFato(f: FatoMercado): string {
  const ano = f.ano === 'lei' ? '' : ` · ${f.ano}`
  return `
          <div style="border-left:3px solid ${C.accent}; padding:2px 0 2px 18px;">
            <div style="font-size:26px; font-weight:800; letter-spacing:-0.02em; color:${C.accent}; line-height:1.2;">${escapeHtml(f.valor)}</div>
            <p style="font-size:14px; line-height:1.6; color:${C.body}; margin:4px 0 0;">${escapeHtml(f.texto)}</p>
            ${linhaFonte(`${escapeHtml(f.fonte)}${ano}`)}
          </div>`
}

/** Tabela dos três níveis, com a coluna recomendada em destaque. */
function tabelaNiveis(destaque: NivelId): string {
  const th = (n: NivelId) => {
    const on = n === destaque
    return `<th style="padding:10px 8px; text-align:center; font-size:12px; font-weight:800; ${on ? `color:${C.accent};` : `color:${C.muted};`}">${NIVEL_NOME[n].replace('Business Security', 'BS')}${on ? '<div style="font-size:9.5px; font-weight:700; letter-spacing:0.06em; text-transform:uppercase;">recomendado</div>' : ''}</th>`
  }
  const linhas = COMPARATIVO.map(
    (f, i) => `
              <tr style="background:${i % 2 ? C.surface : 'transparent'};">
                <td style="padding:7px 10px; font-size:12.5px; color:${C.body}; font-weight:600;">${escapeHtml(f.nome.split(' · ')[0])}</td>
                ${NIVEIS.map((n) => {
                  const tem = disponivelEm(f.id, n)
                  const on = n === destaque
                  return `<td style="padding:7px 8px; text-align:center; font-size:14px; font-weight:800; color:${tem ? (on ? C.accent : C.ink) : C.faint};">${tem ? '&#10003;' : '&mdash;'}</td>`
                }).join('')}
              </tr>`
  ).join('')

  return `
          <table style="width:100%; border-collapse:collapse;">
            <thead><tr style="border-bottom:2px solid ${C.ink};">
              <th style="padding:10px; text-align:left; font-size:12px; font-weight:800; color:${C.muted};">Recurso</th>
              ${NIVEIS.map(th).join('')}
            </tr></thead>
            <tbody>${linhas}</tbody>
          </table>`
}

const FAQ = [
  {
    p: 'Onde fica a sede da Bitdefender?',
    r: `A sede global fica em ${BITDEFENDER.sedeGlobal}, e há sede nos Estados Unidos em ${BITDEFENDER.sedeEUA}. A empresa foi fundada em ${BITDEFENDER.fundacao} e está presente em ${BITDEFENDER.paises} países.`,
  },
  {
    p: 'Nunca ouvi falar. É uma marca conhecida?',
    r: 'É uma das maiores fabricantes de segurança do mundo, e a tecnologia dela roda dentro de produtos de outras marcas que você provavelmente já usa. Nos testes independentes citados neste documento, ela aparece entre os melhores resultados do setor há anos.',
  },
  {
    p: 'Por que não basta a proteção que já vem no sistema operacional?',
    r: 'Porque a diferença aparece no que passa e no que atrapalha. Nos testes independentes deste documento, a solução bloqueou 99,8% das ameaças reais gerando um único falso alarme no período inteiro — e alerta falso custa hora de equipe, que é o recurso mais escasso de qualquer TI.',
  },
  {
    p: 'Vocês atendem órgãos públicos?',
    r: 'Sim. A plataforma é implementada em órgãos públicos brasileiros que passaram por processo licitatório, com termos de referência exigentes.',
  },
  {
    p: 'Quem me atende depois da venda?',
    r: 'A Defenz, direto. Sem intermediário, sem fila internacional e sem barreira de idioma: quem implanta é quem atende.',
  },
]

export function renderApresentacaoHtml(doc: ApresentacaoDocumento): string {
  const empresa = escapeHtml(doc.empresaNome)
  const cliente = escapeHtml(doc.clienteNome)
  const setor = doc.setor ? escapeHtml(doc.setor) : null
  const temCasos = doc.casos.length > 0
  const fatos = doc.fatos.slice(0, 5)

  // ── as seções numeradas, em ORDEM. O número sai do índice, nunca da mão.
  const secoes: { titulo: string; corpo: (n: string) => string }[] = []

  secoes.push({
    titulo: 'Quem é a Bitdefender',
    corpo: (n) => `${tituloSecao(n, 'Quem é a Bitdefender')}
        <p style="font-size:15.5px; line-height:1.8; color:${C.body}; margin:0 0 26px; max-width:620px; text-align:justify;">Uma fabricante global de cibersegurança fundada em ${BITDEFENDER.fundacao}, com origem que remonta a ${BITDEFENDER.origem}. Hoje protege organizações em ${BITDEFENDER.paises} países, com cerca de ${BITDEFENDER.especialistas} especialistas e centros de inteligência de ameaças que processam bilhões de eventos por dia.</p>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px 28px; max-width:640px;">
          ${[
            ['Fundação', String(BITDEFENDER.fundacao)],
            ['Presença', `${BITDEFENDER.paises} países`],
            ['Equipe global', `${BITDEFENDER.especialistas} especialistas`],
            ['Sede global', BITDEFENDER.sedeGlobal],
            ['Sede nos EUA', BITDEFENDER.sedeEUA],
            ['Parceria institucional', 'European Cybercrime Centre, desde 2016'],
          ]
            .map(
              ([k, v]) => `<div style="border-top:1px solid ${C.line}; padding-top:10px;">
            <div style="font-size:10.5px; letter-spacing:0.1em; text-transform:uppercase; color:${C.accent}; font-weight:800;">${k}</div>
            <div style="font-size:15px; font-weight:700; color:${C.ink}; margin-top:3px;">${v}</div>
          </div>`
            )
            .join('\n          ')}
        </div>`,
  })

  secoes.push({
    titulo: 'A quem ela já responde',
    corpo: (n) => `${tituloSecao(n, 'A quem ela já responde')}
        <p style="font-size:15.5px; line-height:1.8; color:${C.body}; margin:0 0 24px; max-width:620px; text-align:justify;">Uma marca que você não conhece precisa ser verificável. Abaixo está o que instituições independentes e organismos públicos dizem, com a fonte e o ano de cada afirmação.</p>
        <div style="display:flex; flex-direction:column; gap:16px; max-width:640px;">
          ${PROVAS.map(
            (p) => `<div style="display:flex; gap:14px; align-items:flex-start;">
            <span style="flex-shrink:0; margin-top:5px; width:9px; height:9px; border-radius:50%; background:${p.origem === 'independente' ? C.accent : C.faint};"></span>
            <div>
              <p style="font-size:14.5px; line-height:1.6; color:${C.body}; margin:0; font-weight:600;">${escapeHtml(p.texto)}</p>
              ${linhaFonte(`${escapeHtml(p.fonte)} · ${p.ano}${p.origem === 'fabricante' ? ' · dado do fabricante' : ''}`)}
            </div>
          </div>`
          ).join('\n          ')}
        </div>`,
  })

  secoes.push({
    titulo: 'Quem é a Defenz',
    corpo: (n) => `${tituloSecao(n, 'Quem é a Defenz')}
        <p style="font-size:15.5px; line-height:1.8; color:${C.body}; margin:0 0 26px; max-width:620px; text-align:justify;">A Defenz é a operação brasileira que implanta, opera e sustenta a plataforma. A tecnologia é global; quem atende é local, e é a mesma equipe do começo ao fim.</p>
        <div style="display:flex; flex-direction:column; gap:20px; max-width:620px;">
          ${[
            ['Especialistas certificados', 'A equipe tem o mais alto nível de certificação técnica na plataforma.'],
            ['Implementação e suporte no Brasil', 'Agilidade na resposta, entendimento do contexto local e atendimento direto, sem intermediários nem barreira de idioma.'],
            ['Parceiro, não fornecedor', 'Ajudamos a extrair valor da ferramenta e a evoluir a maturidade de segurança, em vez de entregar licença e sumir.'],
          ]
            .map(
              ([t, d]) => `<div style="border-left:3px solid ${C.accent}; padding-left:18px;">
            <div style="font-size:17px; font-weight:800; letter-spacing:-0.01em;">${t}</div>
            <p style="font-size:14.5px; line-height:1.65; color:${C.muted}; margin:4px 0 0;">${d}</p>
          </div>`
            )
            .join('\n          ')}
        </div>
        <div style="margin-top:auto; border-top:1px solid ${C.line}; padding-top:18px;">
          <p style="font-size:15px; line-height:1.7; color:${C.body}; margin:0; font-style:italic;">Seu pós-venda é com a gente. Direto, eficiente, resolutivo.</p>
        </div>`,
  })

  secoes.push({
    titulo: setor ? `O que está acontecendo em ${setor}` : 'O que está acontecendo',
    corpo: (n) => `${tituloSecao(n, setor ? `O que está acontecendo em ${setor}` : 'O que está acontecendo')}
        <p style="font-size:15.5px; line-height:1.8; color:${C.body}; margin:0 0 26px; max-width:620px; text-align:justify;">${setor ? `Os números abaixo são do setor de ${setor} e do Brasil` : 'Os números abaixo são do Brasil'}, não do mercado global. Cada um traz a fonte e o ano — confira todos.</p>
        <div style="flex:1; display:flex; flex-direction:column; justify-content:space-evenly; max-width:640px;">
          ${fatos.map(cartaoFato).join('\n          ')}
        </div>`,
  })

  if (temCasos) {
    secoes.push({
      titulo: 'O que já aconteceu, e o que responde por isso',
      corpo: (n) => `${tituloSecao(n, 'O que já aconteceu, e o que responde por isso')}
        <p style="font-size:15.5px; line-height:1.8; color:${C.body}; margin:0 0 24px; max-width:620px; text-align:justify;">Casos públicos do setor. As empresas envolvidas não são identificadas de propósito: o que importa aqui é o que falhou, e o recurso que responde por aquela falha.</p>
        <div style="display:flex; flex-direction:column; gap:20px; max-width:640px;">
          ${doc.casos
            .map((c) => {
              const f = funcionalidade(c.funcionalidade)
              return `<div style="border:1px solid ${C.line}; background:${C.surface}; padding:16px 18px;">
            <p style="font-size:14.5px; line-height:1.65; color:${C.ink}; margin:0; font-weight:700;">${escapeHtml(c.oQueAconteceu)}</p>
            ${linhaFonte(`${escapeHtml(c.veiculo)} · ${c.ano}`)}
            <p style="font-size:13.5px; line-height:1.6; color:${C.muted}; margin:10px 0 0;">${escapeHtml(c.necessidade)}</p>
            <div style="margin-top:10px; padding-top:10px; border-top:1px solid ${C.line}; font-size:13px; color:${C.body};"><span style="color:${C.accent}; font-weight:800;">Responde por isso:</span> <strong>${escapeHtml(f.nome.split(' · ')[0])}</strong> — disponível a partir de ${NIVEL_NOME[f.aPartirDe]}.</div>
          </div>`
            })
            .join('\n          ')}
        </div>`,
    })
  }

  secoes.push({
    titulo: 'Os três níveis, e o que muda entre eles',
    corpo: (n) => `${tituloSecao(n, 'Os três níveis, e o que muda entre eles')}
        <p style="font-size:15.5px; line-height:1.8; color:${C.body}; margin:0 0 20px; max-width:620px; text-align:justify;">Todos partem da mesma base de proteção. O que muda é a profundidade da detecção avançada e a capacidade de investigar um ataque em andamento.</p>
        <div style="flex:1; display:flex; flex-direction:column; justify-content:center;">${tabelaNiveis(doc.nivelDestaque)}
        </div>
        <div style="font-size:12.5px; color:${C.faint}; font-weight:600; text-align:center; padding-top:10px;">BS = Business Security. O detalhamento técnico de cada recurso é apresentado na reunião.</div>`,
  })

  secoes.push({
    titulo: 'O que dizem os testes independentes',
    corpo: (n) => `${tituloSecao(n, 'O que dizem os testes independentes')}
        <p style="font-size:15.5px; line-height:1.8; color:${C.body}; margin:0 0 26px; max-width:620px; text-align:justify;">Segurança não se avalia por folheto. Estes são resultados de laboratórios independentes, que testam todos os fabricantes sob o mesmo protocolo e publicam o método.</p>
        <div style="display:flex; flex-direction:column; gap:22px; max-width:640px;">
          ${PROVAS.filter((p) => p.origem === 'independente')
            .map(
              (p) => `<div style="border-left:3px solid ${C.accent}; padding-left:18px;">
            <p style="font-size:15.5px; line-height:1.65; color:${C.ink}; margin:0; font-weight:700;">${escapeHtml(p.texto)}</p>
            ${linhaFonte(`${escapeHtml(p.fonte)} · ${p.ano}`)}
          </div>`
            )
            .join('\n          ')}
        </div>
        <div style="margin-top:auto; border-top:1px solid ${C.line}; padding-top:18px; max-width:620px;">
          <p style="font-size:14px; line-height:1.7; color:${C.muted}; margin:0;">Um único falso alarme em todo o período de teste é um número operacional, não de marketing: alerta falso consome hora de equipe, e hora de equipe é o recurso mais escasso de qualquer TI.</p>
        </div>`,
  })

  secoes.push({
    titulo: 'Perguntas que todo mundo faz',
    corpo: (n) => `${tituloSecao(n, 'Perguntas que todo mundo faz')}
        <div style="display:flex; flex-direction:column; gap:18px; max-width:640px; margin-top:4px;">
          ${FAQ.map(
            (f) => `<div>
            <div style="font-size:15px; font-weight:800; color:${C.ink};">${escapeHtml(f.p)}</div>
            <p style="font-size:14px; line-height:1.65; color:${C.body}; margin:5px 0 0; text-align:justify;">${escapeHtml(f.r)}</p>
          </div>`
          ).join('\n          ')}
        </div>`,
  })

  // ── páginas, em ordem. Numeração derivada daqui — ver o comentário do topo.
  const capa = `
  <section class="page">
    <div style="position:absolute; left:0; top:0; bottom:0; width:8px; background:${C.accent};"></div>
    <div style="height:100%; padding:64px 66px 48px; display:flex; flex-direction:column;">
      <div style="display:flex; justify-content:space-between; align-items:flex-start;">
        ${logo(34)}
        <div style="text-align:right; font-size:11px; color:${C.faint}; font-weight:700; text-transform:uppercase; letter-spacing:0.1em;">Apresentação confidencial</div>
      </div>
      <div style="margin-top:auto; margin-bottom:auto;">
        <div style="width:56px; height:4px; background:${C.accent}; margin-bottom:28px;"></div>
        <h1 style="font-size:52px; line-height:1.06; font-weight:800; letter-spacing:-0.03em; margin:0 0 22px;">Segurança que<br>simplifica.<br>Performance<br>que escala.</h1>
        <p style="font-size:17px; line-height:1.7; color:${C.muted}; margin:0; max-width:520px;">A plataforma Bitdefender GravityZone${setor ? `, aplicada ao contexto de ${setor}` : ''}, com implantação e suporte da Defenz no Brasil.</p>
        <div style="margin-top:36px; font-size:14px; color:#8A8577; font-weight:600;">Preparado para <span style="color:${C.ink}; font-weight:800;">${empresa}</span></div>
        <div style="font-size:14px; color:#8A8577; font-weight:600;">A/C <span style="color:${C.ink}; font-weight:700;">${cliente}</span></div>
      </div>
      <div style="display:flex; align-items:flex-end; justify-content:space-between; padding-top:28px; border-top:1px solid ${C.line};">
        <div>
          <div style="font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:${C.accent}; font-weight:800; margin-bottom:6px;">Contato comercial</div>
          <div style="font-size:14px; font-weight:700;">${escapeHtml(doc.vendedor.nome)}</div>
          <div style="font-size:13px; color:${C.muted};">${escapeHtml(doc.vendedor.email)} · ${escapeHtml(doc.vendedor.telefone || TELEFONE_DEFENZ)}</div>
        </div>
        <div style="text-align:right; font-size:13px; color:${C.muted}; font-weight:600;">${escapeHtml(doc.dataFormatada)}</div>
      </div>
    </div>
  </section>`

  const abertura = (n: number, total: number) => `
  <section class="page">
    <div style="height:100%; padding:56px 66px 44px; display:flex; flex-direction:column;">${cabecalho(doc)}
      <div style="margin-top:60px;">
        <div style="width:56px; height:4px; background:${C.accent}; margin-bottom:22px;"></div>
        <h2 style="font-size:32px; font-weight:800; letter-spacing:-0.02em; margin:0 0 20px;">O que você vai ler aqui</h2>
        <p style="font-size:15.5px; line-height:1.8; color:${C.body}; margin:0 0 18px; max-width:620px; text-align:justify;">Este documento foi montado para ser lido sem ninguém do lado explicando. Ele responde, nesta ordem: quem é a fabricante, o que instituições independentes dizem dela, quem é a Defenz${setor ? `, o que está acontecendo hoje em ${setor}` : ''} e o que existe dentro da plataforma.</p>
        <p style="font-size:15.5px; line-height:1.8; color:${C.body}; margin:0 0 18px; max-width:620px; text-align:justify;">Todo número apresentado traz a fonte e o ano. Nada aqui é estimativa nossa: se um dado não tinha origem verificável, ele ficou de fora.</p>
      </div>
      <div style="margin-top:26px; border:1px solid ${C.line}; background:${C.surface}; padding:18px 20px; max-width:620px;">
        <div style="font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:${C.accent}; font-weight:800; margin-bottom:8px;">Confidencialidade</div>
        <p style="font-size:13.5px; line-height:1.7; color:${C.muted}; margin:0; text-align:justify;">As informações deste documento são confidenciais e destinadas exclusivamente a ${empresa}. É vedada a reprodução ou divulgação a terceiros sem autorização prévia. Ao dar seguimento à análise, o destinatário concorda em preservar o sigilo das informações nele contidas.</p>
      </div>
      <div style="margin-top:auto;">
        <div style="border-left:3px solid ${C.accent}; padding-left:20px;"><div style="font-size:20px; font-weight:800; letter-spacing:-0.01em;">Proteção não se compra por folheto. Se confere.</div></div>
      </div>
${rodape(n, total, doc.ano, '24px')}
    </div>
  </section>`

  const encerramento = `
  <section class="page">
    <div style="position:absolute; left:0; top:0; bottom:0; width:8px; background:${C.accent};"></div>
    <div style="height:100%; padding:64px 66px 48px; display:flex; flex-direction:column;">
      <div style="align-self:flex-start;">${logo(34)}</div>
      <div style="margin-top:auto; margin-bottom:auto;">
        <div style="width:56px; height:4px; background:${C.accent}; margin-bottom:28px;"></div>
        <h1 style="font-size:48px; line-height:1.08; font-weight:800; letter-spacing:-0.03em; margin:0 0 22px;">O próximo passo<br>é uma conversa<br>de 30 minutos.</h1>
        <p style="font-size:16.5px; line-height:1.7; color:#4A4740; margin:0 0 26px; max-width:540px;">Nela mostramos a plataforma funcionando, dimensionamos para o seu ambiente e, se fizer sentido, montamos uma avaliação sem custo com um grupo de máquinas suas.</p>
        <div style="display:flex; flex-direction:column; gap:10px; max-width:540px;">
          ${['Demonstração técnica da console, com o seu cenário', 'Dimensionamento e proposta comercial', 'Avaliação assistida no seu ambiente']
            .map(
              (t) =>
                `<div style="display:flex; gap:12px; align-items:flex-start;"><span style="color:${C.accent}; font-weight:800; font-size:16px; line-height:1.5;">·</span><span style="font-size:15px; color:#3A3833; font-weight:600;">${t}</span></div>`
            )
            .join('\n          ')}
        </div>
      </div>
      <div style="display:flex; align-items:flex-end; justify-content:space-between; padding-top:30px; border-top:1px solid ${C.line};">
        <div>
          <div style="font-size:11px; letter-spacing:0.1em; text-transform:uppercase; color:${C.accent}; font-weight:800; margin-bottom:6px;">Contato</div>
          <div style="font-size:14px; font-weight:700;">${escapeHtml(doc.vendedor.nome)}</div>
          <div style="font-size:13px; color:${C.muted};">${escapeHtml(doc.vendedor.email)} · ${escapeHtml(doc.vendedor.telefone || TELEFONE_DEFENZ)}</div>
        </div>
        <div style="text-align:right; font-size:12px; color:${C.faint}; font-weight:600;">www.defenz.com.br</div>
      </div>
    </div>
  </section>`

  const total = secoes.length + 3 // capa + abertura + seções + encerramento
  const paginasSecao = secoes
    .map((s, i) =>
      `
  <section class="page">
    <div style="height:100%; padding:56px 66px 44px; display:flex; flex-direction:column;">${cabecalho(doc)}
      <div style="margin-top:56px; flex:1; display:flex; flex-direction:column;">${s.corpo(`${pad2(i + 1)}.`)}
      </div>
${rodape(i + 3, total, doc.ano)}
    </div>
  </section>`
    )
    .join('\n')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Apresentação Defenz · ${empresa}</title>
<style>
  @font-face { font-family:'Manrope'; font-style:normal; font-weight:400 800; font-display:block; src:url(${MANROPE_LATIN_WOFF2}) format('woff2'); unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD; }
  @font-face { font-family:'Manrope'; font-style:normal; font-weight:400 800; font-display:block; src:url(${MANROPE_LATIN_EXT_WOFF2}) format('woff2'); unicode-range:U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF; }
  .dz-logo { display:inline-block; background-image:url(${LOGO_HORIZONTAL_INK_PNG}); background-repeat:no-repeat; background-position:left center; background-size:contain; }
  * { box-sizing:border-box; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
  html, body { margin:0; padding:0; background:${C.paper}; }
  body { font-family:'Manrope', sans-serif; color:${C.ink}; }
  p { text-wrap:pretty; }
  /* A4, o MESMO da proposta (decisão do Marcos, 21/08). Sem box-shadow: o Skia
     rasteriza sombra como retângulo sólido e vira borrão no papel. */
  .page { width:210mm; height:297mm; background:${C.paper}; color:${C.ink}; position:relative; overflow:hidden; break-inside:avoid; break-after:page; }
  .page:last-child { break-after:auto; }
  @page { size:210mm 297mm; margin:0; }
</style>
</head>
<body>
${capa}
${abertura(2, total)}
${paginasSecao}
${encerramento}
</body>
</html>`
}
