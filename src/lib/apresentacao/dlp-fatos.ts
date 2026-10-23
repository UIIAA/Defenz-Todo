/**
 * Os números da página "o que está em jogo" do documento DLP.
 *
 * ⚠️ Só FONTE PRIMÁRIA, valor literal (I-G6 / spec §7). Conferidos em 23/10/2026.
 * Ficaram DE FORA por só terem fonte secundária: Brasil R$ 7,44 mi (IBM 2026),
 * shadow AI em 43% (IBM 2026), Verizon 62%, LayerX 77%. Entram por PR com o link.
 *
 * ⚠️ I-G6: a multa entra como TETO LEGAL, com o texto da lei. A ANPD aplicou uma
 * multa em dinheiro até hoje (R$ 14.400, 2023) — nada de "pode custar R$ 50
 * milhões à sua empresa".
 */
import { normalizarSetor, type FatoMercado } from './mercado-fatos'

export const DLP_FATOS: FatoMercado[] = [
  {
    id: 'D-ANPD-3DIAS',
    texto: 'Incidente de segurança com dado pessoal precisa ser comunicado à ANPD em até três dias úteis. Para comunicar, é preciso saber o que saiu.',
    valor: '3 dias úteis',
    fonte: 'ANPD · Resolução CD/ANPD nº 15/2024, art. 6º',
    ano: 'lei',
  },
  {
    id: 'D-IBM-SHADOW-AI',
    texto: 'Entre as organizações com vazamento estudadas, uma em cada cinco teve o incidente ligado ao uso de IA não autorizada; onde esse uso era alto, o vazamento custou US$ 670 mil a mais.',
    valor: '1 em 5',
    fonte: 'IBM e Ponemon · Cost of a Data Breach Report, 600 organizações',
    ano: 2025,
  },
  {
    id: 'D-IBM-CUSTO',
    texto: 'O custo médio global de um vazamento de dados chegou a US$ 4,99 milhões, o maior já registrado pelo estudo.',
    valor: 'US$ 4,99 milhões',
    fonte: 'IBM · Cost of a Data Breach Report, 602 organizações',
    ano: 2026,
  },
  {
    id: 'D-LGPD-52',
    texto: 'A LGPD prevê multa de até 2% do faturamento, limitada a R$ 50 milhões por infração.',
    valor: 'até 2%',
    fonte: 'Lei Geral de Proteção de Dados, art. 52, II',
    ano: 'lei',
  },
  {
    id: 'D-CMN-4893',
    texto: 'A regulação bancária inclui a prevenção de vazamento de informações entre os controles mínimos da política de segurança cibernética.',
    valor: 'Controle mínimo',
    // ⚠️ Conferir a versão vigente no BCB (a 4.893 pode ter sido alterada) antes de deployar.
    fonte: 'Conselho Monetário Nacional · Resolução nº 4.893/2021, art. 3º, § 2º',
    ano: 'lei',
    // Crítica 🟠9: lista PRÓPRIA. "Seguro" é SUSEP, não CMN; "banco" casaria com
    // "banco de sangue". Casa só num sentido (o setor contém o termo).
    setores: ['financeir', 'bancari', 'bancos', 'credito', 'fintech', 'pagamento'],
  },
]

/** D-A2 (Marcos, 23/10): o fato setorial entra primeiro quando o setor casa. */
export function dlpFatosParaSetor(setor?: string): FatoMercado[] {
  const alvo = setor ? normalizarSetor(setor) : ''
  const casa = (f: FatoMercado) => !!alvo && !!f.setores?.some((s) => alvo.includes(s))
  return [...DLP_FATOS.filter(casa), ...DLP_FATOS.filter((f) => !f.setores?.length)]
}
