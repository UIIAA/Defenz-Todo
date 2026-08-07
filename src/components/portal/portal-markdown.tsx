'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Allowlist de esquema de URL. Tudo que não for `https:`/`mailto:` vira string vazia.
 *
 * Este é o ponto de defesa contra XSS por URL (`javascript:`, `data:`). HTML cru
 * NÃO é habilitado no react-markdown (é o default do v10 — não adicionar
 * `rehype-raw`), então não há caminho para `<script>` chegar ao DOM. DOMPurify
 * não entra aqui de propósito: o react-markdown devolve elementos React, não
 * string HTML — passá-lo por um sanitizador exigiria serializar e reinjetar HTML
 * cru, o que introduziria o risco em vez de removê-lo. Ver review M1.
 */
export function safeUrl(url: string): string {
  const v = url.trim()
  if (v.startsWith('https://') || v.startsWith('mailto:')) return v
  return ''
}

/**
 * Imagem hospedada no Drive (D2). Se o link quebrar — permissão mudou, arquivo
 * movido, hotlink bloqueado — mostra um aviso explícito. Nunca um quadro branco
 * silencioso (invariante §9.3: sem erro silencioso na UI).
 */
function ImagemDoDrive({ src, alt }: { src?: string; alt?: string }) {
  const [quebrou, setQuebrou] = useState(false)

  if (!src || quebrou) {
    return (
      <span className="my-3 block rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
        Imagem indisponível — verifique o link do Drive
        {alt ? ` (${alt})` : ''}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ''}
      className="my-3 max-w-full rounded-md border border-slate-200 dark:border-slate-700"
      onError={() => setQuebrou(true)}
    />
  )
}

/** Render de markdown do Portal — POP e ficha de Biblioteca usam o mesmo. */
export function PortalMarkdown({ body }: { body: string }) {
  return (
    <div className="prose prose-slate prose-sm max-w-none dark:prose-invert">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        urlTransform={safeUrl}
        components={{
          img: ({ src, alt }) => (
            <ImagemDoDrive src={typeof src === 'string' ? src : undefined} alt={alt} />
          ),
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </div>
  )
}
