/**
 * Catálogo de fatos de mercado — o CHÃO da página "o que está acontecendo no seu setor".
 *
 * ⚠️ Versionado com valor, fonte e ano, como a tabela de preços, e pelo mesmo motivo:
 * **nenhum destes números passa por LLM** (invariante I9). A pesquisa PODE acrescentar
 * fato específico do nicho (decisão do Marcos, 21/08 — spec A13), mas o acréscimo passa
 * pela trava do A13b: o dígito tem de existir literalmente no texto pesquisado, com
 * veículo e ano.
 *
 * Conferido e aprovado pelo Marcos em 21/08 (spec, Anexo C). O que foi RECUSADO está
 * registrado no Anexo C.2 — inclusive a estatística zumbi dos "60% que fecham em 6 meses".
 */

export const MERCADO_VIGENCIA = '2025'

export interface FatoMercado {
  id: string
  /** A frase como vai ao papel. */
  texto: string
  /** O número isolado, para o documento poder destacá-lo. */
  valor: string
  fonte: string
  /** `'lei'` para o que não envelhece. */
  ano: number | 'lei'
  /**
   * Setores a que o fato se aplica. Vazio = vale para qualquer um.
   * As chaves são normalizadas (minúsculas, sem acento) — ver `fatosParaSetor`.
   */
  setores?: string[]
}

export const MERCADO_FATOS: FatoMercado[] = [
  {
    id: 'M1',
    texto: 'O custo médio de uma violação de dados no Brasil chegou a R$ 7,19 milhões, 6,5% acima do ano anterior.',
    valor: 'R$ 7,19 milhões',
    fonte: 'IBM · Cost of a Data Breach Report, recorte Brasil',
    ano: 2025,
  },
  {
    id: 'M2-saude',
    texto: 'Na saúde, o custo médio de uma violação no Brasil é o mais alto entre os setores medidos: R$ 11,43 milhões.',
    valor: 'R$ 11,43 milhões',
    fonte: 'IBM · Cost of a Data Breach Report, recorte Brasil',
    ano: 2025,
    setores: ['saude'],
  },
  {
    id: 'M2-financeiro',
    texto: 'No setor financeiro, o custo médio de uma violação no Brasil é de R$ 8,92 milhões.',
    valor: 'R$ 8,92 milhões',
    fonte: 'IBM · Cost of a Data Breach Report, recorte Brasil',
    ano: 2025,
    setores: ['financeiro', 'banco', 'seguro'],
  },
  {
    id: 'M2-servicos',
    texto: 'No setor de serviços, o custo médio de uma violação no Brasil é de R$ 8,51 milhões.',
    valor: 'R$ 8,51 milhões',
    fonte: 'IBM · Cost of a Data Breach Report, recorte Brasil',
    ano: 2025,
    setores: ['servicos', 'tecnologia', 'consultoria'],
  },
  {
    id: 'M3',
    texto: 'O phishing é a porta de entrada mais comum no Brasil, presente em 18% das violações; comprometimento de terceiros responde por 15% e exploração de vulnerabilidade, por 13%.',
    valor: '18%',
    fonte: 'IBM · Cost of a Data Breach Report, recorte Brasil',
    ano: 2025,
  },
  {
    id: 'M4',
    texto: 'Entre os ataques de motivação conhecida, ao menos 52% foram extorsão ou ransomware. Espionagem respondeu por apenas 4%: o alvo é dinheiro, não segredo.',
    valor: '52%',
    fonte: 'Microsoft · Digital Defense Report',
    ano: 2025,
  },
  {
    id: 'M5',
    texto: 'O Brasil é o primeiro país da América do Sul em volume de clientes impactados por atividade cibernética.',
    valor: '1º da América do Sul',
    fonte: 'Microsoft · Digital Defense Report',
    ano: 2025,
  },
  {
    id: 'M6',
    texto: 'Em empresas de pequeno e médio porte, o ransomware esteve presente em 88% das violações.',
    valor: '88%',
    fonte: 'Verizon · Data Breach Investigations Report',
    ano: 2025,
  },
  {
    id: 'M7',
    texto: 'O envolvimento de terceiros em violações dobrou e chegou a 30% dos casos.',
    valor: '30%',
    fonte: 'Verizon · Data Breach Investigations Report',
    ano: 2025,
  },
  {
    id: 'M8',
    texto: 'Metade do problema não aparece: 55% das equipes de segurança relataram ter sido orientadas a não divulgar uma violação.',
    valor: '55%',
    fonte: 'Bitdefender · Annual Cybersecurity Assessment, 1.200 profissionais',
    ano: 2025,
  },
  {
    id: 'M9',
    texto: 'A LGPD prevê multa de até 2% do faturamento, limitada a R$ 50 milhões por infração.',
    valor: 'R$ 50 milhões',
    fonte: 'Lei Geral de Proteção de Dados, Art. 52',
    ano: 'lei',
  },
]

/** minúsculas, sem acento — para casar "Saúde" com `saude`. */
export function normalizarSetor(setor: string): string {
  return setor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Os fatos aplicáveis a um setor: os transversais sempre, mais os que casam.
 *
 * O específico vem PRIMEIRO — numa página que fala do setor do leitor, o número
 * do setor dele é o que prende a leitura; o dado nacional é contexto.
 */
export function fatosParaSetor(setor?: string): FatoMercado[] {
  const alvo = setor ? normalizarSetor(setor) : ''
  const casa = (f: FatoMercado) =>
    !!alvo && !!f.setores?.some((s) => alvo.includes(s) || s.includes(alvo))

  const especificos = MERCADO_FATOS.filter(casa)
  const transversais = MERCADO_FATOS.filter((f) => !f.setores?.length)
  return [...especificos, ...transversais]
}
