// ─────────────────────────────────────────────────────────────────────────────
// CÂMBIO — feature-catalogo-opcoes.md §4.1
//
// PROCEDÊNCIA CARIMBADA, como a tabela de preços: a cotação é constante
// versionada, não consulta ao Banco Central na hora de gerar (decisão D3 do
// Marcos, 17/09). Consultar ao vivo faria o preço mudar entre a tela de revisão
// e o PDF, e deixaria a emissão de documento comercial dependendo de uma API de
// terceiro estar no ar.
//
// ⚠️ Preço convertido SEM a cotação impressa ao lado não é auditável (I-N3):
// quem receber o documento não consegue refazer a conta. Todo template que
// imprime valor convertido imprime também `CAMBIO.data` e `CAMBIO.usdBrl`.
//
// Para atualizar: trocar os três campos juntos, com a PTAX de venda do dia.
// ─────────────────────────────────────────────────────────────────────────────

export const CAMBIO = {
  /** PTAX de venda do dia declarado em `data`. */
  usdBrl: 5.1521,
  fonte: 'PTAX de venda · Banco Central do Brasil',
  data: '2026-09-17',
} as const

/**
 * Converte dólar em reais e **arredonda uma vez**, aqui.
 *
 * ⚠️ Crítica C1: `48 × 5,1521 = 247,3008`. Se o arredondamento ficasse só na
 * formatação, o documento imprimiria unitário R$ 247,30 e total R$ 98.920,32
 * para 400 licenças — 32 centavos a mais do que `unitário × quantidade`. O
 * cliente que multiplica a linha encontra outro número e a proposta se
 * contradiz sozinha.
 *
 * Arredondando na entrada, o valor em reais passa a ser o preço do item, e a
 * regra da casa ("arredonda só na formatação") segue valendo de aqui em diante.
 */
export function converterUSD(valorUSD: number, cotacao: number = CAMBIO.usdBrl): number {
  return Math.round(valorUSD * cotacao * 100) / 100
}

/**
 * A linha de procedência impressa embaixo do preço convertido.
 *
 * ⚠️ Recebe a cotação USADA NAQUELA emissão, não a de hoje. Uma proposta de
 * setembro rebaixada em dezembro tem de imprimir a cotação de setembro, que é a
 * que explica o valor em reais congelado no snapshot (achado 2 da crítica).
 */
export function notaCambio(
  valorUSD: number,
  cambio: { usdBrl: number; data: string } = CAMBIO
): string {
  const usd = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(valorUSD)
  const cotacao = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 4 }).format(
    cambio.usdBrl
  )
  const [ano, mes, dia] = cambio.data.split('-')
  return `Convertido de US$ ${usd} por licença pela PTAX de venda de ${dia}/${mes}/${ano} (US$ 1,00 = R$ ${cotacao}). Por ter origem em dólar, o valor pode ser revisto conforme a variação cambial até a data do faturamento.`
}
