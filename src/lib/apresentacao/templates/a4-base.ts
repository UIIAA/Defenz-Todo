// Peças de desenho do A4 da apresentação, comuns ao documento Bitdefender e ao DLP.
// Extraídas de institucional-a4.ts sem mudar um caractere do HTML que produzem.

import type { FatoMercado } from '../mercado-fatos'

/** Paleta do brandbook, a mesma da proposta. ~70% papel, ~22% tinta, ~8% crimson. */
export const C = {
  accent: '#C1121F',
  ink: '#16191D',
  paper: '#F6F3EE',
  surface: '#FBF9F4',
  body: '#3C3A34',
  muted: '#6B6459',
  faint: '#A39C8D',
  line: '#E3DED4',
} as const

export function escapeHtml(valor: string): string {
  return String(valor)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const pad2 = (n: number) => String(n).padStart(2, '0')
export const LOGO_RATIO = 480 / 131

export function logo(alturaPx: number): string {
  return `<span class="dz-logo" style="height:${alturaPx}px; width:${Math.round(alturaPx * LOGO_RATIO)}px;"></span>`
}

export function rodape(pagina: number, total: number, ano: number, margemTopo = 'auto'): string {
  return `
      <div style="margin-top:${margemTopo}; padding-top:20px; display:flex; justify-content:space-between; align-items:flex-end;">
        ${logo(22)}
        <div style="text-align:right; font-size:11.6px; color:${C.faint}; font-weight:600; line-height:1.7;"><div>Página ${pad2(pagina)} de ${pad2(total)}</div><div>© Defenz Cybersecurity ${ano} · Confidencial</div></div>
      </div>`
}

export function tituloSecao(numero: string, texto: string): string {
  return `
        <div style="width:56px; height:4px; background:${C.accent}; margin-bottom:22px;"></div>
        <h2 style="font-size:40.2px; font-weight:800; letter-spacing:-0.02em; margin:0 0 22px; line-height:1.1;"><span style="color:${C.accent};">${numero}</span>&nbsp;&nbsp;${texto}</h2>`
}

export function linhaFonte(texto: string): string {
  return `<div style="font-size:11.6px; color:${C.faint}; font-weight:600; margin-top:6px;">${texto}</div>`
}

/** Cartão de dado: o número grande, a frase, e a fonte embaixo. */
export function cartaoFato(f: FatoMercado): string {
  const ano = f.ano === 'lei' ? '' : ` · ${f.ano}`
  return `
          <div style="border-left:3px solid ${C.accent}; padding:2px 0 2px 18px;">
            <div style="font-size:27.5px; font-weight:800; letter-spacing:-0.02em; color:${C.accent}; line-height:1.2;">${escapeHtml(f.valor)}</div>
            <p style="font-size:14.8px; line-height:1.6; color:${C.body}; margin:4px 0 0;">${escapeHtml(f.texto)}</p>
            ${linhaFonte(`${escapeHtml(f.fonte)}${ano}`)}
          </div>`
}

/**
 * O "tem este recurso" da tabela dos níveis, desenhado em SVG.
 *
 * ⚠️ NÃO usar caractere de check (`&#10003;`, U+2713). O Manrope embutido é o
 * subset latino do Google Fonts: o glifo **não existe** nele (`cmap` conferido,
 * 218 glifos) e a `unicode-range` das duas `@font-face` também não cobre o ponto
 * de código. O Chromium então cai na fonte do sistema — que no macOS resolve
 * (o PDF gerado aqui trazia um `LucidaGrande-Bold` embutido só por causa deste
 * caractere) e **no Lambda não existe**, deixando a coluna inteira em branco.
 *
 * Foi assim que a tabela chegou ao cliente sem nenhum tique, com os travessões
 * aparecendo normalmente — o travessão (U+2014) está dentro de `U+2000-206F` e
 * o check não está em faixa nenhuma.
 *
 * Traço em SVG não depende de fonte, escala com o zoom e herda a cor.
 */
export function iconeCheck(cor: string): string {
  return `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="${cor}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;" aria-hidden="true"><path d="M2.5 8.6 L6.2 12.3 L13.5 4"/></svg>`
}
/** Uma seção numerada: o número vem do índice no array, nunca da mão. */
export interface Secao {
  titulo: string
  corpo: (n: string) => string
}
