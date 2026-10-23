// ─────────────────────────────────────────────────────────────────────────────
// As páginas de DLP GTB da apresentação — feature-apresentacao-dlp-gtb.md §5
//
// Modo A: duas páginas dentro do documento Bitdefender (`secoesDlpBitdefender`).
// Modo B: o documento só de DLP (`secoesDlp` + `MOLDURA_DLP`).
//
// ⚠️ Todo texto afirmativo sobre a GTB vem de `gtb-fatos.ts`, onde cada frase tem
// fonte. Aqui é só desenho. Se precisar escrever uma afirmação nova sobre o
// produto, ela vai para lá com a fonte — não para dentro de um template string.
// ─────────────────────────────────────────────────────────────────────────────

import {
  AGENTE_PLATAFORMA,
  DEFENZ_GTB,
  ENDPOINT_BUNDLE,
  FAQ_MICROSOFT,
  FRASE_ESCOPO,
  NOME_ENDPOINT,
  PLATAFORMA,
  PROVAS_GTB,
  SOBREPOSICAO_BITDEFENDER,
} from '../gtb-fatos'
import { DLP_FATOS } from '../dlp-fatos'
import { C, cartaoFato, escapeHtml, iconeCheck, linhaFonte, tituloSecao, type Secao } from './a4-base'
import type { ApresentacaoDocumento, Moldura } from './institucional-a4'

const CERTIFICADA = DEFENZ_GTB.certificada

const P = (texto: string, mb = 22) =>
  `<p style="font-size:16.4px; line-height:1.8; color:${C.body}; margin:0 0 ${mb}px; max-width:620px; text-align:justify;">${texto}</p>`

const CATEGORIAS_DADO: [string, string][] = [
  ['Dados pessoais', 'CPF, cadastros de clientes, informações de colaboradores.'],
  ['Dados financeiros', 'Contas, cartões, faturamento, folha de pagamento.'],
  ['Propriedade intelectual', 'Projetos, fórmulas, código-fonte, documentos internos.'],
  ['Credenciais e segredos', 'Senhas, chaves de acesso, certificados.'],
  ['Dados regulados', 'Informação sujeita a obrigação legal, contratual ou setorial.'],
  ['Dados estratégicos', 'Contratos, propostas, planos de negócio.'],
]

function gradeCategorias(): string {
  return `<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px 30px; max-width:640px;">
          ${CATEGORIAS_DADO.map(
            ([t, d]) => `<div style="border-top:1px solid ${C.line}; padding-top:9px;">
            <div style="font-size:14.8px; font-weight:800; color:${C.ink};">${t}</div>
            <p style="font-size:13.7px; line-height:1.55; color:${C.muted}; margin:3px 0 0;">${d}</p>
          </div>`
          ).join('\n          ')}
        </div>`
}

function listaCheck(itens: readonly string[]): string {
  return itens
    .map(
      (t) =>
        `<div style="display:flex; gap:10px; align-items:flex-start; margin-bottom:9px;"><span style="flex-shrink:0; margin-top:3px;">${iconeCheck(C.accent)}</span><span style="font-size:14.6px; line-height:1.55; color:${C.body};">${escapeHtml(t)}</span></div>`
    )
    .join('\n            ')
}

function listaTraco(itens: readonly string[]): string {
  return itens
    .map(
      (t) =>
        `<div style="display:flex; gap:10px; align-items:flex-start; margin-bottom:9px;"><span style="flex-shrink:0; color:${C.faint}; font-weight:800;">&mdash;</span><span style="font-size:14.6px; line-height:1.55; color:${C.body};">${escapeHtml(t)}</span></div>`
    )
    .join('\n            ')
}

function blocoFrase(texto: string): string {
  return `<div style="border-left:3px solid ${C.accent}; padding-left:22px; max-width:620px;"><div style="font-size:21px; font-weight:800; letter-spacing:-0.01em; line-height:1.4;">${escapeHtml(texto)}</div></div>`
}

/**
 * Antivírus × DLP.
 *
 * Modo A (`marca: true`): o cliente vai contratar o Bitdefender junto, então a
 * página descreve o Bitdefender, com fonte, e abre o tema com as categorias de dado.
 * Modo B (`marca: false`): o cliente tem OUTRO antivírus (crítica 🔴1). Nada de
 * marca: a descrição é da categoria, sem fonte de produto.
 */
function secaoAntivirusDlp(titulo: string, marca: boolean): Secao {
  const s = SOBREPOSICAO_BITDEFENDER
  return {
    titulo,
    corpo: (n) => `${tituloSecao(n, titulo)}
        ${P('O antivírus protege o computador contra o que entra: o arquivo malicioso, o ataque, o invasor. Vazamento é o problema oposto: o dado legítimo saindo pelo caminho errado, quase sempre pelas mãos de quem tem acesso a ele.')}
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:30px; max-width:640px; margin-bottom:24px;">
          <div>
            <div style="font-size:11.6px; letter-spacing:0.1em; text-transform:uppercase; color:${C.accent}; font-weight:800; margin-bottom:12px;">${marca ? 'O que o GravityZone já faz' : 'O que o antivírus já faz'}</div>
            ${listaCheck(marca ? s.jaFaz : s.jaFazGenerico)}
          </div>
          <div>
            <div style="font-size:11.6px; letter-spacing:0.1em; text-transform:uppercase; color:${C.muted}; font-weight:800; margin-bottom:12px;">${marca ? 'Onde ele para' : 'Onde ele costuma parar'}</div>
            ${listaTraco(s.naoFaz)}
          </div>
        </div>
        ${blocoFrase(s.frase)}
        ${marca ? linhaFonte(escapeHtml(s.fonte)) : ''}
        ${
          marca
            ? `<div style="margin-top:26px;">
          <div style="font-size:11.6px; letter-spacing:0.1em; text-transform:uppercase; color:${C.faint}; font-weight:800; margin-bottom:12px;">O que normalmente precisa de proteção</div>
          ${gradeCategorias()}
        </div>`
            : ''
        }`,
  }
}

/**
 * A página do produto. Em cima, só o que o bundle cotado faz (I-G4, crítica 🔴2);
 * embaixo, o que o agente também controla na plataforma, sob a frase de escopo.
 *
 * `modoA`: no documento Bitdefender o resto do texto promete avaliação no ambiente
 * do cliente — verdade para o Bitdefender, não para a GTB sem certificação (crítica 🟠6).
 */
function secaoEndpoint(modoA: boolean): Secao {
  const e = ENDPOINT_BUNDLE
  const a = AGENTE_PLATAFORMA
  const linha = ([t, d]: readonly [string, string]) => `<div style="border-top:1px solid ${C.line}; padding-top:9px;">
            <div style="font-size:14.8px; font-weight:800; color:${C.ink};">${escapeHtml(t)}</div>
            <p style="font-size:13.7px; line-height:1.55; color:${C.muted}; margin:3px 0 0;">${escapeHtml(d)}</p>
          </div>`
  return {
    titulo: NOME_ENDPOINT,
    corpo: (n) => `${tituloSecao(n, NOME_ENDPOINT)}
        ${P(`O componente de estação de trabalho da plataforma de segurança de dados da GTB Technologies. Fica em cada computador, com agente para ${e.plataformas}. ${escapeHtml(e.offline)}`)}
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px 30px; max-width:640px;">
          <div style="grid-column:1 / -1; font-size:11.6px; letter-spacing:0.1em; text-transform:uppercase; color:${C.accent}; font-weight:800;">O que ele faz</div>
          ${e.recursos.map(linha).join('\n          ')}
        </div>
        <div style="margin-top:22px; border:1px solid ${C.line}; background:${C.surface}; padding:16px 20px; max-width:640px;">
          <div style="font-size:11.6px; letter-spacing:0.1em; text-transform:uppercase; color:${C.muted}; font-weight:800; margin-bottom:10px;">Na plataforma, o agente também controla</div>
          <p style="font-size:14.2px; line-height:1.6; color:${C.body}; margin:0;">${a.controles.map(([t, d]) => `<strong>${escapeHtml(t)}</strong>: ${escapeHtml(d.charAt(0).toLowerCase() + d.slice(1))}`).join('<br>')}</p>
          <p style="font-size:13.4px; line-height:1.55; color:${C.muted}; margin:10px 0 0;">Diante de uma ação de risco, a política pode ${a.acoes.slice(0, -1).join(', ')} ou ${a.acoes[a.acoes.length - 1]}. ${escapeHtml(FRASE_ESCOPO)}</p>
        </div>
        <div style="margin-top:auto; border-top:1px solid ${C.line}; padding-top:14px; max-width:640px;">
          ${modoA && !CERTIFICADA ? `<p style="font-size:14.2px; line-height:1.6; color:${C.body}; margin:0 0 6px;">Na proteção de dados, o próximo passo é o levantamento dos dados sensíveis e uma demonstração da plataforma GTB.</p>` : ''}
          ${linhaFonte(escapeHtml(`${e.fonte}; ${a.fonte}`))}
        </div>`,
  }
}

/** Modo A — as duas páginas que entram no documento Bitdefender. */
export function secoesDlpBitdefender(): Secao[] {
  return [secaoAntivirusDlp('Antivírus protege a máquina. DLP protege o dado.', true), secaoEndpoint(true)]
}

// ── Modo B ───────────────────────────────────────────────────────────────────


export const MOLDURA_DLP: Moldura = {
  rotuloCabecalho: 'Proteção de dados GTB com a Defenz',
  capaTitulo: 'Saber o que<br>está saindo.<br>Antes que<br>saia.',
  capaSubtitulo: (setor) =>
    `Prevenção de vazamento de dados com a plataforma GTB${setor ? `, aplicada ao contexto de ${setor}` : ''}, com implantação e suporte da Defenz no Brasil.`,
  aberturaRoteiro: () =>
    'Este documento foi montado para ser lido sem ninguém do lado explicando. Ele responde, nesta ordem: por que proteger o dado é diferente de proteger o computador, o que está em jogo, quem é a fabricante, o que a plataforma faz e quem cuida dela no Brasil.',
  aberturaFecho: 'Proteção não se compra por folheto.<br>Se confere.',
  encerramentoTitulo: 'O próximo passo<br>é uma conversa<br>de 30 minutos.',
  encerramentoTexto:
    'Nela entendemos onde estão os seus dados sensíveis e por onde eles circulam, mostramos a plataforma funcionando e dimensionamos a proposta para o seu ambiente.',
  // ⚠️ I-G5: sem certificação Tier 1/Tier 2 a Defenz não conduz avaliação da GTB.
  encerramentoPassos: [
    'Levantamento dos dados sensíveis e dos canais de saída',
    'Demonstração da plataforma com cenários do seu negócio',
    'Dimensionamento e proposta comercial',
    ...(CERTIFICADA ? ['Avaliação assistida no seu ambiente'] : []),
  ],
}

function secaoPerimetro(): Secao {
  const titulo = 'O dado saiu do perímetro'
  return {
    titulo,
    corpo: (n) => `${tituloSecao(n, titulo)}
        ${P('Firewall, antivírus e controle de acesso protegem o ambiente. O dado circula por dentro e por fora dele: no notebook em casa, no e-mail, no pendrive, na pasta compartilhada, na nuvem e, agora, na janela de uma IA generativa.')}
        ${P('Proteger informação começa por saber qual informação importa, e quanto custaria se ela saísse.', 28)}
        <div style="flex:1;">${gradeCategorias()}</div>
        <div style="margin-top:auto; padding-top:24px;">${blocoFrase('Qual seria o impacto financeiro, operacional, legal ou de reputação se este dado fosse exposto?')}</div>`,
  }
}

function secaoEmJogo(doc: ApresentacaoDocumento): Secao {
  const titulo = 'O que está em jogo'
  return {
    titulo,
    corpo: (n) => `${tituloSecao(n, titulo)}
        ${P('A lei já obriga a saber o que vazou, e rápido. O custo de não saber está medido. Cada número traz a fonte e o ano — confira todos.', 26)}
        <div style="flex:1; display:flex; flex-direction:column; justify-content:space-between; max-width:640px;">
          ${doc.fatos
            // O shadow AI tem página própria (IA generativa); aqui ele se repetiria.
            .filter((f) => f.id !== 'D-IBM-SHADOW-AI')
            .slice(0, 5)
            .map(cartaoFato)
            .join('\n          ')}
        </div>`,
  }
}

function secaoGtb(): Secao {
  const titulo = 'Quem é a GTB'
  return {
    titulo,
    corpo: (n) => `${tituloSecao(n, titulo)}
        ${P('A GTB Technologies é uma fabricante dedicada a um único problema: impedir que informação sensível saia de onde deveria ficar. A plataforma descobre, classifica, monitora e protege o dado durante todo o ciclo de vida, guardado, em uso ou em trânsito.')}
        ${P('No Brasil, a GTB é distribuída pela SecuriSoft, com suporte técnico em português. A Defenz é parceira de canal da GTB.', 28)}
        <div style="flex:1; display:flex; flex-direction:column; gap:20px; max-width:640px;">
          ${PROVAS_GTB.map(
            (p) => `<div style="display:flex; gap:14px; align-items:flex-start;">
            <span style="flex-shrink:0; margin-top:6px; width:9px; height:9px; border-radius:50%; background:${p.origem === 'avaliador' ? C.accent : C.faint};"></span>
            <div>
              <p style="font-size:15.4px; line-height:1.6; color:${C.body}; margin:0; font-weight:600;">${escapeHtml(p.texto)}</p>
              ${linhaFonte(`${escapeHtml(p.fonte)} · ${p.data}${p.origem === 'fabricante' ? ' · dado do fabricante' : ''}`)}
            </div>
          </div>`
          ).join('\n          ')}
        </div>`,
  }
}

function secaoPlataforma(): Secao {
  const titulo = 'Uma plataforma, camadas de proteção'
  const caixa = ([nome, estado, desc]: readonly [string, string, string], foco: boolean) => `<div style="flex:1; border:${foco ? `2px solid ${C.accent}` : `1px solid ${C.line}`}; background:${foco ? '#FFFFFF' : C.surface}; padding:16px 14px; display:flex; flex-direction:column;">
            ${foco ? `<div style="font-size:10px; letter-spacing:0.1em; text-transform:uppercase; color:${C.accent}; font-weight:800; margin-bottom:6px;">Foco deste documento</div>` : ''}
            <div style="font-size:14.4px; font-weight:800; color:${C.ink}; line-height:1.3;">${escapeHtml(nome)}</div>
            <div style="font-size:11.6px; letter-spacing:0.08em; text-transform:uppercase; color:${foco ? C.accent : C.muted}; font-weight:800; margin-top:6px;">${escapeHtml(estado)}</div>
            <p style="font-size:13.4px; line-height:1.55; color:${C.muted}; margin:8px 0 0;">${escapeHtml(desc)}</p>
          </div>`
  return {
    titulo,
    corpo: (n) => `${tituloSecao(n, titulo)}
        ${P('O dado existe em três estados, e cada um pede um controle diferente. A GTB cobre os três com componentes que se somam, todos sob a mesma gestão.', 28)}
        <div style="max-width:640px;">
          <div style="border:1px solid ${C.ink}; background:${C.ink}; color:${C.paper}; padding:16px 20px; text-align:center;">
            <div style="font-size:15.6px; font-weight:800;">Console central</div>
            <div style="font-size:13.2px; color:#D9D4CA; margin-top:4px;">${escapeHtml(PLATAFORMA.console)}</div>
          </div>
          <div style="display:flex; justify-content:space-around; height:22px;">
            ${[0, 1, 2].map(() => `<div style="width:2px; background:${C.line};"></div>`).join('')}
          </div>
          <div style="display:flex; gap:14px; align-items:stretch;">
            ${PLATAFORMA.camadas.map((c, i) => caixa(c, i === 0)).join('\n            ')}
          </div>
        </div>
        <div style="margin-top:auto; border-top:1px solid ${C.line}; padding-top:14px; max-width:640px;">
          <p style="font-size:14.2px; line-height:1.6; color:${C.body}; margin:0;">A arquitetura é modular: a empresa começa pela camada que resolve o risco mais urgente, quase sempre a estação de trabalho, e acrescenta as demais quando fizer sentido. ${escapeHtml(FRASE_ESCOPO)}</p>
          ${linhaFonte(escapeHtml(PLATAFORMA.fonte))}
        </div>`,
  }
}

function secaoIdentificacao(): Secao {
  const titulo = 'Como a plataforma reconhece o dado'
  return {
    titulo,
    corpo: (n) => `${tituloSecao(n, titulo)}
        ${P('Bloquear tudo paralisa a empresa; bloquear só por palavra-chave barra o que não devia e deixa passar o que importa. O trabalho de um DLP é reconhecer o dado sensível, mesmo quando ele muda de forma.', 26)}
        <div style="flex:1; display:flex; flex-direction:column; gap:18px; max-width:640px;">
          ${PLATAFORMA.identificacao
            .map(
              ([t, d]) => `<div style="border-left:3px solid ${C.accent}; padding-left:18px;">
            <div style="font-size:16.4px; font-weight:800; color:${C.ink};">${escapeHtml(t)}</div>
            <p style="font-size:14.6px; line-height:1.6; color:${C.muted}; margin:4px 0 0;">${escapeHtml(d)}</p>
          </div>`
            )
            .join('\n          ')}
        </div>
        <div style="margin-top:auto; border-top:1px solid ${C.line}; padding-top:14px; max-width:640px;">
          <p style="font-size:14.2px; line-height:1.6; color:${C.body}; margin:0;">${escapeHtml(FRASE_ESCOPO)}</p>
          ${linhaFonte(escapeHtml(PLATAFORMA.fonte))}
        </div>`,
  }
}

function secaoIa(doc: ApresentacaoDocumento): Secao {
  const titulo = 'Dados e IA generativa'
  const fatoIa = doc.fatos.find((f) => f.id === 'D-IBM-SHADOW-AI')
  return {
    titulo,
    corpo: (n) => `${tituloSecao(n, titulo)}
        ${P('Copiar um contrato para pedir um resumo, colar uma planilha de clientes para montar um gráfico, anexar um projeto para revisar o texto. Nenhuma dessas ações parece vazamento para quem faz, e todas tiram o dado da empresa.')}
        ${P('Proibir a IA tende a empurrar o uso para fora da vista da empresa. A alternativa é permitir o uso e controlar o que vai junto.', 26)}
        <div style="flex:1; max-width:640px;">
          <div style="border:1px solid ${C.line}; background:${C.surface}; padding:22px 24px;">
            <div style="font-size:11.6px; letter-spacing:0.1em; text-transform:uppercase; color:${C.accent}; font-weight:800; margin-bottom:10px;">O que a plataforma faz</div>
            <p style="font-size:15.6px; line-height:1.7; color:${C.ink}; margin:0; font-weight:600;">${escapeHtml(PLATAFORMA.ia)}</p>
          </div>
          ${fatoIa ? `<div style="margin-top:28px;">${cartaoFato(fatoIa)}</div>` : ''}
        </div>
        <div style="margin-top:auto; border-top:1px solid ${C.line}; padding-top:14px; max-width:640px;">
          <p style="font-size:14.2px; line-height:1.6; color:${C.body}; margin:0;">${escapeHtml(FRASE_ESCOPO)}</p>
          ${linhaFonte(escapeHtml(PLATAFORMA.fonte))}
        </div>`,
  }
}

function secaoDefenz(): Secao {
  const titulo = 'Quem é a Defenz'
  const itens: [string, string][] = [
    ['Implantação e suporte no Brasil', 'Atendimento direto, em português, por quem conhece o seu ambiente. Sem fila internacional e sem barreira de idioma.'],
    ['Política antes de bloqueio', 'Começamos registrando, para conhecer o fluxo real dos seus dados, e só depois ligamos os bloqueios. DLP mal configurado para a operação; bem configurado, ninguém percebe.'],
    ['Um interlocutor, do começo ao fim', 'A mesma equipe conduz o levantamento, a implantação e o suporte, sem transferência para outra área no meio do caminho.'],
    ['Segurança do endpoint ao dado', 'A Defenz também implanta e opera antivírus e resposta a incidentes. A conversa sobre o dado não começa do zero.'],
  ]
  // ⚠️ I-G5: este item só existe com a certificação GTB. Hoje, `false`.
  if (CERTIFICADA) itens.unshift(['Especialistas certificados', 'A equipe é certificada pela GTB nas trilhas comercial e técnica.'])
  return {
    titulo,
    corpo: (n) => `${tituloSecao(n, titulo)}
        ${P('A Defenz é a operação brasileira que implanta e sustenta a plataforma. A tecnologia é global; quem atende é local, e é a mesma equipe do começo ao fim.', 26)}
        <div style="flex:1; display:flex; flex-direction:column; gap:26px; max-width:620px;">
          ${itens
            .map(
              ([t, d]) => `<div style="border-left:3px solid ${C.accent}; padding-left:18px;">
            <div style="font-size:17.9px; font-weight:800; letter-spacing:-0.01em;">${t}</div>
            <p style="font-size:15.4px; line-height:1.65; color:${C.muted}; margin:4px 0 0;">${d}</p>
          </div>`
            )
            .join('\n          ')}
        </div>
        <div style="margin-top:auto; border-top:1px solid ${C.line}; padding-top:18px;">
          <p style="font-size:15.8px; line-height:1.7; color:${C.body}; margin:0; font-style:italic;">Seu pós-venda é com a gente. Direto, eficiente, resolutivo.</p>
        </div>`,
  }
}

const FAQ_DLP: { p: string; r: string }[] = [
  {
    p: 'Funciona com o funcionário fora da empresa?',
    r: 'Sim. As políticas ficam no próprio computador e continuam valendo em casa, em viagem ou em qualquer rede, sem depender de conexão com o servidor da empresa.',
  },
  {
    p: 'Vai atrapalhar o trabalho das pessoas?',
    r: 'A resposta é proporcional ao risco: a política pode só registrar, alertar o usuário ou bloquear. O usual é começar registrando, para conhecer o fluxo real dos dados, e bloquear apenas o que de fato não pode sair.',
  },
  {
    p: 'Funciona em Mac e Linux?',
    r: 'Sim. O GTB Endpoint Protector tem agente para Windows, macOS e Linux.',
  },
  {
    p: 'Isso resolve a LGPD?',
    r: 'Nenhuma ferramenta, sozinha, deixa uma empresa em conformidade. O que o DLP entrega é a parte que depende de tecnologia: saber onde está o dado pessoal, controlar por onde ele sai e registrar o que aconteceu, que é a evidência pedida numa auditoria ou numa comunicação de incidente.',
  },
  FAQ_MICROSOFT,
  {
    p: 'Quem me atende?',
    r: 'A Defenz, do levantamento ao suporte do dia a dia: implantação, configuração das políticas, ajustes e renovação. Por trás, o suporte técnico do distribuidor da GTB no Brasil, em português.',
  },
]

function secaoFaq(): Secao {
  const titulo = 'Perguntas frequentes'
  return {
    titulo,
    corpo: (n) => `${tituloSecao(n, titulo)}
        <div style="flex:1; display:flex; flex-direction:column; gap:18px; max-width:640px; margin-top:4px;">
          ${FAQ_DLP.map(
            (f) => `<div>
            <div style="font-size:15.6px; font-weight:800; color:${C.ink};">${escapeHtml(f.p)}</div>
            <p style="font-size:14.4px; line-height:1.6; color:${C.body}; margin:5px 0 0; text-align:justify;">${escapeHtml(f.r)}</p>
          </div>`
          ).join('\n          ')}
        </div>
        ${linhaFonte(escapeHtml(FAQ_MICROSOFT.fonte))}`,
  }
}

/** Modo B — o documento só de DLP, em ORDEM. */
export function secoesDlp(doc: ApresentacaoDocumento): Secao[] {
  // ⚠️ 2ª crítica: o template confiava em `doc.fatos`. Com `fatosParaSetor` no
  // lugar de `dlpFatosParaSetor`, o R$ 7,19 mi (só fonte secundária no recorte
  // DLP) ia ao PDF sem ninguém perceber. Fato fora do catálogo DLP = erro.
  const estranho = doc.fatos.find((f) => !DLP_FATOS.some((d) => d.id === f.id))
  if (estranho) throw new Error(`Fato fora do catálogo DLP no documento só-DLP: ${estranho.id}`)
  return [
    secaoPerimetro(),
    secaoEmJogo(doc),
    secaoGtb(),
    secaoPlataforma(),
    secaoEndpoint(false),
    secaoIdentificacao(),
    secaoIa(doc),
    secaoAntivirusDlp('Já tenho antivírus. Por que DLP?', false),
    secaoDefenz(),
    secaoFaq(),
  ]
}
