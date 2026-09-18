// ─────────────────────────────────────────────────────────────────────────────
// COMPLEMENTOS (ADD-ONS) — tabela e descrições
//
// PROCEDÊNCIA CARIMBADA, como a tabela de preços:
//  · Patch Management e Criptografia de Disco — tabelas enviadas pelo Marcos em
//    02/09/2026, no formato da SecuriSoft: valor de tabela + DESCONTO COMPETITIVO
//    de 50%. Válidas para 5 a 999 licenças.
//  · PHASR e sensores XDR — valores passados pelo Marcos em 02/09/2026 e por ele
//    confirmados como **valor final** (não levam o desconto competitivo).
//
// ⚠️ COBERTURA, 18/09: PHASR e os quatro sensores XDR passaram a ser vendidos
// SÓ por 12 MESES (Marcos, 18/09/2026) — como o DLP, renovam todo ano, e por isso
// saem do total somado. Patch e Criptografia seguem com 12/24/36.
//
// ⚠️ COBERTURA: o complemento cobre 12, 24 ou 36 meses — **sem o bônus de 12**
// que o GravityZone principal tem na coluna 36+12 (decisão do Marcos, 02/09).
// Isto NÃO é detalhe de conta: numa proposta de 36+12, o produto principal cobre
// 48 meses e o complemento cobre 36. O documento tem de dizer isso, senão promete
// cobertura que não existe — a mesma classe do rótulo "36 meses" que dividia por 48.
//
// ⚠️ As descrições são resumo do material OFICIAL da Bitdefender, com a fonte ao
// lado. Não são texto de marketing escrito aqui, e não passam por LLM.
// ─────────────────────────────────────────────────────────────────────────────

import { converterUSD } from './cambio'

export const COMPLEMENTO_IDS = [
  'PATCH_MANAGEMENT',
  'CRIPTOGRAFIA_DISCO',
  'PHASR',
  'XDR_PRODUCTIVITY',
  'XDR_NETWORK',
  'XDR_CLOUD',
  'XDR_IDENTITY',
  'DLP_GTB',
  'MDR_GERENCIADO',
] as const
export type ComplementoId = (typeof COMPLEMENTO_IDS)[number]

/**
 * Famílias, na ordem em que saem na tela e no documento.
 *
 * `DLP` e `SERVICO` entraram em 17/09 (feature-catalogo-opcoes). A lista mora
 * aqui porque a tela usava um array escrito à mão — item de família nova ficava
 * invisível no formulário sem ninguém perceber.
 */
export const FAMILIAS = ['GRAVITYZONE', 'XDR', 'DLP', 'SERVICO'] as const
export type Familia = (typeof FAMILIAS)[number]

export const FAMILIA_LABEL: Record<Familia, string> = {
  GRAVITYZONE: 'GravityZone',
  XDR: 'Sensores XDR',
  DLP: 'Prevenção contra perda de dados',
  SERVICO: 'Serviços gerenciados',
}

export interface Complemento {
  id: ComplementoId
  /** Nome como sai impresso, no padrão da tabela da SecuriSoft. */
  nome: string
  /**
   * Preço de tabela por licença, pelo período inteiro, uma entrada por coluna
   * de `mesesCobertura` — nos sete itens originais, `[12, 24, 36]` meses.
   *
   * `null` = **sob consulta**: o item tem escopo, não tem preço, e não entra em
   * soma nenhuma (I-N2). É o caso do MDR, que é negociado caso a caso.
   */
  precoTabela: readonly number[] | null
  /**
   * Meses cobertos por coluna. Ausente = `[12, 24, 36]`.
   *
   * Um item de **uma coluna só** (o DLP, vendido por 12 meses com renovação
   * anual) vale para as três colunas da proposta, sempre pelo mesmo preço de um
   * ano — e o documento imprime uma coluna, não três iguais (crítica C3).
   */
  mesesCobertura?: readonly number[]
  /** Item sem preço: escopo descrito, investimento sob consulta. */
  sobConsulta?: boolean
  /** Moeda de origem. Ausente = BRL. `USD` obriga a nota de câmbio (I-N3). */
  moeda?: 'BRL' | 'USD'
  /** Preço de origem em dólar, antes da conversão. Só serve para a procedência. */
  precoOrigemUSD?: number
  /** O que o serviço NÃO cobre. Hoje só o MDR usa. */
  naoIncluso?: readonly string[]
  /**
   * `true` quando o valor JÁ É o final — não existe tabela cheia por trás dele.
   *
   * ⚠️ Decisão D6 (17/09): item líquido aceita desconto, mas o documento imprime
   * só o preço final. Imprimir "Valor unitário R$ 126,00 · Desconto 20%"
   * inventaria uma tabela que a SecuriSoft não pratica (achado 8 da crítica).
   */
  precoLiquido?: boolean
  /**
   * `true` quando o item NÃO entra na linha "Investimento total" do resumo.
   *
   * ⚠️ Decisão D5 (17/09): o DLP cobre 12 meses e renova todo ano. Somá-lo uma
   * vez dentro de uma coluna de 48 meses subestimaria o custo em duas
   * renovações e chamaria isso de investimento total — a mesma família do
   * rótulo "36 meses" que dividia por 48. Ele aparece com preço, em linha
   * informativa, fora do total.
   */
  foraDoTotal?: boolean
  /**
   * Desconto competitivo padrão. 0,5 = 50%.
   *
   * ⚠️ Patch e Criptografia vêm da tabela COM a linha de 50%; PHASR e sensores o
   * Marcos passou já como valor final. Guardar o desconto por produto (em vez de
   * um número global) é o que impede aplicar 50% em cima de quem já está líquido.
   */
  descontoPadrao: number
  /** Resumo do material oficial. */
  descricao: string
  /** De onde saiu a descrição — vai impressa em letra miúda no documento. */
  fonte: string
  /** Agrupador para o documento não virar uma pilha de blocos soltos. */
  familia: Familia
}

const FONTE_PHASR = 'Bitdefender · página oficial do GravityZone PHASR, lida em 02/09/2026'
const FONTE_PATCH =
  'Bitdefender · página oficial do GravityZone Patch Management (add-ons), lida em 02/09/2026'
const FONTE_XDR = 'Bitdefender · TechZone e página oficial do GravityZone XDR, lidas em 02/09/2026'

/** Preço de canal do DLP, por licença / 12 meses (Marcos, 17/09/2026). */
export const PRECO_DLP_USD = 48

export const COMPLEMENTOS_BITDEFENDER: readonly Complemento[] = [
  {
    id: 'PATCH_MANAGEMENT',
    nome: 'Bitdefender GravityZone Patch Management',
    precoTabela: [59.9, 119.8, 179.7],
    descontoPadrao: 0.5,
    descricao:
      'Mantém sistemas e aplicativos atualizados automaticamente, fechando a porta que a maior parte dos ataques usa: a falha já conhecida e ainda não corrigida. Cobre Windows (desktop e servidor), macOS e Linux, além de uma lista extensa de aplicativos de terceiros. Faz varredura agendada ou sob demanda de patches de segurança e não-segurança, aplica correção automática ou manual, permite adiar o reinício das máquinas que exigem reboot e mostra em relatório o que está instalado, o que falta e o que falhou.',
    fonte: FONTE_PATCH,
    familia: 'GRAVITYZONE',
  },
  {
    id: 'CRIPTOGRAFIA_DISCO',
    nome: 'Bitdefender GravityZone Criptografia de Disco',
    precoTabela: [30, 60, 90],
    descontoPadrao: 0.5,
    descricao:
      'Criptografa o disco inteiro das estações e notebooks usando os mecanismos nativos do próprio sistema — BitLocker no Windows e FileVault no macOS —, gerenciados de forma central pelo GravityZone, com guarda e recuperação das chaves pelo console. Notebook perdido ou roubado deixa de ser vazamento de dados: sem a chave, o conteúdo não é legível.',
    fonte:
      'Bitdefender · documentação oficial do GravityZone Full Disk Encryption, lida em 02/09/2026',
    familia: 'GRAVITYZONE',
  },
  {
    id: 'PHASR',
    nome: 'Bitdefender GravityZone PHASR',
    precoTabela: [126],
    mesesCobertura: [12],
    foraDoTotal: true,
    descontoPadrao: 0,
    precoLiquido: true,
    descricao:
      'Reduz a superfície de ataque de forma dinâmica: monta um perfil de comportamento por usuário e máquina e restringe as ações que fogem do que aquela pessoa realmente precisa fazer. O bloqueio é no nível da AÇÃO, não do programa — permite o PowerShell e bloqueia o comando criptografado dentro dele, sem tirar a ferramenta de quem trabalha com ela. É a resposta aos ataques que usam binários legítimos do próprio sistema (living off the land), a mineradores, a ferramentas de administração remota e de adulteração.',
    fonte: FONTE_PHASR,
    familia: 'GRAVITYZONE',
  },
  {
    id: 'XDR_PRODUCTIVITY',
    nome: 'Bitdefender XDR Sensor · Productivity',
    precoTabela: [126],
    mesesCobertura: [12],
    foraDoTotal: true,
    descontoPadrao: 0,
    precoLiquido: true,
    descricao:
      'Leva ao XDR o que acontece no Microsoft 365 e no Google Workspace: phishing, tentativas de força bruta e comportamento fora do padrão nas contas de e-mail e colaboração — onde a maior parte dos incidentes começa.',
    fonte: FONTE_XDR,
    familia: 'XDR',
  },
  {
    id: 'XDR_NETWORK',
    nome: 'Bitdefender XDR Sensor · Network',
    precoTabela: [126],
    mesesCobertura: [12],
    foraDoTotal: true,
    descontoPadrao: 0,
    precoLiquido: true,
    descricao:
      'Escuta o tráfego da rede em busca de sinal de ataque e entrega ao XDR o que o endpoint sozinho não vê: movimento lateral entre máquinas, exfiltração de dados, varredura de portas e força bruta vinda da rede.',
    fonte: FONTE_XDR,
    familia: 'XDR',
  },
  {
    id: 'XDR_CLOUD',
    nome: 'Bitdefender XDR Sensor · Cloud',
    precoTabela: [126],
    mesesCobertura: [12],
    foraDoTotal: true,
    descontoPadrao: 0,
    precoLiquido: true,
    descricao:
      'Coleta eventos de AWS, Microsoft Azure e Google Cloud, estabelece a linha de base do que é normal naquele ambiente e aponta quando a atividade foge dela.',
    fonte: FONTE_XDR,
    familia: 'XDR',
  },
  {
    id: 'XDR_IDENTITY',
    nome: 'Bitdefender XDR Sensor · Identity',
    precoTabela: [126],
    mesesCobertura: [12],
    foraDoTotal: true,
    descontoPadrao: 0,
    precoLiquido: true,
    descricao:
      'Dá visibilidade sobre risco de identidade no Active Directory, no Entra ID (Azure AD) e em provedores de identidade em nuvem: credencial comprometida, anomalia de comportamento e movimento lateral, com resposta em um clique.',
    fonte: FONTE_XDR,
    familia: 'XDR',
  },
]

const FONTE_DLP =
  'GTB Technologies · descrição do bundle GTB Endpoint Protector, repassada pela SecuriSoft em 14/09/2026'
const FONTE_MDR =
  'Defenz · escopo do serviço gerenciado (proposta-servico-gerenciado.md §7, projeto Defenz_MDR)'

/**
 * Os itens que não são módulo do GravityZone entram aqui embaixo, na mesma
 * lista, de propósito: a tela e a apresentação varrem o catálogo inteiro, então
 * quem entra aqui aparece nos dois lugares sem precisar de mais nada.
 */
const OPCOES_NAO_BITDEFENDER: readonly Complemento[] = [
  {
    id: 'DLP_GTB',
    nome: 'GTB Endpoint Protector (DLP)',
    // US$ 48,00 por licença / 12 meses, convertido UMA vez (crítica C1).
    precoTabela: [converterUSD(PRECO_DLP_USD)],
    mesesCobertura: [12],
    moeda: 'USD',
    precoOrigemUSD: PRECO_DLP_USD,
    descontoPadrao: 0,
    precoLiquido: true,
    foraDoTotal: true,
    descricao:
      'Solução integrada para descoberta, classificação e proteção de dados sensíveis nos endpoints. Localiza informações armazenadas em computadores e no Microsoft Outlook, controla dispositivos USB e mídias removíveis, gerencia aplicações e audita arquivos compartilhados. Inclui classificação e watermarking, ampliando a visibilidade e o controle sobre o uso das informações pelos usuários. Com gestão centralizada e políticas adaptáveis ao contexto da organização, protege contra vazamentos acidentais ou intencionais em ambientes locais, remotos ou híbridos. Acompanha o console central on-premises, sem custo adicional. Funcionalidades: Local PC Discovery, MS Outlook Discovery, USB & Device Controls, Classification & Watermarking, Application Controls e File Share Audit.',
    fonte: FONTE_DLP,
    familia: 'DLP',
  },
  {
    id: 'MDR_GERENCIADO',
    nome: 'Defenz MDR · Serviço gerenciado',
    // ⚠️ SEM PREÇO de propósito (decisão D1, 17/09): não existe tabela do MDR.
    // Os valores reais são negociados por cliente. Inventar faixa seria preço
    // falso num documento assinável.
    precoTabela: null,
    sobConsulta: true,
    descontoPadrao: 0,
    // ⚠️ Redação defensável (I-N6): a plataforma vigia continuamente, o humano
    // responde em dia útil. Não prometer tempo real, isolamento automático nem
    // bloqueio de indicador por cliente — os três não funcionam hoje, e está
    // registrado na memória do projeto Defenz_MDR.
    descricao:
      'O antivírus é o alarme; o serviço gerenciado é quem atende quando ele dispara. A Defenz opera e ajusta o console, trata as detecções e executa a contenção conforme as regras acordadas, faz varreduras programadas e gestão de atualizações de sistema e aplicativos, libera sites, aplicativos e dispositivos mediante solicitação, ajusta política por grupo e apoia a instalação do agente. A plataforma monitora de forma contínua; a resposta humana acontece em dia útil, das 9h às 18h. O acompanhamento é feito por relatório quinzenal, relatório de incidente grave, canal de atendimento e ata dos encontros.',
    naoIncluso: [
      'Licenciamento do antivírus, que é contratado à parte',
      'Suporte de TI geral e atendimento presencial',
      'Ação física em equipamento e recuperação de dados',
      'Resposta a incidente já consumado antes do início do contrato',
      'Servidores, nuvem e dispositivos móveis, que dependem de escopo específico',
    ],
    fonte: FONTE_MDR,
    familia: 'SERVICO',
  },
]

export const COMPLEMENTOS: readonly Complemento[] = [
  ...COMPLEMENTOS_BITDEFENDER,
  ...OPCOES_NAO_BITDEFENDER,
]

export function complemento(id: ComplementoId): Complemento {
  const achado = COMPLEMENTOS.find((c) => c.id === id)
  if (!achado) throw new Error(`Complemento desconhecido: ${id}`)
  return achado
}

/**
 * Meses de cobertura de um complemento, por coluna.
 *
 * ⚠️ Sem bônus, de propósito: 36 é 36. Quem dá 12 meses de brinde é só o
 * GravityZone principal (`VIGENCIAS` em `tabela-precos.ts`).
 */
export const COMPLEMENTO_MESES = [12, 24, 36] as const

/** Os meses de um item: os dele, ou o padrão de 12/24/36. */
export function mesesDoComplemento(c: Complemento): readonly number[] {
  return c.mesesCobertura ?? COMPLEMENTO_MESES
}
