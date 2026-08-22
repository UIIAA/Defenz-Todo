/**
 * Gera a apresentação em HTML (e opcionalmente PDF) para conferência, sem banco
 * e sem IA (F2) — e MEDE cada página.
 *
 * ⚠️ Por que medir: `.page` tem `overflow:hidden`. Fonte maior ou texto a mais
 * não estoura o layout: ele **corta em silêncio**, e o corte só aparece quando o
 * cliente já está com o documento na mão. Este script abre o HTML no mesmo
 * Chromium que imprime o PDF e compara `scrollHeight` com a altura da folha.
 *
 * Uso: npx tsx scripts/smoke-apresentacao-html.ts <saida.html> [setor] [empresa] [--pdf=arquivo.pdf]
 */
import { writeFileSync } from 'fs'
import { renderApresentacaoHtml } from '../src/lib/apresentacao/templates/institucional-a4'
import { fatosParaSetor } from '../src/lib/apresentacao/mercado-fatos'
import { recomendarNivel } from '../src/lib/apresentacao/comparativo'
import { renderPdf } from '../src/lib/proposta/pdf'

const args = process.argv.slice(2)
const flags = args.filter((a) => a.startsWith('--'))
const pos = args.filter((a) => !a.startsWith('--'))
const saida = pos[0] || 'apresentacao.html'
const setor = pos[1] || 'Saúde'
const empresa = pos[2] || 'Clínica São Rafael'
const pdfEm = flags.find((f) => f.startsWith('--pdf='))?.slice(6)

const html = renderApresentacaoHtml({
  clienteNome: 'Dr. Antônio Ribeiro',
  empresaNome: empresa,
  setor,
  dataFormatada: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
  ano: 2026,
  vendedor: { nome: 'Gustavo Figueira', email: 'gustavo@defenz.com.br' },
  fatos: fatosParaSetor(setor),
  casos: [],
  nivelDestaque: recomendarNivel(['HYPERDETECT']),
})

writeFileSync(saida, html)
console.log(`${setor} · ${empresa} → ${saida} (${Math.round(html.length / 1024)} KB)`)

async function medir() {
  const puppeteer = (await import('puppeteer-core')).default
  const { existsSync } = await import('fs')
  const exec = [
    process.env.CHROME_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ].filter(Boolean).find((p) => existsSync(p as string)) as string

  const browser = await puppeteer.launch({ executablePath: exec, headless: true })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'load' })

  const medidas = await page.evaluate(() =>
    Array.from(document.querySelectorAll('.page')).map((el, i) => {
      const inner = el.firstElementChild as HTMLElement
      return {
        pagina: i + 1,
        folha: Math.round(el.clientHeight),
        conteudo: Math.round(inner ? inner.scrollHeight : 0),
      }
    })
  )
  await browser.close()

  let estourou = 0
  for (const m of medidas) {
    const sobra = m.folha - m.conteudo
    const ok = sobra >= 0
    if (!ok) estourou++
    console.log(
      `  pág ${String(m.pagina).padStart(2, '0')} · folha ${m.folha}px · conteúdo ${m.conteudo}px · ${
        ok ? `sobra ${sobra}px` : `⚠️ ESTOUROU ${-sobra}px — está sendo CORTADO`
      }`
    )
  }
  if (estourou) {
    console.error(`\n⚠️ ${estourou} página(s) cortando conteúdo. NÃO entregar assim.`)
    process.exitCode = 1
  } else {
    console.log('\n✓ nenhuma página corta conteúdo')
  }
}

async function main() {
  await medir()
  if (pdfEm) {
    const pdf = await renderPdf(html)
    writeFileSync(pdfEm, pdf)
    console.log(`PDF → ${pdfEm}`)
  }
}
main()
