// ─────────────────────────────────────────────────────────────────────────────
// A REVISÃO — o que o vendedor devolve, e o que o servidor aceita
// feature-portal-apresentacao.md §6.6
//
// ⚠️ A conferência roda contra o texto GUARDADO NO BANCO, nunca contra o que o
// navegador devolve. Se a guarda usasse o texto que veio junto do formulário,
// quem controla o navegador controlaria a guarda — e ela existe exatamente
// porque prompt é pedido e regra é código.
//
// ⚠️ DESVIO DECLARADO da spec §6.6: lá, editar um campo o marca como `humano` e
// isenta da guarda de número. Aqui editar NÃO isenta: as guardas rodam de novo
// sobre o texto novo, e o que continuar com bandeira só entra se o vendedor
// marcar "liberar mesmo assim". É mais estrito e tem uma razão prática — um
// campo editado pode ganhar um número novo, e a isenção automática deixaria
// passar justamente o caso em que alguém digitou o número de cabeça.
// ─────────────────────────────────────────────────────────────────────────────

import { ApiError } from '@/lib/api-helpers'
import { avaliarCaso, type CasoBruto, type VeredictoCaso } from './guardas'

export interface CasoRevisado extends CasoBruto {
  /** O vendedor viu a bandeira e assumiu o conteúdo mesmo assim. */
  liberado?: boolean
}

export interface RevisaoAprovada {
  aprovados: VeredictoCaso[]
  /** Barrados que o vendedor NÃO liberou — ficam fora do documento. */
  recusados: VeredictoCaso[]
}

/**
 * Roda as guardas de novo em cima do que voltou da tela.
 *
 * Caso limpo entra. Caso com bandeira só entra se `liberado`. Caso com bandeira
 * e sem liberação **não vai ao documento** — e não em silêncio: quem chamou
 * recebe a lista para dizer ao vendedor o que ficou de fora.
 */
export function revisarCasos(
  casos: CasoRevisado[],
  textoPesquisaDoBanco: string,
  qtdFontes: number
): RevisaoAprovada {
  const aprovados: VeredictoCaso[] = []
  const recusados: VeredictoCaso[] = []

  for (const caso of casos) {
    const veredicto = avaliarCaso(caso, textoPesquisaDoBanco, qtdFontes)
    if (!veredicto.bloqueado || caso.liberado) aprovados.push(veredicto)
    else recusados.push(veredicto)
  }

  return { aprovados, recusados }
}

/**
 * O aceite. Sem ele o documento não sai.
 *
 * ⚠️ Não é formalidade: depois do A13b, um número PODE passar pelo LLM — desde
 * que seja cópia verificável da matéria. Quem garante que o número está grudado
 * no fato certo é a leitura humana, e é isso que esta frase declara.
 */
export const TEXTO_ACEITE =
  'Li o que será apresentado ao cliente, conferi os números nas fontes, e assumo o conteúdo.'

export function exigirAceite(aceito: boolean, qtdCasos: number): void {
  if (qtdCasos > 0 && !aceito) {
    throw new ApiError(
      'A apresentação com casos pesquisados exige o aceite: ' + TEXTO_ACEITE,
      400
    )
  }
}
