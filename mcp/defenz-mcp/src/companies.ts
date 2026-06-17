/**
 * Mapa de conveniência de empresas/projetos do Defenz (nome humano → companyId).
 *
 * Permite ao agente dizer "crie em Grafono" sem conhecer o cuid. O escopo real
 * ainda é validado pelo servidor (token admin pode qualquer empresa; demais → 403).
 *
 * LIMITAÇÃO CONHECIDA: este mapa é estático. Se uma empresa for criada/renomeada,
 * atualize aqui. Para empresas fora do mapa, use o parâmetro `companyId` cru (cuid),
 * que é repassado direto à API sem resolução.
 */

type CompanyDef = { id: string; label: string; aliases: string[] }

const COMPANIES: CompanyDef[] = [
  { id: 'cmn8wi8ze00003ouacf33hseb', label: 'Defenz', aliases: [] },
  { id: 'cmnd3a1yr000q3oq80irkal13', label: 'Cow Cycling', aliases: ['cow', 'cowcycling'] },
  { id: 'cmnuwl2yg0002l7046rwhmxu9', label: 'Grafono', aliases: [] },
  {
    id: 'cmq3yyutf0000jo04bv6a5kmg',
    label: 'PSI.SheilaCarvalho',
    aliases: ['psi', 'sheila', 'psi sheila', 'sheila carvalho'],
  },
]

/** Texto de ajuda com as empresas válidas (para descrições e mensagens de erro). */
export const COMPANY_HELP = COMPANIES.map((c) => c.label).join(' | ')

/** Normaliza um rótulo: sem acento, minúsculas, espaços/hífens → espaço único. */
function normalize(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s_-]+/g, ' ')
}

/**
 * Resolve um nome de empresa humano (ou um companyId conhecido) para o companyId.
 * Lança erro acionável (listando as empresas válidas) se não reconhecer.
 */
export function resolveCompanyId(input: string): string {
  const raw = input.trim()

  // companyId conhecido → passthrough
  const byId = COMPANIES.find((c) => c.id === raw)
  if (byId) return byId.id

  const key = normalize(raw)
  const byName = COMPANIES.find(
    (c) => normalize(c.label) === key || c.aliases.some((a) => normalize(a) === key)
  )
  if (byName) return byName.id

  throw new Error(
    `Empresa desconhecida: "${input}". Empresas válidas: ${COMPANY_HELP}. ` +
      `(Ou passe o companyId cru se for outra empresa.)`
  )
}
