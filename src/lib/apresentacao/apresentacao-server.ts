/** Utilitários de emissão da apresentação. Fuso é São Paulo (invariante I3). */

export function formatarDataSP(quando: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(quando)
}

/**
 * `Defenz_Apresentacao_<Empresa>_<AAAA-MM-DD>_<HHMM>.pdf` — `Defenz_Apresentacao_DLP_...` no
 * modo só DLP, para os dois documentos da mesma empresa não saírem com o mesmo nome.
 *
 * Sufixo é o HORÁRIO, não um contador: contador exigiria consultar o banco e
 * dois cliques simultâneos gerariam o mesmo nome (spec §8).
 */
export function nomeArquivoApresentacao(
  empresaNome: string,
  quando: Date,
  tipo: 'bitdefender' | 'dlp' = 'bitdefender'
): string {
  const slug =
    empresaNome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'Cliente'

  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(quando)
  const g = (t: string) => partes.find((p) => p.type === t)?.value ?? '00'

  const prefixo = tipo === 'dlp' ? 'Defenz_Apresentacao_DLP' : 'Defenz_Apresentacao'
  return `${prefixo}_${slug}_${g('year')}-${g('month')}-${g('day')}_${g('hour')}${g('minute')}.pdf`
}

/**
 * Meia-noite de hoje em São Paulo, como instante UTC (invariante I3).
 *
 * ⚠️ `new Date().setHours(0,0,0,0)` usaria o fuso do servidor — que na Vercel é
 * UTC. O cap diário viraria "desde as 21h de ontem" e daria três horas de brinde
 * todo dia.
 */
export function inicioDoDiaSP(quando: Date): Date {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(quando)
  // -03:00 é o horário de Brasília; o Brasil não tem horário de verão desde 2019.
  return new Date(`${partes}T00:00:00-03:00`)
}

type Mudancas = Record<string, { from: unknown; to: unknown }>

/**
 * O que a emissão grava no AuditLog — a trilha de "quem emitiu o quê para quem".
 *
 * O registro da `Apresentacao` guarda o conteúdo; o log guarda o FATO da emissão
 * junto com quem fez, na mesma trilha das demais mutações (/dashboard/logs).
 * Só o que identifica o documento: o texto congelado já está no registro.
 */
export function auditoriaEmissao(d: {
  tipo: 'bitdefender' | 'dlp'
  empresaNome: string
  clienteNome: string
  setor?: string | null
  nivelDestaque: string
  complementos: readonly string[]
  casos: number
  casosRecusados: number
  arquivoNome: string
  templateVersao: string
}): Mudancas {
  const m: Mudancas = {
    tipo: { from: null, to: d.tipo === 'dlp' ? 'Só DLP' : 'Bitdefender' },
    empresaNome: { from: null, to: d.empresaNome },
    clienteNome: { from: null, to: d.clienteNome },
    setor: { from: null, to: d.setor || 'institucional' },
  }
  if (d.tipo !== 'dlp') {
    m.nivelDestaque = { from: null, to: d.nivelDestaque }
    if (d.complementos.length) m.complementos = { from: null, to: d.complementos.join(', ') }
    if (d.casos || d.casosRecusados) {
      m.casos = {
        from: null,
        to: `${d.casos} citado(s)${d.casosRecusados ? ` · ${d.casosRecusados} barrado(s) pela revisão` : ''}`,
      }
    }
  }
  m.arquivo = { from: null, to: d.arquivoNome }
  m.templateVersao = { from: null, to: d.templateVersao }
  return m
}

/**
 * Re-download: o PDF é renderizado de novo, então cada baixada é um documento que
 * saiu — e quando o modelo diverge, sai DIFERENTE do que o cliente recebeu.
 */
export function auditoriaReDownload(d: {
  arquivoNome: string
  emitidaEm: Date
  templateVersao: string
  templateAtual: string
}): Mudancas {
  const m: Mudancas = {
    arquivo: { from: null, to: d.arquivoNome },
    emitidaEm: { from: null, to: formatarDataSP(d.emitidaEm) },
  }
  if (d.templateVersao !== d.templateAtual) {
    m.modelo = { from: d.templateVersao, to: d.templateAtual }
  }
  return m
}
