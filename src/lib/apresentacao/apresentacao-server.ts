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
 * `Defenz_Apresentacao_<Empresa>_<AAAA-MM-DD>_<HHMM>.pdf`.
 *
 * Sufixo é o HORÁRIO, não um contador: contador exigiria consultar o banco e
 * dois cliques simultâneos gerariam o mesmo nome (spec §8).
 */
export function nomeArquivoApresentacao(empresaNome: string, quando: Date): string {
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

  return `Defenz_Apresentacao_${slug}_${g('year')}-${g('month')}-${g('day')}_${g('hour')}${g('minute')}.pdf`
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
