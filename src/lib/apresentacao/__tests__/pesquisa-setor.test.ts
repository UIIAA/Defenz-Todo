import { describe, it, expect } from 'vitest'
import {
  setorDoCnae,
  sugerirSetorPorCnpj,
  cnpjValido,
  faltaAncora,
} from '../pesquisa/setor'

describe('setorDoCnae — a divisão do CNAE decide, não o palpite', () => {
  it('mapeia as divisões que mais aparecem', () => {
    expect(setorDoCnae(8610101)).toBe('Saúde') // hospital
    expect(setorDoCnae(6201501)).toBe('Tecnologia') // software
    expect(setorDoCnae(4711302)).toBe('Varejo') // supermercado
    expect(setorDoCnae('64.62-0-00')).toBe('Financeiro') // holding, com máscara
    expect(setorDoCnae(8412400)).toBe('Setor público')
    expect(setorDoCnae(1091102)).toBe('Indústria') // padaria industrial
  })

  it('devolve indefinido quando não sabe — e não chuta', () => {
    expect(setorDoCnae(undefined)).toBeUndefined()
    expect(setorDoCnae('x')).toBeUndefined()
    expect(setorDoCnae(3400000)).toBeUndefined() // divisão 34 não existe no CNAE
  })
})

describe('sugerirSetorPorCnpj — sugestão, nunca decisão', () => {
  const resposta = (body: unknown, ok = true) =>
    async () => ({ ok, json: async () => body }) as unknown as Response

  it('traz setor, razão social e o CNAE que embasou', async () => {
    const s = await sugerirSetorPorCnpj(
      '11.222.333/0001-81',
      resposta({ razao_social: 'CLINICA X LTDA', cnae_fiscal: 8630503, cnae_fiscal_descricao: 'Atividade médica' })
    )
    expect(s).toMatchObject({ setor: 'Saúde', razaoSocial: 'CLINICA X LTDA', origem: 'cnae' })
  })

  // ⚠️ Uma API pública piscando não pode derrubar a apresentação inteira.
  it('degrada para "nenhuma" quando a API falha, sem lançar', async () => {
    const explode = async () => {
      throw new Error('rede')
    }
    expect(await sugerirSetorPorCnpj('11222333000181', explode)).toEqual({ origem: 'nenhuma' })
    expect(await sugerirSetorPorCnpj('11222333000181', resposta({}, false))).toEqual({
      origem: 'nenhuma',
    })
  })

  it('nem chama a API com CNPJ incompleto', async () => {
    let chamou = false
    await sugerirSetorPorCnpj('123', async () => {
      chamou = true
      return {} as Response
    })
    expect(chamou).toBe(false)
    expect(cnpjValido('123')).toBe(false)
  })
})

describe('faltaAncora — I4: sem âncora o formulário recusa', () => {
  it('recusa quando não há CNPJ, site nem descrição', () => {
    expect(faltaAncora({})).toBe(true)
    expect(faltaAncora({ cnpj: '  ' })).toBe(true)
  })

  it('aceita com qualquer uma das três', () => {
    expect(faltaAncora({ cnpj: '11222333000181' })).toBe(false)
    expect(faltaAncora({ site: 'acme.com.br' })).toBe(false)
    expect(faltaAncora({ descricao: 'rede de clínicas' })).toBe(false)
  })
})
