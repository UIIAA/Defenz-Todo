/**
 * Modelos da apresentação com DLP GTB (feature-apresentacao-dlp-gtb.md), para validação.
 *
 *   npx tsx scripts/modelo-apresentacao-dlp.ts <pasta-de-saida>
 *
 * Gera os dois modos: A (Bitdefender + DLP) e B (só DLP). Cliente fictício.
 */
import { writeFileSync } from 'fs'
import { join } from 'path'
import { renderApresentacaoHtml } from '../src/lib/apresentacao/templates/institucional-a4'
import { fatosParaSetor } from '../src/lib/apresentacao/mercado-fatos'
import { dlpFatosParaSetor } from '../src/lib/apresentacao/dlp-fatos'
import { renderPdf } from '../src/lib/proposta/pdf'

const vendedor = { nome: 'Marcos Cruz', email: 'marcos@defenz.com.br' }

async function main() {
  const pasta = process.argv[2] ?? '.'
  const comum = { clienteNome: 'Carla Mendes', empresaNome: 'Empresa Exemplo Ltda', dataFormatada: '23/10/2026', ano: 2026, vendedor, casos: [] }

  const modoA = renderApresentacaoHtml({
    ...comum,
    setor: 'Indústria',
    fatos: fatosParaSetor('Indústria'),
    nivelDestaque: 'PREMIUM',
    complementos: ['DLP_GTB'],
  })
  const modoB = renderApresentacaoHtml({
    ...comum,
    tipo: 'dlp',
    setor: 'Serviços financeiros',
    fatos: dlpFatosParaSetor('Serviços financeiros'),
    nivelDestaque: 'PREMIUM',
  })

  for (const [nome, html] of [
    ['Apresentacao Defenz - EXEMPLO Bitdefender + DLP GTB.pdf', modoA],
    ['Apresentacao Defenz - EXEMPLO So DLP GTB.pdf', modoB],
  ] as const) {
    const pdf = await renderPdf(html)
    writeFileSync(join(pasta, nome), pdf)
    writeFileSync(join(pasta, nome.replace('.pdf', '.html')), html)
    console.log(`→ ${nome} (${(pdf.length / 1024).toFixed(0)} KB)`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
