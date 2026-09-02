// ─────────────────────────────────────────────────────────────────────────────
// O PASSO ZERO — feature-portal-apresentacao.md §4 e A5
//
// ⚠️ A busca NÃO roda antes de um humano confirmar o setor. O passo zero é barato
// de propósito (só BrasilAPI, sem IA): errar o nicho aqui contamina tudo o que
// vem depois — panorama, casos e plano sugerido sairiam do setor errado, e o
// vendedor só perceberia lendo o PDF.
//
// ⚠️ O que sai daqui é SUGESTÃO, sempre editável. O CNAE fiscal é o da atividade
// principal declarada, que às vezes não é o negócio de verdade (holding com CNAE
// 64.62, clínica registrada como "serviços de escritório").
// ─────────────────────────────────────────────────────────────────────────────

/** Divisão do CNAE (2 primeiros dígitos) → setor, nas chaves do catálogo curado. */
const DIVISAO_SETOR: Array<{ de: number; ate: number; setor: string }> = [
  { de: 1, ate: 3, setor: 'Agronegócio' },
  { de: 5, ate: 9, setor: 'Indústria' },
  { de: 10, ate: 33, setor: 'Indústria' },
  { de: 35, ate: 39, setor: 'Energia e saneamento' },
  { de: 41, ate: 43, setor: 'Construção' },
  { de: 45, ate: 47, setor: 'Varejo' },
  { de: 49, ate: 53, setor: 'Logística' },
  { de: 55, ate: 56, setor: 'Serviços' },
  { de: 58, ate: 63, setor: 'Tecnologia' },
  { de: 64, ate: 66, setor: 'Financeiro' },
  { de: 68, ate: 68, setor: 'Serviços' },
  { de: 69, ate: 69, setor: 'Jurídico e contábil' },
  { de: 70, ate: 75, setor: 'Serviços' },
  { de: 77, ate: 82, setor: 'Serviços' },
  { de: 84, ate: 84, setor: 'Setor público' },
  { de: 85, ate: 85, setor: 'Educação' },
  { de: 86, ate: 88, setor: 'Saúde' },
  { de: 90, ate: 99, setor: 'Serviços' },
]

/** Só dígitos. Aceita `11.222.333/0001-81` e `11222333000181`. */
export function limparCnpj(bruto: string): string {
  return bruto.replace(/\D/g, '')
}

export function cnpjValido(bruto: string): boolean {
  return limparCnpj(bruto).length === 14
}

/**
 * O setor a partir do CNAE fiscal. `undefined` quando a divisão não é conhecida —
 * e aí a tela pede que o vendedor escreva, em vez de chutar.
 */
export function setorDoCnae(cnaeFiscal: number | string | null | undefined): string | undefined {
  const digitos = String(cnaeFiscal ?? '').replace(/\D/g, '')
  if (digitos.length < 2) return undefined
  const divisao = Number(digitos.slice(0, 2))
  return DIVISAO_SETOR.find((f) => divisao >= f.de && divisao <= f.ate)?.setor
}

export interface SetorSugerido {
  /** Sempre editável na tela. Nunca vira entrada de busca sem confirmação. */
  setor?: string
  razaoSocial?: string
  cnae?: string
  cnaeDescricao?: string
  /** De onde veio a sugestão — a tela diz isso ao vendedor. */
  origem: 'cnae' | 'descricao' | 'nenhuma'
}

type Buscador = (url: string) => Promise<Response>

/**
 * Consulta o CNPJ na BrasilAPI e devolve o setor sugerido.
 *
 * ⚠️ Falha de rede ou CNPJ inexistente **não é erro fatal**: devolve
 * `origem: 'nenhuma'` e a tela pede o setor a mão. Bloquear a apresentação
 * inteira porque uma API pública piscou seria pior do que digitar um campo.
 */
export async function sugerirSetorPorCnpj(
  cnpj: string,
  buscar: Buscador = fetch
): Promise<SetorSugerido> {
  if (!cnpjValido(cnpj)) return { origem: 'nenhuma' }
  try {
    const r = await buscar(`https://brasilapi.com.br/api/cnpj/v1/${limparCnpj(cnpj)}`)
    if (!r.ok) return { origem: 'nenhuma' }
    const d = (await r.json()) as {
      razao_social?: string
      cnae_fiscal?: number
      cnae_fiscal_descricao?: string
    }
    const setor = setorDoCnae(d.cnae_fiscal)
    return {
      setor,
      razaoSocial: d.razao_social,
      cnae: d.cnae_fiscal ? String(d.cnae_fiscal) : undefined,
      cnaeDescricao: d.cnae_fiscal_descricao,
      origem: setor ? 'cnae' : 'nenhuma',
    }
  } catch {
    return { origem: 'nenhuma' }
  }
}

/**
 * I4 — sem CNPJ, sem site e sem descrição o formulário recusa.
 *
 * Sem nenhuma das três âncoras, "entender o nicho" vira adivinhar a partir de um
 * nome de fantasia — e adivinhar aqui contamina o documento inteiro.
 */
export function faltaAncora(entrada: {
  cnpj?: string
  site?: string
  descricao?: string
}): boolean {
  return !entrada.cnpj?.trim() && !entrada.site?.trim() && !entrada.descricao?.trim()
}
