/**
 * A mensagem que a tela mostra quando o backend recusa.
 *
 * ⚠️ Existe por causa de um 400 que chegou ao Gustavo como
 * "Falha ao gerar a apresentação (HTTP 400)" e mais nada. O `handleApiError`
 * devolve `{ error: 'Dados inválidos', details: [{ field, message }] }` — com
 * `error` STRING. Quem lia `j.error.message` recebia `undefined` e caía no
 * texto genérico, escondendo exatamente a informação que resolvia: qual campo.
 *
 * Invariante do Service Desk: sem erro silencioso na UI. Genérico é silencioso.
 */
export function mensagemDeErroApi(json: unknown, status: number, acao: string): string {
  const generico = `${acao} (HTTP ${status})`
  if (!json || typeof json !== 'object') return generico

  const j = json as {
    error?: unknown
    message?: unknown
    details?: Array<{ field?: string; message?: string }>
  }

  const base =
    (typeof j.error === 'string' && j.error) ||
    (typeof j.error === 'object' && j.error && typeof (j.error as { message?: unknown }).message === 'string'
      ? (j.error as { message: string }).message
      : '') ||
    (typeof j.message === 'string' ? j.message : '') ||
    generico

  const campos = (j.details ?? [])
    .filter((d) => d?.message)
    .map((d) => (d.field ? `${rotulo(d.field)}: ${d.message}` : d.message))

  return campos.length ? `${base} — ${campos.join('; ')}` : base
}

/** Nome do campo como ele aparece na tela, não como se chama no schema. */
const ROTULOS: Record<string, string> = {
  clienteNome: 'A/C — quem vai ler',
  empresaNome: 'Nome da empresa',
  setor: 'Setor do cliente',
  nivelDestaque: 'Nível em destaque',
  cnpj: 'CNPJ',
  site: 'Site',
}

function rotulo(campo: string): string {
  return ROTULOS[campo] ?? campo
}
