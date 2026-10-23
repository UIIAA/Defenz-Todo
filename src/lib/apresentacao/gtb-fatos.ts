/**
 * O que a apresentação pode afirmar sobre a GTB e o DLP — feature-apresentacao-dlp-gtb.md.
 *
 * ⚠️ Mesmo tratamento de `institucional-fatos.ts`: valor + fonte + data carimbados.
 * Cada prova aqui foi conferida na fonte PRIMÁRIA em 23/10/2026 (insumo:
 * docs/pedidos/2026-10-23-dlp-gtb-pesquisa.md). O deck da GTB trazia mais seis
 * alegações; nenhuma delas se sustentou e todas estão em `PROIBIDO_GTB`, com teste.
 */

export const GTB_VIGENCIA = '2026-10'

/**
 * O nome comercial, sempre completo (I-G1).
 *
 * ⚠️ "Endpoint Protector" sozinho é produto da Netwrix (ex-CoSoSys). O cliente que
 * pesquisar o nome solto cai no concorrente. O teste varre o HTML atrás disso.
 */
export const NOME_ENDPOINT = 'GTB Endpoint Protector'

/**
 * A situação da Defenz no canal GTB (I-G5).
 *
 * ⚠️ Enquanto `certificada` for `false`, nada no documento associa "certificado" à
 * GTB nem oferece avaliação conduzida pela Defenz — a POC da GTB exige profissional
 * Tier 1 (comercial) e Tier 2 (técnico). Acordo de canais assinado; certificação não
 * (Marcos, 23/10/2026).
 */
export const DEFENZ_GTB = {
  acordoDeCanais: true,
  certificada: false,
} as const

export interface ProvaGtb {
  id: string
  texto: string
  fonte: string
  /** O ano do prêmio, ou "consultado em mmm/aaaa" quando a fonte é uma página viva. */
  data: string
  origem: 'fabricante' | 'avaliador'
}

/**
 * ⚠️ Gartner: o deck da GTB diz 4,6 com 100 avaliações; a página do Gartner
 * (arquivo de abr/2026) mostrava 4,7 com 97. Fica o que a fonte primária mostrou,
 * com a data. Conferir ao vivo antes de cada deploy que mexa aqui.
 */
export const PROVAS_GTB: ProvaGtb[] = [
  {
    id: 'fundacao',
    texto: 'Fundada em 2004, com foco exclusivo em segurança de dados e prevenção de vazamentos.',
    fonte: 'GTB Technologies',
    data: '2026',
    origem: 'fabricante',
  },
  {
    id: 'selecthub',
    texto: 'Primeira colocada no ranking de soluções de DLP da SelectHub, com nota de analista 88 de 100.',
    fonte: 'SelectHub · ranking de Data Loss Prevention',
    data: 'consultado em out/2026',
    origem: 'avaliador',
  },
  {
    id: 'gartner-peer',
    texto: 'Nota 4,7 de 5 no Gartner Peer Insights, mercado de Data Loss Prevention, com 97 avaliações de usuários.',
    fonte: 'Gartner Peer Insights',
    data: 'consultado em abr/2026',
    origem: 'avaliador',
  },
  {
    id: 'corporate-vision',
    texto: 'Reconhecida no Corporate Vision Security Awards, na categoria de segurança de dados.',
    fonte: 'Corporate Vision · Security Awards',
    data: '2024',
    origem: 'avaliador',
  },
]

/**
 * O que o bundle cotado do GTB Endpoint Protector faz — e só isto vai à página
 * dele como recurso do produto (I-G4).
 *
 * ⚠️ Crítica 🔴2 (23/10): a página do agente no site da GTB prova que um recurso
 * EXISTE, não que vem no bundle de US$ 48. Por isso aqui ficam só as seis
 * funcionalidades que a SecuriSoft descreveu para o item `DLP_GTB` do catálogo.
 * O resto do que o agente faz está em `AGENTE_PLATAFORMA`, sob `FRASE_ESCOPO`.
 */
export const ENDPOINT_BUNDLE = {
  recursos: [
    // ⚠️ 2ª crítica: "pelo conteúdo do arquivo" ia além do "USB & Device Controls" da SecuriSoft.
    ['USB e mídias removíveis', 'Libera, bloqueia ou restringe o uso por usuário e por dispositivo.'],
    ['Descoberta na estação', 'Encontra os dados sensíveis guardados em cada computador.'],
    ['Descoberta no Outlook', 'Localiza informação sensível guardada nas caixas e arquivos do Outlook.'],
    ['Classificação e marca d’água', 'Rotula os documentos pela sensibilidade e aplica marca d’água a eles.'],
    ['Controle de aplicações', 'Define quais aplicações podem tocar em dado sensível.'],
    ['Auditoria de compartilhamentos', 'Registra quem acessou e moveu o quê nas pastas compartilhadas.'],
  ],
  /** Propriedades do agente, não recursos à parte: o mesmo agente em qualquer contratação. */
  plataformas: 'Windows, macOS e Linux',
  offline: 'As políticas continuam valendo com o computador fora da rede da empresa.',
  fonte: 'SecuriSoft · descrição do GTB Endpoint Protector (14/09/2026)',
} as const

/**
 * O que o agente de estação da GTB também controla, demonstrado à Defenz (D4) e
 * publicado pela GTB, mas sem confirmação de que vem no bundle (pergunta P1).
 * Quando a SecuriSoft confirmar, o item sobe para `ENDPOINT_BUNDLE.recursos`.
 */
export const AGENTE_PLATAFORMA = {
  controles: [
    ['Impressão', 'Controla o que é impresso, inclusive com a máquina fora da rede da empresa.'],
    ['Área de transferência', 'Controla o copiar e colar de conteúdo sensível entre aplicações.'],
    ['Aplicações e nuvem', 'Controla o envio por serviços como Google Drive, Dropbox, Teams e Slack.'],
  ],
  acoes: ['registrar', 'alertar', 'bloquear', 'criptografar'],
  fonte: 'GTB Technologies · página do agente de endpoint (out/2026)',
} as const

/**
 * O que é da PLATAFORMA GTB e não está confirmado no bundle cotado (I-G4).
 *
 * ⚠️ A GTB demonstrou todos estes controles à Defenz (D4), então eles existem. O
 * que ainda não se sabe é se vêm no bundle de US$ 48 (pergunta P1 à SecuriSoft).
 * Por isso aparecem só em página de plataforma, sob `FRASE_ESCOPO`. Quando a
 * SecuriSoft confirmar um item, ele MUDA DE LISTA — sem reescrever texto.
 */
export const PLATAFORMA = {
  camadas: [
    ['GTB Endpoint Protector', 'Dados em uso', 'Controla como usuários, aplicações e dispositivos usam a informação.'],
    ['GTB Inspector', 'Dados em movimento', 'Inspeciona e protege o que trafega por e-mail, web, rede e nuvem.'],
    ['GTB Discovery', 'Dados em repouso', 'Localiza e classifica informação sensível em servidores, repositórios e bancos de dados.'],
  ],
  console: 'Uma console central reúne políticas, incidentes, alertas e relatórios de todas as camadas.',
  identificacao: [
    ['Impressão digital do documento', 'Reconhece o conteúdo de um documento confidencial mesmo quando só um trecho dele foi copiado para outro arquivo.'],
    ['Correspondência exata', 'Reconhece registros vindos de bases estruturadas, como cadastros de clientes, sem depender de padrão genérico.'],
    ['Leitura de imagens', 'Encontra dado sensível em imagens, prints e documentos digitalizados.'],
    ['Classificação automática', 'Aplica o rótulo de sensibilidade de acordo com o conteúdo e a política da empresa.'],
    ['Análise de contexto', 'Cruza o conteúdo com usuário, aplicação, dispositivo, canal e destino antes de decidir.'],
  ],
  ia: 'Monitora o que é digitado, colado ou enviado em arquivo para aplicações de IA generativa, autorizadas ou não, e pode registrar, alertar ou bloquear conforme a política.',
  fonte: 'GTB Technologies · Enterprise Data Security Suite, datasheet distribuído pela SecuriSoft (out/2026)',
} as const

/** A frase que acompanha toda página de plataforma (I-G4). */
export const FRASE_ESCOPO =
  'Os componentes e recursos incluídos em cada contratação são definidos na proposta comercial.'

/**
 * Onde o antivírus para e o DLP começa — afirmação sobre o PRODUTO Bitdefender,
 * por isso com fonte própria.
 */
export const SOBREPOSICAO_BITDEFENDER = {
  jaFaz: [
    'Controle de dispositivos: libera ou bloqueia o pendrive, a porta, o periférico.',
    'Controle de conteúdo: bloqueia sites por categoria e barra textos definidos pelo administrador no tráfego web e no e-mail de saída.',
  ],
  naoFaz: [
    'Não reconhece um documento confidencial pelo conteúdo.',
    'Não classifica a informação pela sensibilidade.',
    'Não localiza onde os dados sensíveis estão guardados.',
    'Não lê dado sensível dentro de imagens.',
  ],
  frase: 'O antivírus controla por onde o dado sai. O DLP identifica o que está saindo.',
  /**
   * Crítica 🔴1: no modo B o cliente tem OUTRO antivírus. A página não pode
   * descrever o Bitdefender como se fosse o dele — vai a versão de categoria.
   */
  jaFazGenerico: [
    'Bloqueia o arquivo malicioso, o ataque e o invasor.',
    'Em geral, controla dispositivos: libera ou bloqueia o pendrive, a porta, o periférico.',
  ],
  fonte: 'Bitdefender · comparativo de planos GravityZone e documentação do Content Control (out/2026)',
} as const

/**
 * D-A1 (Marcos, 23/10): o FAQ "já tenho Microsoft 365" nomeia o Purview.
 *
 * ⚠️ EXCEÇÃO DECLARADA à A15, estreita como a de 22/08: só fatos da documentação
 * da própria Microsoft, sem "melhor que", sem preço. É a ÚNICA menção a outro
 * fabricante de DLP no documento; o teste de `PROIBIDO_GTB` permite "Purview" só aqui.
 */
export const FAQ_MICROSOFT = {
  p: 'Já tenho Microsoft 365. Não está incluído?',
  r: 'Depende da licença. Pela documentação da Microsoft, o DLP de estação do Purview está incluído nos planos E5; nos demais, depende de licença adicional. Ele cobre Windows e macOS, não Linux, e cada computador precisa ser cadastrado na plataforma. Vale levantar o que a sua licença cobre antes de decidir: em muitos ambientes as duas coisas convivem.',
  fonte: 'Microsoft Learn · Endpoint data loss prevention; Microsoft Purview licensing guidance (out/2026)',
} as const

/**
 * Vocabulário barrado no documento DLP (I-G3). Cada termo é uma alegação do deck
 * da GTB que NÃO se sustentou na fonte primária — motivo ao lado.
 *
 * ⚠️ A varredura é do conteúdo GTB (o modo B inteiro e as páginas DLP do modo A),
 * NÃO do documento Bitdefender inteiro: lá "Magic Quadrant" é prova legítima.
 */
export const PROIBIDO_GTB: { termo: string; motivo: string }[] = [
  { termo: 'Global 100', motivo: 'sem página primária do prêmio, só o release da GTB' },
  { termo: 'Enterprise Security Magazine', motivo: 'é um perfil feito de entrevista com a própria GTB' },
  { termo: 'falso positivo', motivo: 'nenhum teste independente sustenta a alegação' },
  { termo: 'falsos positivos', motivo: 'idem' },
  { termo: 'patentead', motivo: 'a única patente localizada expirou em out/2024' },
  { termo: 'Lab Approved', motivo: 'selo de 2007, versão 12 do Inspector' },
  { termo: 'Magic Quadrant', motivo: 'o MQ de DLP foi descontinuado; a GTB não tem posição vigente' },
  { termo: 'mais confiável', motivo: 'superlativo; o prêmio confirmado não sustenta' },
  { termo: '20 anos', motivo: 'usar o ano de fundação (2004), autodeclarado' },
  { termo: 'Netwrix', motivo: 'A15: concorrente não é nomeado' },
  { termo: 'Forcepoint', motivo: 'A15' },
  { termo: 'Symantec', motivo: 'A15' },
  { termo: 'garante a conformidade', motivo: 'nenhuma ferramenta garante conformidade com a LGPD' },
  { termo: 'garante conformidade', motivo: 'idem' },
]
