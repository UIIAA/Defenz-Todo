/**
 * Gera `src/lib/proposta/assets/embedded.ts` — fontes e logo como base64.
 *
 * POR QUE base64 no código-fonte, e não leitura de arquivo em runtime:
 * o PDF é impresso por um Chromium headless que NÃO tem acesso à rede e roda
 * num bundle serverless. Se a fonte não estiver embutida, o Chromium substitui
 * por uma fonte qualquer e o PDF sai visualmente quebrado EM SILÊNCIO — que é
 * exatamente o risco R2 da spec. `fs.readFileSync` num bundle da Vercel depende
 * de file tracing acertar; um literal base64 não depende de nada.
 *
 * Rodar após trocar logo ou fonte:
 *   npx tsx scripts/build-proposta-assets.ts
 */
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const DIR = join(process.cwd(), 'src/lib/proposta/assets')

const arquivos = {
  MANROPE_LATIN_WOFF2: 'manrope-latin.woff2',
  MANROPE_LATIN_EXT_WOFF2: 'manrope-latin-ext.woff2',
  LOGO_HORIZONTAL_INK_PNG: 'defenz-logo-horizontal-ink.png',
  CLIENTES_BD_PNG: 'clientes-bd.png',
} as const

const mime = (nome: string) =>
  nome.endsWith('.woff2') ? 'font/woff2' : 'image/png'

const linhas = Object.entries(arquivos).map(([constante, nome]) => {
  const b64 = readFileSync(join(DIR, nome)).toString('base64')
  return `/** ${nome} */\nexport const ${constante} = 'data:${mime(nome)};base64,${b64}'`
})

const saida = `// GERADO POR scripts/build-proposta-assets.ts — NÃO EDITAR À MÃO.
//
// Fontes e imagens do PDF da proposta, embutidas como data URI. O Chromium que
// imprime o documento não busca nada na rede (spec §7.2 / risco R2).
//
// Manrope: variable font (400..800), subsets latin e latin-ext, Google Fonts (SIL OFL 1.1).
// Logo: identidade Defenz, horizontal, tinta. Não redesenhar (brandbook).

${linhas.join('\n\n')}
`

writeFileSync(join(DIR, 'embedded.ts'), saida)
console.log(`embedded.ts gerado — ${(saida.length / 1024).toFixed(0)} KB`)
