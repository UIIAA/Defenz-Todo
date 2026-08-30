// ─────────────────────────────────────────────────────────────────────────────
// AS GUARDAS DA PESQUISA — feature-portal-apresentacao.md §6.4, §6.5, §6.5.1
//
// ⚠️ O prompt manda anonimizar e manda não inventar número. **Prompt é pedido; a
// regra é código.** Este arquivo é a regra. Nada aqui depende de o modelo ter
// obedecido.
//
// ⚠️ Princípio único, e é dele que sai todo o resto: **bandeira barra, não apaga.**
// Caso com problema chega à tela de revisão marcado e desmarcado, com o motivo
// legível. Descarte silencioso some com conteúdo bom e ninguém percebe.
// ─────────────────────────────────────────────────────────────────────────────

import { FUNCIONALIDADES, type FuncionalidadeId } from '../comparativo'

export interface CasoBruto {
  oQueAconteceu: string
  /** O que o modelo DIZ ter removido. É autodeclaração — por isso é conferida. */
  entidadesRemovidas: string[]
  necessidade: string
  funcionalidade: FuncionalidadeId
  veiculo: string
  ano: number
  fonteIdx: number[]
}

export type TipoBandeira =
  | 'entidade_vazou'
  | 'nome_proprio'
  | 'numero_proibido'
  | 'numero_nao_conferido'
  | 'fonte_invalida'
  | 'funcionalidade_invalida'

export interface Bandeira {
  tipo: TipoBandeira
  /** Texto curto para a tela: o que exatamente levantou a bandeira. */
  detalhe: string
}

export interface VeredictoCaso {
  caso: CasoBruto
  bandeiras: Bandeira[]
  /** `true` = chega desmarcado na revisão. Só entra se o vendedor liberar. */
  bloqueado: boolean
}

/** Sem acento, sem caixa, sem pontuação — para comparar texto com texto. */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

// ── §6.4 camada 1 ────────────────────────────────────────────────────────────

/**
 * As entidades que o modelo DIZ ter removido e que continuam no texto.
 *
 * Pega o caso trivial e mais provável: ele lista o nome em `entidadesRemovidas`
 * e esquece de tirá-lo de `oQueAconteceu`.
 */
export function entidadesQueVazaram(caso: CasoBruto): string[] {
  const texto = normalizar(caso.oQueAconteceu)
  return caso.entidadesRemovidas.filter((e) => e.trim() && texto.includes(normalizar(e)))
}

// ── §6.4 camada 2 ────────────────────────────────────────────────────────────

/**
 * Vocabulário que PODE aparecer capitalizado no meio da frase sem ser nome de
 * cliente. Fica curto de propósito: é mais barato liberar um falso positivo na
 * tela do que deixar passar o nome de uma empresa real.
 */
const PERMITIDAS = new Set(
  [
    'brasil', 'brasileiro', 'brasileira', 'bitdefender', 'defenz', 'gravityzone',
    'lgpd', 'anpd', 'iso', 'pci', 'dss', 'nist', 'gdpr', 'cnpj', 'cpf', 'ti',
    'janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto',
    'setembro', 'outubro', 'novembro', 'dezembro',
    'acre', 'alagoas', 'amapa', 'amazonas', 'bahia', 'ceara', 'espirito', 'santo',
    'goias', 'maranhao', 'mato', 'grosso', 'sul', 'minas', 'gerais', 'para',
    'paraiba', 'parana', 'pernambuco', 'piaui', 'rio', 'janeiro', 'grande', 'norte',
    'rondonia', 'roraima', 'catarina', 'sao', 'paulo', 'sergipe', 'tocantins',
    'distrito', 'federal', 'nordeste', 'sudeste', 'centro', 'oeste',
    'saude', 'educacao', 'industria', 'varejo', 'financeiro', 'juridico', 'publico',
    'logistica', 'agro', 'agronegocio', 'tecnologia', 'servicos',
  ].map(normalizar)
)

/** `true` para "A", "O", "Uma"… — artigo capitalizado não é nome próprio. */
const ARTIGOS = new Set(['a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas', 'no', 'na', 'em', 'de'])

/**
 * Palavras capitalizadas fora de início de frase e fora da allowlist.
 *
 * ⚠️ **É um detector com falso positivo, e isso é assumido** (§6.4): vai implicar
 * com "Ministério da Saúde" num caso legítimo do setor público. Por isso quem
 * consome levanta bandeira — não descarta.
 */
export function nomesPropriosSuspeitos(texto: string): string[] {
  const achados: string[] = []
  // Cada frase reinicia a contagem: a primeira palavra é capitalizada por regra
  // de escrita, não por ser nome.
  for (const frase of texto.split(/(?<=[.!?:;])\s+|\n+/)) {
    const palavras = frase.trim().match(/[\p{L}][\p{L}'-]*/gu) ?? []
    palavras.forEach((p, i) => {
      if (i === 0) return
      const primeira = p[0]
      if (primeira !== primeira.toLocaleUpperCase('pt-BR')) return
      if (PERMITIDAS.has(normalizar(p)) || ARTIGOS.has(normalizar(p))) return
      achados.push(p)
    })
  }
  return achados
}

// ── §6.5 A13 ─────────────────────────────────────────────────────────────────

/**
 * Os números que NÃO podem sair de LLM, nomeados um a um.
 *
 * ⚠️ **Estreita de propósito** (crítica M1). Uma regex genérica de "qualquer
 * número" rejeitaria `LGPD`, `ISO 27001`, `Lei 13.709`, `PCI-DSS 4.0` e `24/7` —
 * o vocabulário exato dos setores regulados, que são os melhores clientes.
 * **Ano passa**: é data, e o caso precisa dele.
 */
const PROIBIDOS: Array<{ re: RegExp; nome: string }> = [
  { re: /\d+(?:[.,]\d+)?\s*%/g, nome: 'percentual' },
  { re: /(?:R\$|US\$|USD|€)\s*\d/gi, nome: 'moeda' },
  { re: /\d+\s+em\s+cada\s+\d+/gi, nome: 'proporção "N em cada M"' },
  { re: /\d+(?:[.,]\d+)?\s*(?:vezes|x)\s+(?:mais|menos|maior|menor)/gi, nome: 'multiplicador' },
]

export function numerosProibidos(texto: string): string[] {
  return PROIBIDOS.flatMap(({ re, nome }) =>
    [...texto.matchAll(re)].map((m) => `${nome}: ${m[0].trim()}`)
  )
}

// ── §6.5.1 A13b ──────────────────────────────────────────────────────────────

/**
 * Número, com escala opcional por extenso.
 *
 * ⚠️ `mil` vem por ÚLTIMO na alternância de propósito: antes das outras ele casa
 * com o prefixo de "milhões" e multiplica por 1.000 um valor que era milhão —
 * fazendo a guarda barrar número verdadeiro. Custou um teste vermelho.
 */
const NUMERO_COM_ESCALA = /(\d[\d.,]*)\s*(milh[õo]es|milh[ãa]o|bilh[õo]es|bilh[ãa]o|mil)?\b/gi

const ESCALAS: Record<string, number> = {
  mil: 1_000,
  milhao: 1_000_000,
  milhoes: 1_000_000,
  bilhao: 1_000_000_000,
  bilhoes: 1_000_000_000,
}

/** `40.000.000` e `2,5` viram número; separador de milhar não vira decimal. */
function paraNumero(bruto: string): number | null {
  const limpo = bruto.replace(/\.(?=\d{3}\b)/g, '').replace(',', '.')
  const n = Number(limpo)
  return Number.isFinite(n) ? n : null
}

/**
 * Todas as escritas do mesmo número presentes num texto, já colapsadas.
 *
 * ⚠️ Sem isto a guarda do A13b barraria número VERDADEIRO por diferença de
 * escrita: a matéria diz `R$40.000.000` e o modelo reescreve `R$ 40 milhões`.
 * Cada ocorrência gera o valor como escrito **e** o valor com a escala aplicada.
 */
export function variantesNumericas(texto: string): Set<string> {
  const saida = new Set<string>()
  for (const m of texto.matchAll(NUMERO_COM_ESCALA)) {
    const n = paraNumero(m[1])
    if (n === null) continue
    saida.add(String(n))
    const escala = m[2] ? ESCALAS[normalizar(m[2])] : undefined
    if (escala) saida.add(String(n * escala))
  }
  return saida
}

/**
 * Os números do caso que **não** aparecem no texto bruto da chamada A.
 *
 * A chamada B não tem internet: ela só reescreve o que a A trouxe. Logo, todo
 * número legítimo do caso já está lá. O que não está, o modelo produziu.
 *
 * ⚠️ **O que isto garante e o que não garante** (§6.5.1): garante que o número
 * não foi inventado. NÃO garante que a matéria esteja certa, nem que o modelo o
 * tenha grudado no fato certo. Por isso a revisão humana continua valendo.
 */
export function digitosNaoConferidos(caso: CasoBruto, textoChamadaA: string): string[] {
  const naFonte = variantesNumericas(textoChamadaA)
  const fora: string[] = []
  for (const m of `${caso.oQueAconteceu} ${caso.necessidade}`.matchAll(NUMERO_COM_ESCALA)) {
    const n = paraNumero(m[1])
    if (n === null) continue
    const escala = m[2] ? ESCALAS[normalizar(m[2])] : undefined
    const variantes = [String(n), ...(escala ? [String(n * escala)] : [])]
    if (!variantes.some((v) => naFonte.has(v))) fora.push(m[1])
  }
  return fora
}

// ── §6.3 / crítica M2 ────────────────────────────────────────────────────────

/** Índices que apontam para fora da lista de fontes. Caso sem fonte não entra. */
export function fonteIdxForaDaFaixa(caso: CasoBruto, qtdFontes: number): number[] {
  return caso.fonteIdx.filter((i) => !Number.isInteger(i) || i < 0 || i >= qtdFontes)
}

// ── O veredito ───────────────────────────────────────────────────────────────

/**
 * Roda as cinco guardas e devolve o caso com as bandeiras.
 *
 * ⚠️ **Nunca descarta.** Devolve `bloqueado: true` e o caso inteiro, para a tela
 * mostrar o motivo e o vendedor decidir em um clique (§6.4 camada 3).
 */
export function avaliarCaso(
  caso: CasoBruto,
  textoChamadaA: string,
  qtdFontes: number
): VeredictoCaso {
  const bandeiras: Bandeira[] = []
  const add = (tipo: TipoBandeira, itens: Array<string | number>, rotulo: string) => {
    if (itens.length) bandeiras.push({ tipo, detalhe: `${rotulo}: ${itens.join(', ')}` })
  }

  add('entidade_vazou', entidadesQueVazaram(caso), 'nome que o modelo disse ter removido')
  add('nome_proprio', nomesPropriosSuspeitos(caso.oQueAconteceu), 'possível nome próprio')
  add('numero_proibido', numerosProibidos(`${caso.oQueAconteceu} ${caso.necessidade}`), 'número que não pode sair de LLM')
  add('numero_nao_conferido', digitosNaoConferidos(caso, textoChamadaA), 'número ausente na matéria')
  add('fonte_invalida', fonteIdxForaDaFaixa(caso, qtdFontes), 'índice de fonte fora da lista')
  if (!FUNCIONALIDADES.includes(caso.funcionalidade)) {
    bandeiras.push({ tipo: 'funcionalidade_invalida', detalhe: String(caso.funcionalidade) })
  }

  return { caso, bandeiras, bloqueado: bandeiras.length > 0 }
}
