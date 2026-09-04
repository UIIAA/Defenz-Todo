import { describe, it, expect } from 'vitest'
import { reconstruirDocumento } from '../proposta-server'
import { renderPropostaHtml } from '../templates/endpoints-a4'
import { calcularInvestimento } from '../calculo'
import { calcularComplementos, consolidar } from '../calculo-complementos'

const investimento = calcularInvestimento({
  quantidade: 30,
  planos: ['PREMIUM'],
  ajustePercent: 0,
})
const complementos = calcularComplementos(['PATCH_MANAGEMENT', 'PHASR'], 30)
const consolidado = consolidar(investimento, 0, complementos)

const registro = {
  codigo: 'DFZ-2026-01999',
  clienteNome: 'Maria Souza',
  empresaNome: 'Acme Indústria',
  createdAt: new Date('2026-09-02T12:00:00Z'),
  criadoPor: { name: 'Gustavo', email: 'gustavo@defenz.com.br' },
  precoSnapshot: JSON.parse(JSON.stringify(investimento)),
}

describe('reconstruirDocumento — a reimpressão não pode perder os complementos', () => {
  // ⚠️ Crítica C1. Sem o snapshot dos complementos, baixar de novo a MESMA
  // proposta devolveria um PDF sem as páginas de complemento e com o valor do
  // principal apenas — mesmo código, dois valores. É a classe exata de bug que o
  // `precoSnapshot` foi criado para impedir.
  it('reimprime com os complementos e o total consolidado', () => {
    const doc = reconstruirDocumento({
      ...registro,
      complementosSnapshot: JSON.parse(JSON.stringify({ complementos, consolidado })),
    })

    expect(doc.complementos).toHaveLength(2)
    const html = renderPropostaHtml(doc)
    expect(html).toContain('Resumo do investimento')
    expect(html).toContain('PHASR')
    // O total que o cliente recebeu tem de reaparecer igual.
    const total12 = consolidado.linhas[0].total
    expect(html).toContain(
      total12.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/ /g, ' ')
    )
  })

  it('proposta emitida ANTES da feature reimprime como antes, sem explodir', () => {
    const doc = reconstruirDocumento({ ...registro, complementosSnapshot: null })
    expect(doc.complementos).toBeUndefined()
    expect(renderPropostaHtml(doc)).not.toContain('Resumo do investimento')
  })

  it('snapshot corrompido ou vazio não vira página fantasma', () => {
    for (const bruto of [undefined, {}, { complementos: [] }, 'lixo']) {
      const doc = reconstruirDocumento({ ...registro, complementosSnapshot: bruto })
      expect(doc.complementos).toBeUndefined()
    }
  })
})
