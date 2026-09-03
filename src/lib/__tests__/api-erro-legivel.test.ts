import { describe, it, expect } from 'vitest'
import { mensagemDeErroApi } from '../api-erro-legivel'

const ACAO = 'Falha ao gerar a apresentação'

describe('mensagemDeErroApi — o 400 tem de dizer QUAL campo', () => {
  // ⚠️ O caso real: o Gustavo colou a descrição inteira do órgão no campo de
  // setor (limite 80) e a tela só disse "HTTP 400".
  it('mostra o campo e o motivo que vieram em details', () => {
    const msg = mensagemDeErroApi(
      {
        success: false,
        error: 'Dados inválidos',
        details: [{ field: 'setor', message: 'String must contain at most 80 character(s)' }],
      },
      400,
      ACAO
    )
    expect(msg).toContain('Setor do cliente')
    expect(msg).toContain('80')
  })

  it('usa o texto do servidor quando não há details', () => {
    expect(mensagemDeErroApi({ error: 'Nao autorizado' }, 401, ACAO)).toBe('Nao autorizado')
  })

  it('aceita também o formato de erro como objeto', () => {
    expect(mensagemDeErroApi({ error: { message: 'Limite diário atingido' } }, 429, ACAO)).toBe(
      'Limite diário atingido'
    )
  })

  it('cai no genérico com status quando a resposta não é JSON útil', () => {
    expect(mensagemDeErroApi(null, 500, ACAO)).toBe(`${ACAO} (HTTP 500)`)
    expect(mensagemDeErroApi('<html>', 502, ACAO)).toBe(`${ACAO} (HTTP 502)`)
  })
})
