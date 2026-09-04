// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { RevisaoCasos, type CasoEmRevisao } from '../revisao-casos'

function caso(over: Partial<CasoEmRevisao> = {}): CasoEmRevisao {
  return {
    oQueAconteceu: 'Uma rede de clínicas ficou 3 dias sem sistema.',
    entidadesRemovidas: [],
    necessidade: 'Cortar o movimento lateral.',
    funcionalidade: 'EDR',
    veiculo: 'Folha de S.Paulo',
    ano: 2025,
    fonteIdx: [0],
    bandeiras: [],
    liberado: false,
    incluido: true,
    ...over,
  }
}

const FONTES = [{ titulo: 'Matéria X', dominio: 'folha.uol.com.br' }]

describe('RevisaoCasos', () => {
  it('trata "nenhum caso" como resultado normal, não como erro', () => {
    render(<RevisaoCasos casos={[]} fontes={[]} aceite={false} onChange={() => {}} onAceite={() => {}} />)
    expect(screen.getByText(/Não encontrei incidentes documentados/)).toBeTruthy()
  })

  // ⚠️ O caso barrado precisa APARECER, com o motivo legível. Descarte silencioso
  // some com conteúdo bom e ninguém percebe.
  it('mostra a bandeira e o motivo do caso barrado', () => {
    render(
      <RevisaoCasos
        casos={[
          caso({
            incluido: false,
            bandeiras: [{ tipo: 'nome_proprio', detalhe: 'possível nome próprio: Ambar' }],
          }),
        ]}
        fontes={FONTES}
        aceite={false}
        onChange={() => {}}
        onAceite={() => {}}
      />
    )
    expect(screen.getByText(/não entra sem sua liberação/i)).toBeTruthy()
    expect(screen.getByText(/Possível nome próprio/)).toBeTruthy()
    expect(screen.getByText(/Ambar/)).toBeTruthy()
  })

  it('editar o texto do caso avisa quem controla o estado', () => {
    const onChange = vi.fn()
    render(
      <RevisaoCasos casos={[caso()]} fontes={FONTES} aceite={false} onChange={onChange} onAceite={() => {}} />
    )
    fireEvent.change(screen.getByDisplayValue(/rede de clínicas/), {
      target: { value: 'Texto corrigido pelo vendedor' },
    })
    expect(onChange).toHaveBeenCalledWith([
      expect.objectContaining({ oQueAconteceu: 'Texto corrigido pelo vendedor' }),
    ])
  })

  it('o aceite nunca nasce marcado', () => {
    render(
      <RevisaoCasos casos={[caso()]} fontes={FONTES} aceite={false} onChange={() => {}} onAceite={() => {}} />
    )
    const aceite = screen.getByLabelText(/assumo o conteúdo/i) as HTMLInputElement
    expect(aceite.checked).toBe(false)
  })
})
