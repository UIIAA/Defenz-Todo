// ─────────────────────────────────────────────────────────────────────────────
// COBERTURA DA FONTE EMBUTIDA (Manrope, subsets latin + latin-ext)
//
// ⚠️ Cicatriz de 23/08: a tabela da apresentação saiu de produção SEM NENHUM
// TIQUE. O `&#10003;` (U+2713) não está em nenhuma das duas `unicode-range` e o
// glifo nem existe no subset embutido. O Chromium caía para a fonte do sistema:
// no macOS resolvia (o PDF local trazia um `LucidaGrande-Bold` embutido SÓ por
// causa desse caractere) e no Lambda não havia o que resolver — o caractere
// simplesmente sumia, sem erro nenhum.
//
// Estas faixas alimentam o PRÓPRIO `@font-face` dos templates (fonte única) e o
// teste que varre todo caractere renderizado. Se divergirem, a guarda mente.
// ─────────────────────────────────────────────────────────────────────────────

/** As `unicode-range` dos dois `@font-face` — nesta ordem: latin, latin-ext. */
export const UNICODE_RANGES_EMBUTIDAS = [
  'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
  'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
] as const

/** `true` se o ponto de código é desenhável pela fonte embutida. */
export function cobertoPelaFonte(cp: number): boolean {
  return UNICODE_RANGES_EMBUTIDAS.some((faixas) =>
    faixas.split(',').some((r) => {
      const corpo = r.trim().slice(2)
      if (corpo.includes('-')) {
        const [a, b] = corpo.split('-')
        return cp >= parseInt(a, 16) && cp <= parseInt(b, 16)
      }
      return parseInt(corpo, 16) === cp
    })
  )
}

/**
 * Texto visível de um HTML de documento: sem `<style>`, sem tags, com entidades
 * numéricas resolvidas (é assim que o tique entrava — `&#10003;`).
 */
export function textoRenderizado(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&[a-z]+;/g, ' ')
}

/** Os caracteres do HTML que a fonte embutida NÃO desenha. Vazio = seguro. */
export function caracteresForaDaFonte(html: string): string[] {
  return [...new Set([...textoRenderizado(html)])]
    .filter((ch) => !cobertoPelaFonte(ch.codePointAt(0)!))
    .map(
      (ch) =>
        `${JSON.stringify(ch)} (U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')})`
    )
}
