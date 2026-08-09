/**
 * Smoke da F2: gera um PDF de verdade e confere geometria, páginas e fonte.
 *
 *   npx tsx scripts/smoke-proposta-pdf.ts [saida.pdf]
 *
 * Não toca no banco. Serve para o gate "PDF de 210×297mm, Manrope embutida,
 * sem dado de cliente de referência" (spec §11 F2).
 */
import { writeFileSync } from 'fs'
import { calcularInvestimento } from '../src/lib/proposta/calculo'
import { renderPropostaHtml } from '../src/lib/proposta/templates/endpoints-a4'
import { renderPdf } from '../src/lib/proposta/pdf'

async function main() {
  const saida = process.argv[2] ?? 'proposta-smoke.pdf'

  const html = renderPropostaHtml({
    codigo: 'DFZ-2026-01986',
    clienteNome: 'Maria Souza',
    empresaNome: 'Acme Indústria',
    dataFormatada: '09/08/2026',
    ano: 2026,
    vendedor: { nome: 'Vendedor Teste', email: 'vendedor@defenz.com.br' },
    investimento: calcularInvestimento({
      quantidade: 30,
      planos: ['BUSINESS_SECURITY', 'PREMIUM', 'ENTERPRISE'],
      ajustePercent: -5,
    }),
  })

  console.log(`HTML: ${(html.length / 1024).toFixed(0)} KB`)
  const t0 = Date.now()
  const pdf = await renderPdf(html)
  console.log(`PDF:  ${(pdf.length / 1024).toFixed(0)} KB em ${Date.now() - t0}ms`)

  writeFileSync(saida, pdf)
  console.log(`→ ${saida}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
