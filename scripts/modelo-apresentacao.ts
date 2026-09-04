/**
 * Modelo da apresentação COM a parte variável preenchida, para validação.
 *
 *   npx tsx scripts/modelo-apresentacao.ts [saida.pdf]
 *
 * ⚠️ Os casos abaixo são de MENTIRA, escritos à mão só para o modelo mostrar
 * como a página fica. Em produção eles vêm da pesquisa da F3, com fonte real, e
 * passam pelas guardas antes de qualquer humano ver.
 */
import { writeFileSync } from 'fs'
import { renderApresentacaoHtml } from '../src/lib/apresentacao/templates/institucional-a4'
import { fatosParaSetor } from '../src/lib/apresentacao/mercado-fatos'
import { renderPdf } from '../src/lib/proposta/pdf'

async function main() {
  const saida = process.argv[2] ?? 'modelo-apresentacao.pdf'
  const setor = 'Saúde'

  const html = renderApresentacaoHtml({
    clienteNome: 'Dr. Antônio Ribeiro',
    empresaNome: 'Clínica Modelo',
    setor,
    dataFormatada: '02/09/2026',
    ano: 2026,
    vendedor: { nome: 'Gustavo Figueira', email: 'gustavo@defenz.com.br' },
    fatos: fatosParaSetor(setor),
    casos: [
      {
        oQueAconteceu:
          'Uma rede de clínicas do interior paulista ficou três dias sem acesso a prontuário e agenda depois de um ataque de ransomware, e voltou a atender no papel enquanto restaurava os sistemas.',
        necessidade:
          'O invasor circulou pela rede por dias antes de criptografar. Faltou enxergar o movimento lateral enquanto ele acontecia.',
        funcionalidade: 'EDR',
        veiculo: 'EXEMPLO — em produção vem da pesquisa',
        ano: 2025,
      },
      {
        oQueAconteceu:
          'Um laboratório de análises teve dados de pacientes expostos depois que uma credencial de acesso remoto foi usada fora do horário, a partir de outro país.',
        necessidade:
          'A credencial era legítima. O que faltou foi notar que o uso dela fugia completamente do padrão daquele usuário.',
        funcionalidade: 'HYPERDETECT',
        veiculo: 'EXEMPLO — em produção vem da pesquisa',
        ano: 2025,
      },
    ],
    nivelDestaque: 'PREMIUM',
    complementos: ['PATCH_MANAGEMENT', 'CRIPTOGRAFIA_DISCO', 'PHASR'],
  })

  const pdf = await renderPdf(html)
  writeFileSync(saida, pdf)
  console.log(`→ ${saida} (${(pdf.length / 1024).toFixed(0)} KB)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
