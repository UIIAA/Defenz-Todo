import { describe, it, expect } from 'vitest'
import {
  COMPARATIVO,
  FUNCIONALIDADES,
  recomendarNivel,
  disponivelEm,
  funcionalidade,
} from '../comparativo'
import { PROVAS, PROIBIDO, BITDEFENDER } from '../institucional-fatos'
import { MERCADO_FATOS, fatosParaSetor, normalizarSetor } from '../mercado-fatos'

describe('comparativo — transcrição do PDF da Defenz', () => {
  it('tem as 12 funcionalidades, e o enum casa com a tabela', () => {
    expect(COMPARATIVO).toHaveLength(12)
    expect(COMPARATIVO.map((f) => f.id).sort()).toEqual([...FUNCIONALIDADES].sort())
  })

  it('respeita a matriz do documento: 8 no básico, 3 no Premium, 1 no Enterprise', () => {
    const conta = (n: string) => COMPARATIVO.filter((f) => f.aPartirDe === n).length
    expect(conta('BUSINESS_SECURITY')).toBe(8)
    expect(conta('PREMIUM')).toBe(3)
    expect(conta('ENTERPRISE')).toBe(1)
    // XEDR é o único exclusivo do Enterprise — é o que justifica o degrau
    expect(funcionalidade('XEDR').aPartirDe).toBe('ENTERPRISE')
    expect(disponivelEm('XEDR', 'PREMIUM')).toBe(false)
    expect(disponivelEm('ANTIMALWARE', 'BUSINESS_SECURITY')).toBe(true)
  })
})

describe('recomendarNivel', () => {
  it('necessidade que exige XEDR sobe para Enterprise', () => {
    expect(recomendarNivel(['XEDR'])).toBe('ENTERPRISE')
    expect(recomendarNivel(['ANTIMALWARE', 'XEDR', 'FIREWALL'])).toBe('ENTERPRISE')
  })

  it('necessidade coberta pelo básico NÃO empurra plano', () => {
    // O contrário seria a IA fazendo upsell — e o vendedor descobrindo depois.
    expect(recomendarNivel(['ANTIMALWARE', 'FIREWALL', 'MITIGACAO_RANSOMWARE'])).toBe(
      'BUSINESS_SECURITY'
    )
  })

  it('HyperDetect e sandbox param no Premium', () => {
    expect(recomendarNivel(['HYPERDETECT', 'ANALISADOR_SANDBOX'])).toBe('PREMIUM')
  })

  it('pesquisa vazia recomenda a entrada, não o topo', () => {
    // spec §6.7: sem argumento, não se empurra plano.
    expect(recomendarNivel([])).toBe('BUSINESS_SECURITY')
  })
})

describe('fatos de mercado', () => {
  it('todo fato tem número, fonte e ano', () => {
    for (const f of MERCADO_FATOS) {
      expect(f.valor.length).toBeGreaterThan(0)
      expect(f.fonte.length).toBeGreaterThan(0)
      expect(f.ano).toBeTruthy()
    }
  })

  it('o fato do setor vem primeiro; o nacional é contexto', () => {
    const saude = fatosParaSetor('Saúde')
    expect(saude[0].id).toBe('M2-saude')
    expect(saude.some((f) => f.id === 'M1')).toBe(true)
    expect(normalizarSetor('Saúde')).toBe('saude')
  })

  it('setor sem fato específico devolve só os transversais, sem inventar', () => {
    const padaria = fatosParaSetor('Padaria de bairro')
    expect(padaria.every((f) => !f.setores?.length)).toBe(true)
    expect(padaria.length).toBeGreaterThan(0)
    // e sem setor nenhum funciona igual
    expect(fatosParaSetor().length).toBe(padaria.length)
  })

  it('não mistura setores: financeiro não puxa o número da saúde', () => {
    const fin = fatosParaSetor('financeiro')
    expect(fin.some((f) => f.id === 'M2-saude')).toBe(false)
    expect(fin[0].id).toBe('M2-financeiro')
  })
})

describe('A15 — o texto fixo não cita concorrente nem afirma superlativo', () => {
  // Decisão do Marcos, 21/08: "não precisa citar os concorrentes". Vira regra
  // executável aqui em vez de recomendação num documento que ninguém relê.
  const textos = [
    ...COMPARATIVO.flatMap((f) => [f.nome, f.descricao]),
    ...PROVAS.flatMap((p) => [p.texto, p.fonte]),
    ...MERCADO_FATOS.flatMap((f) => [f.texto, f.fonte]),
    ...Object.values(BITDEFENDER).map(String),
  ]

  it('nenhum concorrente é nomeado', () => {
    for (const nome of PROIBIDO.concorrentes) {
      const achou = textos.filter((t) => t.toLowerCase().includes(nome.toLowerCase()))
      expect(achou, `"${nome}" apareceu em: ${achou.join(' | ')}`).toHaveLength(0)
    }
  })

  it('nenhum superlativo de comparação implícita', () => {
    // "impacto mínimo" é o caso real: o AV-Comparatives 2025 dá 32,8 ao
    // Bitdefender, atrás de vários. Régua favorável pode; superlativo que a
    // outra régua contradiz, não.
    for (const frase of PROIBIDO.superlativos) {
      const achou = textos.filter((t) => t.toLowerCase().includes(frase.toLowerCase()))
      expect(achou, `"${frase}" apareceu em: ${achou.join(' | ')}`).toHaveLength(0)
    }
  })

  it('toda prova declara a fonte e se é independente ou do fabricante', () => {
    for (const p of PROVAS) {
      expect(p.fonte.length).toBeGreaterThan(0)
      expect(['independente', 'fabricante']).toContain(p.origem)
    }
    // O documento precisa ter ao menos uma prova INDEPENDENTE: prova só do
    // fabricante não convence quem "nunca ouviu falar".
    expect(PROVAS.filter((p) => p.origem === 'independente').length).toBeGreaterThanOrEqual(2)
  })
})
