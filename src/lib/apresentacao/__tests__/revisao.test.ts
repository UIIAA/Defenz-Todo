import { describe, it, expect } from 'vitest'
import { revisarCasos, exigirAceite } from '../pesquisa/revisao'
import type { CasoRevisado } from '../pesquisa/revisao'

const TEXTO_A = 'Uma rede de clínicas ficou 3 dias sem sistema em 2025, segundo a Folha.'

function caso(over: Partial<CasoRevisado> = {}): CasoRevisado {
  return {
    oQueAconteceu: 'Uma rede de clínicas ficou 3 dias sem sistema.',
    entidadesRemovidas: [],
    necessidade: 'Cortar o movimento lateral antes da criptografia.',
    funcionalidade: 'EDR',
    veiculo: 'Folha de S.Paulo',
    ano: 2025,
    fonteIdx: [0],
    ...over,
  }
}

describe('revisarCasos — as guardas rodam DE NOVO no que voltou da tela', () => {
  it('caso limpo entra', () => {
    const r = revisarCasos([caso()], TEXTO_A, 1)
    expect(r.aprovados).toHaveLength(1)
    expect(r.recusados).toHaveLength(0)
  })

  // ⚠️ O ataque óbvio: o navegador devolve um caso adulterado. A guarda roda
  // contra o texto do BANCO, então o número inventado é pego aqui.
  it('barra número que não está no texto guardado no servidor', () => {
    const r = revisarCasos([caso({ oQueAconteceu: 'Vazaram 12000 prontuários.' })], TEXTO_A, 1)
    expect(r.aprovados).toHaveLength(0)
    expect(r.recusados[0].bandeiras.map((b) => b.tipo)).toContain('numero_nao_conferido')
  })

  it('o caso barrado entra quando o vendedor libera explicitamente', () => {
    const sujo = caso({ oQueAconteceu: 'Vazaram 12000 prontuários.', liberado: true })
    expect(revisarCasos([sujo], TEXTO_A, 1).aprovados).toHaveLength(1)
  })

  it('recusado não some em silêncio — volta na lista para a tela dizer', () => {
    const r = revisarCasos([caso(), caso({ fonteIdx: [9] })], TEXTO_A, 1)
    expect(r.aprovados).toHaveLength(1)
    expect(r.recusados).toHaveLength(1)
  })
})

describe('exigirAceite — sem aceite, documento com caso não sai', () => {
  it('recusa quando há caso e não há aceite', () => {
    expect(() => exigirAceite(false, 2)).toThrow(/assumo o conteúdo/)
  })

  it('não exige aceite quando não há caso nenhum (documento institucional)', () => {
    expect(() => exigirAceite(false, 0)).not.toThrow()
  })
})
