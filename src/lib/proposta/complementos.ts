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
// ⚠️ COBERTURA: o complemento cobre 12, 24 ou 36 meses — **sem o bônus de 12**
// que o GravityZone principal tem na coluna 36+12 (decisão do Marcos, 02/09).
// Isto NÃO é detalhe de conta: numa proposta de 36+12, o produto principal cobre
// 48 meses e o complemento cobre 36. O documento tem de dizer isso, senão promete
// cobertura que não existe — a mesma classe do rótulo "36 meses" que dividia por 48.
//
// ⚠️ As descrições são resumo do material OFICIAL da Bitdefender, com a fonte ao
// lado. Não são texto de marketing escrito aqui, e não passam por LLM.
// ─────────────────────────────────────────────────────────────────────────────

export const COMPLEMENTO_IDS = [
  'PATCH_MANAGEMENT',
  'CRIPTOGRAFIA_DISCO',
  'PHASR',
  'XDR_PRODUCTIVITY',
  'XDR_NETWORK',
  'XDR_CLOUD',
  'XDR_IDENTITY',
] as const
export type ComplementoId = (typeof COMPLEMENTO_IDS)[number]

export interface Complemento {
  id: ComplementoId
  /** Nome como sai impresso, no padrão da tabela da SecuriSoft. */
  nome: string
  /** Preço de tabela por licença, pelo período inteiro: [12, 24, 36] meses. */
  precoTabela: readonly [number, number, number]
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
  /** Agrupador para o documento não virar sete blocos soltos. */
  familia: 'GRAVITYZONE' | 'XDR'
}

const FONTE_PHASR = 'Bitdefender · página oficial do GravityZone PHASR, lida em 02/09/2026'
const FONTE_PATCH =
  'Bitdefender · página oficial do GravityZone Patch Management (add-ons), lida em 02/09/2026'
const FONTE_XDR = 'Bitdefender · TechZone e página oficial do GravityZone XDR, lidas em 02/09/2026'

export const COMPLEMENTOS: readonly Complemento[] = [
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
    precoTabela: [126, 252, 378],
    descontoPadrao: 0,
    descricao:
      'Reduz a superfície de ataque de forma dinâmica: monta um perfil de comportamento por usuário e máquina e restringe as ações que fogem do que aquela pessoa realmente precisa fazer. O bloqueio é no nível da AÇÃO, não do programa — permite o PowerShell e bloqueia o comando criptografado dentro dele, sem tirar a ferramenta de quem trabalha com ela. É a resposta aos ataques que usam binários legítimos do próprio sistema (living off the land), a mineradores, a ferramentas de administração remota e de adulteração.',
    fonte: FONTE_PHASR,
    familia: 'GRAVITYZONE',
  },
  {
    id: 'XDR_PRODUCTIVITY',
    nome: 'Bitdefender XDR Sensor · Productivity',
    precoTabela: [126, 252, 378],
    descontoPadrao: 0,
    descricao:
      'Leva ao XDR o que acontece no Microsoft 365 e no Google Workspace: phishing, tentativas de força bruta e comportamento fora do padrão nas contas de e-mail e colaboração — onde a maior parte dos incidentes começa.',
    fonte: FONTE_XDR,
    familia: 'XDR',
  },
  {
    id: 'XDR_NETWORK',
    nome: 'Bitdefender XDR Sensor · Network',
    precoTabela: [126, 252, 378],
    descontoPadrao: 0,
    descricao:
      'Escuta o tráfego da rede em busca de sinal de ataque e entrega ao XDR o que o endpoint sozinho não vê: movimento lateral entre máquinas, exfiltração de dados, varredura de portas e força bruta vinda da rede.',
    fonte: FONTE_XDR,
    familia: 'XDR',
  },
  {
    id: 'XDR_CLOUD',
    nome: 'Bitdefender XDR Sensor · Cloud',
    precoTabela: [126, 252, 378],
    descontoPadrao: 0,
    descricao:
      'Coleta eventos de AWS, Microsoft Azure e Google Cloud, estabelece a linha de base do que é normal naquele ambiente e aponta quando a atividade foge dela.',
    fonte: FONTE_XDR,
    familia: 'XDR',
  },
  {
    id: 'XDR_IDENTITY',
    nome: 'Bitdefender XDR Sensor · Identity',
    precoTabela: [126, 252, 378],
    descontoPadrao: 0,
    descricao:
      'Dá visibilidade sobre risco de identidade no Active Directory, no Entra ID (Azure AD) e em provedores de identidade em nuvem: credencial comprometida, anomalia de comportamento e movimento lateral, com resposta em um clique.',
    fonte: FONTE_XDR,
    familia: 'XDR',
  },
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
