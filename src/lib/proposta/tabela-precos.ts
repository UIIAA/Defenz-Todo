// ─────────────────────────────────────────────────────────────────────────────
// TABELA DE PREÇO — Bitdefender / GravityZone (feature-portal-proposta.md §6.1)
//
// PROCEDÊNCIA CARIMBADA. Transcrita do "Tabela Bundle Pública BRL - Dez.2026.pdf"
// (SecuriSoft, distribuidora exclusiva Bitdefender), corpo do documento datado
// 29/11/2024, "cliente final até 999 licenças", "substitui as tabelas vigentes".
//
// ⚠️ DISCREPÂNCIA DE DATA EM ABERTO (spec R3 / Anexo A): o NOME do arquivo diz
// "Dez.2026", a capa diz 2024 e o corpo diz 29/11/2024. Carimbamos o que está
// ESCRITO no documento até o Marcos confirmar qual tabela vale. Preço vencido em
// proposta é erro caro — esta tabela precisa de dono e prazo, como um POP.
//
// ⚠️ Os números são PREÇO POR LICENÇA PELO PERÍODO INTEIRO (não por mês).
// A coluna "unitário/mês" do documento é DERIVADA (ver calculo.ts) — é
// exatamente onde nasceu o erro do ÷48 (spec §2.1).
// ─────────────────────────────────────────────────────────────────────────────

export const PLANOS = ['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE'] as const
export type PlanoId = (typeof PLANOS)[number]

/** Nome cheio do produto, como aparece na tabela pública e deve aparecer no PDF. */
export const PLANO_NOME_PRODUTO: Record<PlanoId, string> = {
  BUSINESS_SECURITY: 'GRAVITYZONE BUSINESS SECURITY BRAZILIAN EDITION',
  PREMIUM: 'GRAVITYZONE PREMIUM BRAZILIAN EDITION',
  ENTERPRISE: 'GRAVITYZONE ENTERPRISE BRAZILIAN EDITION',
}

/** Rótulo curto, para a UI e para o título da página de investimento. */
export const PLANO_LABEL: Record<PlanoId, string> = {
  BUSINESS_SECURITY: 'Business Security',
  PREMIUM: 'Premium',
  ENTERPRISE: 'Enterprise',
}

export const FAIXAS = [
  '5-14',
  '15-24',
  '25-49',
  '50-99',
  '100-149',
  '150-249',
  '250-499',
  '500-999',
] as const
export type Faixa = (typeof FAIXAS)[number]

/**
 * As três colunas da página de investimento.
 *
 * ⚠️ `anos` e `mesesCobertura` NÃO são a mesma coisa, e é aí que mora tudo.
 * `anos` é a coluna da TABELA DE PREÇO (quanto se paga). `mesesCobertura` é
 * quanto tempo o cliente fica protegido — o que divide o preço para achar o
 * unitário mensal.
 *
 * Na terceira coluna a Defenz vende **36+12**: o cliente paga o preço de 3 anos
 * e recebe 48 meses de cobertura. Por isso o unitário/mês dela divide por 48.
 *
 * Isto reinterpreta o "erro do ÷48" da spec §2.1: os documentos antigos
 * dividiam por 48 e **estavam certos na conta** — o defeito era o RÓTULO, que
 * dizia "36 meses" enquanto o preço embutia os 12 meses de bônus. Documento que
 * promete 36 e cobra por 48 se contradiz sozinho. Aqui o rótulo diz 36+12.
 */
export const VIGENCIAS = [
  { anos: 1, mesesCobertura: 12, bonusMeses: 0, rotulo: '12 meses' },
  { anos: 2, mesesCobertura: 24, bonusMeses: 0, rotulo: '24 meses' },
  { anos: 3, mesesCobertura: 48, bonusMeses: 12, rotulo: '36+12 meses' },
] as const
export type Vigencia = (typeof VIGENCIAS)[number]
export type AnosTabela = Vigencia['anos']

export const QUANTIDADE_MIN = 5
export const QUANTIDADE_MAX = 999

/** Limites inclusivos de cada faixa, na mesma ordem de `FAIXAS`. */
export const FAIXA_LIMITES: ReadonlyArray<{ faixa: Faixa; de: number; ate: number }> = [
  { faixa: '5-14', de: 5, ate: 14 },
  { faixa: '15-24', de: 15, ate: 24 },
  { faixa: '25-49', de: 25, ate: 49 },
  { faixa: '50-99', de: 50, ate: 99 },
  { faixa: '100-149', de: 100, ate: 149 },
  { faixa: '150-249', de: 150, ate: 249 },
  { faixa: '250-499', de: 250, ate: 499 },
  { faixa: '500-999', de: 500, ate: 999 },
]

type LinhaFaixa = Record<Faixa, readonly [number, number, number]> // [1 ano, 2 anos, 3 anos]

export const TABELA: {
  readonly fonte: string
  readonly vigenteDesde: string
  readonly ateLicencas: number
  readonly precos: Record<PlanoId, LinhaFaixa>
} = {
  fonte: 'Tabela Bundle Pública BRL · SecuriSoft · substitui as tabelas vigentes',
  vigenteDesde: '2024-11-29',
  ateLicencas: QUANTIDADE_MAX,
  precos: {
    BUSINESS_SECURITY: {
      '5-14': [84.46, 135.14, 211.16],
      '15-24': [72.99, 116.79, 182.48],
      '25-49': [68.79, 110.06, 171.97],
      '50-99': [58.85, 94.16, 147.13],
      '100-149': [51.6, 82.55, 128.99],
      '150-249': [47.01, 75.21, 117.52],
      '250-499': [43.57, 69.71, 108.92],
      '500-999': [40.9, 65.43, 102.24],
    },
    PREMIUM: {
      '5-14': [99.37, 158.99, 248.42],
      '15-24': [85.87, 137.4, 214.68],
      '25-49': [80.93, 129.48, 202.32],
      '50-99': [69.24, 110.78, 173.09],
      '100-149': [60.7, 97.12, 151.75],
      '150-249': [55.3, 88.49, 138.26],
      '250-499': [51.26, 82.01, 128.14],
      '500-999': [48.11, 76.98, 120.28],
    },
    ENTERPRISE: {
      '5-14': [178.05, 284.88, 445.13],
      '15-24': [160.06, 256.09, 400.15],
      '25-49': [142.52, 228.04, 356.31],
      '50-99': [129.04, 206.46, 322.6],
      '100-149': [116.0, 185.61, 290.01],
      '150-249': [104.32, 166.9, 260.79],
      '250-499': [84.53, 135.24, 211.32],
      '500-999': [75.08, 120.13, 187.71],
    },
  },
} as const
