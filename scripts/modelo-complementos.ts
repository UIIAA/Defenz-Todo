/**
 * Gera o MODELO da proposta com complementos, para o Marcos validar antes de ir
 * a produção.
 *
 *   npx tsx scripts/modelo-complementos.ts [saida.pdf]
 *
 * Cenário do pedido dele (02/09): Premium + Patch Management + Criptografia de
 * Disco, valores separados por complemento e o total somado na última página.
 * Acrescentei o PHASR para o modelo mostrar também um complemento SEM desconto.
 */
import { writeFileSync } from 'fs'
import { calcularInvestimento } from '../src/lib/proposta/calculo'
import { calcularComplementos, consolidar } from '../src/lib/proposta/calculo-complementos'
import { renderPropostaHtml } from '../src/lib/proposta/templates/endpoints-a4'
import { renderPdf } from '../src/lib/proposta/pdf'

async function main() {
  const saida = process.argv[2] ?? 'modelo-proposta-complementos.pdf'
  const quantidade = 30

  const investimento = calcularInvestimento({
    quantidade,
    planos: ['PREMIUM'],
    ajustePercent: 0,
  })
  const complementos = calcularComplementos(
    ['PATCH_MANAGEMENT', 'CRIPTOGRAFIA_DISCO', 'PHASR'],
    quantidade
  )
  const consolidado = consolidar(investimento, 0, complementos)

  const html = renderPropostaHtml({
    codigo: 'DFZ-2026-XXXXX',
    clienteNome: 'Cliente de Exemplo',
    empresaNome: 'Empresa Modelo Ltda',
    dataFormatada: '02/09/2026',
    ano: 2026,
    vendedor: { nome: 'Gustavo Figueira', email: 'gustavo@defenz.com.br' },
    investimento,
    complementos,
    consolidado,
  })

  const pdf = await renderPdf(html)
  writeFileSync(saida, pdf)

  console.log(`→ ${saida} (${(pdf.length / 1024).toFixed(0)} KB)`)
  console.log('\nConsolidado:')
  for (const l of consolidado.linhas) {
    console.log(
      `  ${l.rotulo.padEnd(14)} principal ${l.mesesPrincipal}m R$ ${l.totalPrincipal.toFixed(2).padStart(10)}` +
        ` + complementos ${l.mesesComplementos}m R$ ${l.totalComplementos.toFixed(2).padStart(9)}` +
        ` = R$ ${l.total.toFixed(2)}`
    )
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
