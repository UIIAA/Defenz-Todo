// ─────────────────────────────────────────────────────────────────────────────
// ARQUIVAMENTO NO ONEDRIVE (feature-portal-proposta.md §4, F5, risco R5)
//
// O arquivo nasce onde o time vive: a pasta do OneDrive, via Microsoft Graph,
// chamado pelo n8n (decisão P6 — nada de Vercel Blob).
//
// ⚠️ REGRA DE FALHA: isto NUNCA pode derrubar a geração. O vendedor clicou para
// ter a proposta; se o Graph estiver fora do ar, ele leva o PDF do mesmo jeito e
// o registro fica com `oneDriveItemId: null`, que a UI mostra como
// "não arquivado". Por isso tudo aqui é try/catch com timeout.
// ─────────────────────────────────────────────────────────────────────────────

import { db } from '@/lib/db'

/** Teto do arquivamento. Passou disso, desiste e deixa marcado como não arquivado. */
const TIMEOUT_MS = 8000

export interface ArquivarInput {
  propostaId: string
  codigo: string
  arquivoNome: string
  empresaNome: string
  pdf: Buffer
}

/**
 * Manda o PDF para o n8n arquivar e marca o registro se der certo.
 *
 * Devolve `true` só quando o item foi de fato criado no OneDrive. Nunca lança:
 * o chamador não precisa (nem deve) tratar falha de arquivamento como falha de
 * geração.
 */
export async function arquivarNoOneDrive(input: ArquivarInput): Promise<boolean> {
  const url = process.env.N8N_PROPOSTA_ARQUIVO_WEBHOOK_URL
  if (!url) return false

  // Só https: mandar documento comercial em claro não acontece.
  if (!url.startsWith('https://')) {
    console.error('[proposta] N8N_PROPOSTA_ARQUIVO_WEBHOOK_URL precisa ser https')
    return false
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    // Binário no corpo, metadado no header: o PDF tem ~700 KB e virar base64
    // dentro de um JSON custaria mais 33% sem ganho nenhum.
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/pdf',
        'X-Defenz-Token': process.env.N8N_PROPOSTA_ARQUIVO_TOKEN ?? '',
        'X-Proposta-Codigo': input.codigo,
        'X-Proposta-Empresa': encodeURIComponent(input.empresaNome),
        'X-Proposta-Arquivo': encodeURIComponent(input.arquivoNome),
      },
      body: new Uint8Array(input.pdf),
    })

    if (!res.ok) {
      console.error(`[proposta] arquivamento recusado pelo n8n: HTTP ${res.status}`)
      return false
    }

    const json = (await res.json().catch(() => null)) as { itemId?: string } | null
    const itemId = json?.itemId
    if (!itemId) {
      // Sem o id o arquivamento não é comprovável — melhor marcar como não
      // arquivado do que fingir que está lá.
      console.error('[proposta] n8n respondeu sem itemId; registro fica não arquivado')
      return false
    }

    await db.proposta.update({
      where: { id: input.propostaId },
      data: { oneDriveItemId: itemId, arquivadoEm: new Date() },
    })
    return true
  } catch (e) {
    console.error('[proposta] falha ao arquivar no OneDrive:', e)
    return false
  } finally {
    clearTimeout(timer)
  }
}
