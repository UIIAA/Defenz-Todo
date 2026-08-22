/**
 * O comparativo GravityZone, transcrito do documento da Defenz.
 *
 * Fonte: `defenz_gravityzone_comparativo.pdf` · Defenz Cybersecurity · lido em
 * 20/08/2026 em ADMINISTRATIVO/ESTRATEGICO_VENDAS/APRESENTAÇÕES/APRESENTAÇÃO_TÉCNICA.
 *
 * ⚠️ DESVIO DELIBERADO DO PDF (22/08). O documento transcrito traz uma única linha
 * "XEDR", disponível só no Enterprise. O Marcos corrigiu: **o Premium já tem uma camada
 * de EDR**, e o que o Enterprise acrescenta é **XDR com sensores adicionais**. Quem
 * conhece o licenciamento é ele, não o PDF — que nesse ponto está defasado. Se o
 * comparativo for reemitido pela Defenz, é essa linha que precisa mudar lá também.
 *
 * ⚠️ Este arquivo é a ÚNICA fonte do que o produto faz. A IA da apresentação não
 * descreve solução: ela ESCOLHE um `FuncionalidadeId` desta lista (spec §6.3), e o
 * texto que vai ao PDF sai daqui, renderizado por código. É o "LLM interpreta, JS
 * calcula" aplicado a texto.
 */

export const NIVEIS = ['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE'] as const
export type NivelId = (typeof NIVEIS)[number]

export const NIVEL_NOME: Record<NivelId, string> = {
  BUSINESS_SECURITY: 'Business Security',
  PREMIUM: 'Business Security Premium',
  ENTERPRISE: 'Business Security Enterprise',
}

/** Ordem de cobertura. Índice maior = cobre tudo que o menor cobre. */
const ORDEM: NivelId[] = ['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE']

export const FUNCIONALIDADES = [
  'ANTIMALWARE',
  'CONTROLE_AVANCADO_AMEACAS',
  'ANTIEXPLOIT_AVANCADO',
  'FIREWALL',
  'PROTECAO_REDE',
  'CONTROLE_DISPOSITIVOS',
  'GERENCIAMENTO_RISCOS',
  'MITIGACAO_RANSOMWARE',
  'ATAQUE_SEM_ARQUIVO',
  'HYPERDETECT',
  'ANALISADOR_SANDBOX',
  'EDR',
  'XDR_SENSORES',
] as const
export type FuncionalidadeId = (typeof FUNCIONALIDADES)[number]

export interface Funcionalidade {
  id: FuncionalidadeId
  nome: string
  /** Transcrita do PDF. Não reescrever "para ficar melhor": é conteúdo técnico aprovado. */
  descricao: string
  /** Nível a partir do qual está disponível. */
  aPartirDe: NivelId
}

export const COMPARATIVO: Funcionalidade[] = [
  {
    id: 'ANTIMALWARE',
    nome: 'Antimalware',
    descricao:
      'Proteção baseada em verificação de assinaturas e análise heurística contra vírus, worms, trojans, spyware, adware, keyloggers e rootkits. Combina a varredura tradicional com o motor heurístico B-HAVE, que executa arquivos suspeitos em ambiente virtual para avaliar o comportamento antes de permitir a execução.',
    aPartirDe: 'BUSINESS_SECURITY',
  },
  {
    id: 'CONTROLE_AVANCADO_AMEACAS',
    nome: 'Controle Avançado de Ameaças',
    descricao:
      'Monitora continuamente os processos em execução e classifica comportamentos suspeitos, como tentativas de disfarçar processos, executar código no espaço de memória de outro processo, replicar-se ou ocultar-se. Cada comportamento suspeito eleva a pontuação do processo até acionar um alerta automático.',
    aPartirDe: 'BUSINESS_SECURITY',
  },
  {
    id: 'ANTIEXPLOIT_AVANCADO',
    nome: 'Antiexploit Avançado',
    descricao:
      'Tecnologia proativa baseada em machine learning que bloqueia ataques zero-day realizados por exploits evasivos. Detecta vulnerabilidades de corrupção de memória em tempo real, protegendo navegadores, Microsoft Office, Adobe Reader e outros aplicativos críticos.',
    aPartirDe: 'BUSINESS_SECURITY',
  },
  {
    id: 'FIREWALL',
    nome: 'Firewall',
    descricao:
      'Controla o acesso dos aplicativos à rede e à internet por meio de um banco de dados abrangente de aplicativos conhecidos. Oferece proteção contra varreduras de portas, restringe compartilhamento de conexão e alerta sobre novos dispositivos em redes Wi-Fi.',
    aPartirDe: 'BUSINESS_SECURITY',
  },
  {
    id: 'PROTECAO_REDE',
    nome: 'Proteção de Rede',
    descricao:
      'Reforça políticas de tráfego, acesso web e controle de aplicativos. Permite bloquear ou liberar categorias de sites e URLs, definir permissões de uso de aplicativos e conta com módulo antiphishing integrado. Detecta técnicas de ataque de rede como força bruta e roubo de credenciais.',
    aPartirDe: 'BUSINESS_SECURITY',
  },
  {
    id: 'CONTROLE_DISPOSITIVOS',
    nome: 'Controle de Dispositivos',
    descricao:
      'Previne vazamento de dados e infecções por malware via dispositivos externos (USB, Bluetooth, CD/DVD, impressoras), aplicando regras de bloqueio e exceções por política de segurança diretamente nos endpoints.',
    aPartirDe: 'BUSINESS_SECURITY',
  },
  {
    id: 'GERENCIAMENTO_RISCOS',
    nome: 'Gerenciamento de Riscos',
    descricao:
      'Identifica, avalia e corrige vulnerabilidades dos dispositivos Windows por meio de verificações sob demanda ou agendadas. Oferece painel consolidado do risco da rede, correção automática e recomendações de mitigação.',
    aPartirDe: 'BUSINESS_SECURITY',
  },
  {
    id: 'MITIGACAO_RANSOMWARE',
    nome: 'Mitigação de Ransomware',
    descricao:
      'Detecta tentativas anormais de criptografia e bloqueia o processo automaticamente, independentemente de o ransomware ser conhecido ou novo. Recupera os arquivos afetados a partir de cópias de backup, restaurando-os ao local original.',
    aPartirDe: 'BUSINESS_SECURITY',
  },
  {
    id: 'ATAQUE_SEM_ARQUIVO',
    nome: 'Proteção contra Ataque sem Arquivo',
    descricao:
      'Detecta e bloqueia malwares fileless na pré-execução: encerra PowerShell com linhas de comando maliciosas, bloqueia tráfego suspeito, analisa buffers de memória antes da injeção de código e impede processos de injeção.',
    aPartirDe: 'PREMIUM',
  },
  {
    id: 'HYPERDETECT',
    nome: 'HyperDetect',
    descricao:
      'Camada com modelos de machine learning projetada para detectar ataques avançados ainda na pré-execução: ameaças zero-day, APTs, malware ofuscado, ataques fileless, roubo de credenciais, ataques direcionados, exploits e ransomware.',
    aPartirDe: 'PREMIUM',
  },
  {
    id: 'ANALISADOR_SANDBOX',
    nome: 'Analisador Sandbox',
    descricao:
      'Análise automática e profunda de arquivos suspeitos não identificados pelo antimalware convencional. Executa payloads em ambiente virtual isolado hospedado pela Bitdefender, analisa o comportamento e relata qualquer alteração indicativa de intenção maliciosa. Opera em modo de monitoramento ou de bloqueio.',
    aPartirDe: 'PREMIUM',
  },
  {
    id: 'EDR',
    nome: 'EDR · Detecção e resposta no endpoint',
    descricao:
      'Registra e correlaciona o que acontece dentro do endpoint para identificar ataques em andamento, com visualização do incidente e ações de resposta. É o que permite entender COMO o ataque entrou, e não apenas que ele foi bloqueado.',
    aPartirDe: 'PREMIUM',
  },
  {
    id: 'XDR_SENSORES',
    nome: 'XDR + sensores adicionais',
    descricao:
      'Estende a detecção para além do endpoint, correlacionando sinais de sensores adicionais em uma única investigação. Um mesmo incidente passa a ser visto de vários ângulos ao mesmo tempo, o que encurta o tempo entre detectar e conter.',
    aPartirDe: 'ENTERPRISE',
  },
]

export function funcionalidade(id: FuncionalidadeId): Funcionalidade {
  const f = COMPARATIVO.find((x) => x.id === id)
  // Enum fechado + Zod na borda: chegar aqui com id inválido é bug, não entrada.
  if (!f) throw new Error(`Funcionalidade desconhecida: ${id}`)
  return f
}

export function disponivelEm(id: FuncionalidadeId, nivel: NivelId): boolean {
  return ORDEM.indexOf(nivel) >= ORDEM.indexOf(funcionalidade(id).aPartirDe)
}

/**
 * O nível recomendado é o MENOR que cobre todas as necessidades encontradas.
 *
 * Sem funcionalidade nenhuma (pesquisa vazia — spec §6.7), recomenda a entrada:
 * não é papel desta função empurrar plano na ausência de argumento.
 */
export function recomendarNivel(ids: FuncionalidadeId[]): NivelId {
  return ids.reduce<NivelId>((maior, id) => {
    const exigido = funcionalidade(id).aPartirDe
    return ORDEM.indexOf(exigido) > ORDEM.indexOf(maior) ? exigido : maior
  }, 'BUSINESS_SECURITY')
}
