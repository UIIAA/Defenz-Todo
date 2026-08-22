/**
 * Os fatos sobre a marca e os resultados de teste independente.
 *
 * ⚠️ Tratado como a tabela de preços: valor + fonte + ano carimbados. Não é
 * invenção de LLM (invariante I9 continua de pé), mas ENVELHECE — em 2027 um
 * slide de credibilidade citando "Magic Quadrant 2025" fica velho.
 *
 * ⚠️ A15 (spec §7.3.2), decisão do Marcos em 21/08: **nenhum concorrente é
 * citado**, nem por insinuação. Afirma-se o resultado do Bitdefender com a
 * fonte; a comparação o leitor faz sozinho. Superlativo de mercado ("o menor
 * impacto", "melhor que o nativo") é comparação implícita e NÃO entra — há teste
 * que o contradiz. Ver `PROIBIDO` e o teste que o aplica.
 */

export const INSTITUCIONAL_VIGENCIA = '2026-01'

export const BITDEFENDER = {
  fundacao: 2001,
  origem: 1990,
  paises: '+170',
  especialistas: '~2.400',
  /** Pedido do Marcos em 22/08. Consta do material de parceiro do fabricante. */
  dispositivos: '+500 milhões',
  sedeGlobal: 'Bucareste, Romênia',
  sedeEUA: 'Santa Clara, Califórnia',
  fonte: 'Material de parceiro Bitdefender · via Defenz',
  vigenteDesde: '2026-01',
} as const

export type OrigemProva = 'independente' | 'fabricante'

export interface Prova {
  id: string
  /** A frase como vai ao papel. Resultado, nunca comparação. */
  texto: string
  fonte: string
  ano: number
  origem: OrigemProva
}

/**
 * ⚠️ "Melhor régua" (Marcos, 21/08) = escolher o teste mais favorável, o que é
 * legítimo porque a citação declara qual foi. NÃO é afirmar superlativo que a
 * outra régua contradiz: no AV-Comparatives (mar–jun/2025) o impacto de
 * performance do Bitdefender foi 32,8, atrás de vários. Por isso desempenho
 * entra pela nota do AV-TEST, e **sem** a palavra "mínimo".
 */
export const PROVAS: Prova[] = [
  {
    id: 'avtest-dez2025',
    texto:
      'Selo Top Product, com nota máxima em proteção (6/6) e em usabilidade (6/6), e 5,5 de 6 em desempenho.',
    fonte: 'AV-TEST · teste de endpoint corporativo Windows',
    ano: 2025,
    origem: 'independente',
  },
  {
    id: 'avcomparatives-protecao-2025',
    texto:
      '99,8% de proteção contra ameaças reais, com apenas 1 falso alarme em todo o teste.',
    fonte: 'AV-Comparatives · Business Security Test, março a junho',
    ano: 2025,
    origem: 'independente',
  },
  {
    id: 'avcomparatives-aprovado-2025',
    texto: 'Reconhecido como Approved Business Security Product.',
    fonte: 'AV-Comparatives',
    ano: 2025,
    origem: 'independente',
  },
  {
    id: 'avcomparatives-protecao-2025b',
    texto:
      'O mesmo patamar se repetiu no ciclo seguinte: 99,8% de proteção contra ameaças reais, com 2 falsos alarmes.',
    fonte: 'AV-Comparatives · Business Security Test, agosto a novembro',
    ano: 2025,
    origem: 'independente',
  },
  {
    id: 'avcomparatives-malware-2025',
    texto:
      '99,9% de proteção no teste de malware, com zero falsos alarmes em software corporativo de uso comum.',
    fonte: 'AV-Comparatives · Business Security Test, agosto a novembro',
    ano: 2025,
    origem: 'independente',
  },
  {
    id: 'avcomparatives-epr-2025',
    texto:
      'Certificação EPR: preveniu os 50 cenários de ataque da primeira fase do teste e alcançou 99,3% de detecção na fase seguinte.',
    fonte: 'AV-Comparatives · Endpoint Prevention and Response Test',
    ano: 2025,
    origem: 'independente',
  },
  {
    id: 'best-protection-6x',
    texto: 'Seis vezes vencedora do prêmio Best Protection.',
    fonte: 'AV-TEST · via material de parceiro Bitdefender',
    ano: 2026,
    origem: 'fabricante',
  },
  {
    id: 'ferrari',
    texto: 'Parceira oficial de cibersegurança da Scuderia Ferrari.',
    fonte: 'Material de parceiro Bitdefender',
    ano: 2026,
    origem: 'fabricante',
  },
  {
    id: 'decryptors',
    texto:
      'Disponibiliza gratuitamente ferramentas de descriptografia para vítimas de ransomware, em iniciativa internacional de combate ao crime cibernético.',
    fonte: 'Material de parceiro Bitdefender',
    ano: 2026,
    origem: 'fabricante',
  },
  {
    id: 'gartner-mq-2025',
    texto: 'Reconhecida como Visionária no Magic Quadrant de Plataformas de Proteção de Endpoint.',
    fonte: 'Gartner · via material de parceiro Bitdefender',
    ano: 2025,
    origem: 'fabricante',
  },
  {
    id: 'gartner-peer-2025',
    texto:
      'Customers’ Choice no Peer Insights, com nota 4,8 de 5 e 95% de disposição a recomendar.',
    fonte: 'Gartner Peer Insights · via material de parceiro Bitdefender',
    ano: 2025,
    origem: 'fabricante',
  },
  {
    id: 'ec3-2016',
    texto:
      'Parceira oficial do European Cybercrime Centre (EC3) desde 2016, com apoio em operações de desmantelamento de mercados da dark web.',
    fonte: 'Material de parceiro Bitdefender',
    ano: 2026,
    origem: 'fabricante',
  },
]

/**
 * Vocabulário barrado no texto FIXO do documento (A15 / spec §7.3.2).
 *
 * Duas famílias: nome de concorrente, e superlativo que implica comparação.
 * O teste varre os catálogos com isto — a decisão do Marcos vira regra
 * executável em vez de recomendação num documento que ninguém relê.
 */
export const PROIBIDO = {
  concorrentes: [
    'Microsoft Defender',
    'Windows Defender',
    'SentinelOne',
    'Sophos',
    'Kaspersky',
    'ESET',
    'CrowdStrike',
    'McAfee',
    'Trend Micro',
    'Norton',
  ],
  superlativos: [
    'menor impacto do mercado',
    'melhor do mercado',
    'melhor que',
    'superior aos concorrentes',
    'mais eficaz que',
    'impacto mínimo',
    'líder absoluto',
  ],
} as const
