// ─────────────────────────────────────────────────────────────────────────────
// RENDER · HTML → Chromium headless → PDF A4 (feature-portal-proposta.md §7.3)
//
// É o caminho que a Defenz já usava sem saber que usava: o PDF entregue ao
// cliente tem `Producer: Skia/PDF` + `Creator: Mozilla/5.0`, ou seja, foi
// impresso pelo Chrome a partir de HTML (spec §2.3).
//
// R1 — se o Chromium na Vercel doer (cold start, memória), este arquivo é o
// único que muda: o render migra para o n8n sem mexer no contrato da rota.
// ─────────────────────────────────────────────────────────────────────────────

import type { Browser } from 'puppeteer-core'

/** Caminhos usuais do Chrome em dev. Em produção quem manda é o @sparticuz. */
const CHROME_DEV_PATHS = [
  process.env.CHROME_EXECUTABLE_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
].filter(Boolean) as string[]

function chromeLocal(): string | null {
  // `require` dinâmico: em produção este ramo nem é alcançado.
  const { existsSync } = require('fs') as typeof import('fs')
  return CHROME_DEV_PATHS.find((p) => existsSync(p)) ?? null
}

/** `true` em Lambda/Vercel, onde o Chrome do sistema não existe. */
function ehServerless(): boolean {
  return Boolean(process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL)
}

async function abrirNavegador(): Promise<Browser> {
  const puppeteer = (await import('puppeteer-core')).default

  if (ehServerless()) {
    const chromium = (await import('@sparticuz/chromium')).default
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1240, height: 1754 },
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }

  const executablePath = chromeLocal()
  if (!executablePath) {
    throw new Error(
      'Chrome não encontrado para gerar o PDF. Instale o Google Chrome ou aponte CHROME_EXECUTABLE_PATH para o executável.'
    )
  }
  return puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1240, height: 1754 },
  })
}

export interface RenderPdfOpts {
  /**
   * Aborta se a Manrope não estiver de fato carregada.
   *
   * Sem isso o Chromium cai numa fonte substituta e o PDF sai visualmente
   * quebrado SEM ERRO — o modo de falha mais caro, porque parece que funcionou
   * (risco R2). Desligável só em teste.
   */
  exigirFonte?: boolean
}

/** Imprime o HTML como PDF A4. Devolve os bytes. */
export async function renderPdf(
  html: string,
  { exigirFonte = true }: RenderPdfOpts = {}
): Promise<Buffer> {
  const browser = await abrirNavegador()
  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'load' })

    // Espera as @font-face resolverem antes de medir e imprimir.
    await page.evaluate(() => document.fonts.ready)

    if (exigirFonte) {
      const temManrope = await page.evaluate(() =>
        document.fonts.check("800 40px 'Manrope'")
      )
      if (!temManrope) {
        throw new Error(
          'A fonte Manrope não carregou no Chromium. O PDF sairia com fonte substituta e visual quebrado — geração abortada.'
        )
      }
    }

    // O tamanho vem do `@page { size: 210mm 297mm }` do template.
    //
    // MEDIDO, não suposto: o Chromium quantiza a MediaBox em pixels CSS
    // inteiros e nunca emite os 595,28 × 841,89 pt teóricos do A4. As quatro
    // combinações possíveis dão 594,96 (209,90 mm) ou 595,92 (210,24 mm) de
    // largura; `preferCSSPageSize` é a que chega mais perto do A4 real, e é a
    // mesma geometria do PDF que a Defenz já entrega hoje (também Skia/PDF).
    // Todo leitor de PDF classifica as duas como A4.
    const pdf = await page.pdf({
      preferCSSPageSize: true,
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })

    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
