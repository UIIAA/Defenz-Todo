'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/**
 * Resposta da Ana. Markdown SEM link e SEM imagem.
 *
 * A regra dura §7.2 da spec manda renderizar a resposta como texto puro, para que um POP
 * com texto injetado no corpo não consiga fazer a Ana emitir um link clicável. Renderizar
 * literalmente como texto puro cumpria a regra mas devolvia `* **CNPJ:**` na cara do
 * usuário — o modelo escreve markdown, e listas e negrito é justamente o que torna um
 * procedimento legível.
 *
 * Aqui o markdown é renderizado, mas `a` e `img` são **removidos do resultado**
 * (`disallowedElements` + `unwrapDisallowed`): o texto do link sobrevive, o elemento
 * clicável não existe. Isso é estritamente MAIS restrito que o `<PortalMarkdown>` dos POPs,
 * que permite `https:`. Sem `rehype-raw`, então HTML cru também não passa.
 */
export function AnaAnswer({ text }: { text: string }) {
  return (
    <div className="prose prose-slate prose-sm max-w-none dark:prose-invert prose-p:leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        disallowedElements={['a', 'img']}
        unwrapDisallowed
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}
