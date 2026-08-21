/**
 * Gera a apresentação em HTML para conferência visual, sem banco e sem IA (F2).
 *
 * Uso: npx tsx scripts/smoke-apresentacao-html.ts <saida.html> [setor] [empresa]
 */
import { writeFileSync } from 'fs'
import { renderApresentacaoHtml } from '../src/lib/apresentacao/templates/institucional-a4'
import { fatosParaSetor } from '../src/lib/apresentacao/mercado-fatos'
import { recomendarNivel } from '../src/lib/apresentacao/comparativo'

const saida = process.argv[2] || 'apresentacao.html'
const setor = process.argv[3] || 'Saúde'
const empresa = process.argv[4] || 'Clínica São Rafael'

const html = renderApresentacaoHtml({
  clienteNome: 'Dr. Antônio Ribeiro',
  empresaNome: empresa,
  setor,
  dataFormatada: new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
  ano: 2026,
  vendedor: { nome: 'Gustavo Figueira', email: 'gustavo@defenz.com.br' },
  fatos: fatosParaSetor(setor),
  casos: [], // F2 é sem IA — a pesquisa entra na F3
  nivelDestaque: recomendarNivel(['HYPERDETECT']),
})

writeFileSync(saida, html)
console.log(`${setor} · ${empresa} → ${saida} (${Math.round(html.length / 1024)} KB)`)
