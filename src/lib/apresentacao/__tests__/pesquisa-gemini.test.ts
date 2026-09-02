import { describe, it, expect, vi } from 'vitest'
import {
  fontesDoGrounding,
  chamadaA,
  chamadaB,
  pesquisar,
  promptB,
  PesquisaSemGroundingError,
  type GerarConteudo,
} from '../pesquisa/gemini'
import type { GenerateContentResponse } from '@google/genai'

/** Resposta como a API devolve DE VERDADE (nomes conferidos em 22/08). */
function respostaA(texto: string): GenerateContentResponse {
  return {
    text: texto,
    candidates: [
      {
        groundingMetadata: {
          groundingChunks: [
            { web: { title: 'Ataque para rede de clínicas', uri: 'https://www.folha.uol.com.br/x' } },
            { web: { title: 'Hospital fora do ar', domain: 'g1.globo.com' } },
          ],
          groundingSupports: [{ segment: { startIndex: 0, endIndex: 10 } }],
        },
      },
    ],
  } as unknown as GenerateContentResponse
}

function respostaB(obj: unknown): GenerateContentResponse {
  return { text: JSON.stringify(obj) } as unknown as GenerateContentResponse
}

const CASO_OK = {
  oQueAconteceu: 'Uma rede de clínicas ficou 3 dias sem sistema.',
  entidadesRemovidas: ['Clínica São Rafael'],
  necessidade: 'Cortar o movimento lateral antes da criptografia.',
  funcionalidade: 'EDR',
  veiculo: 'Folha de S.Paulo',
  ano: 2025,
  fonteIdx: [0],
}

describe('fontesDoGrounding — lê os nomes que a API usa, não os do SDK legado', () => {
  it('extrai título e domínio, inclusive derivando o domínio da URI', () => {
    expect(fontesDoGrounding(respostaA('x'))).toEqual([
      { titulo: 'Ataque para rede de clínicas', dominio: 'folha.uol.com.br' },
      { titulo: 'Hospital fora do ar', dominio: 'g1.globo.com' },
    ])
  })

  it('devolve vazio quando não há grounding — e não explode', () => {
    expect(fontesDoGrounding({ text: 'oi' } as unknown as GenerateContentResponse)).toEqual([])
  })
})

describe('chamadaA — pede busca, e recusa resposta sem fonte', () => {
  it('manda a ferramenta googleSearch e devolve texto + fontes', async () => {
    const gerar = vi.fn(async () => respostaA('A rede parou 3 dias em 2025.')) as GerarConteudo
    const r = await chamadaA({ empresaNome: 'Acme', setor: 'Saúde' }, gerar)

    const req = (gerar as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(req.config.tools[0]).toHaveProperty('googleSearch')
    expect(r.fontes).toHaveLength(2)
    expect(r.texto).toContain('3 dias')
  })

  // ⚠️ O modo de falha do §6.2.1: 200, texto plausível, ZERO atribuição. Se isso
  // passar, o PDF sai com citação que ninguém pode conferir.
  it('explode quando a resposta vem sem groundingMetadata', async () => {
    const gerar = (async () => ({ text: 'texto plausível sem fonte' })) as unknown as GerarConteudo
    await expect(chamadaA({ empresaNome: 'Acme', setor: 'Saúde' }, gerar)).rejects.toThrow(
      PesquisaSemGroundingError
    )
  })
})

describe('chamadaB — sem ferramenta, JSON validado', () => {
  it('não manda ferramenta nenhuma: ela não pode ter internet', async () => {
    const gerar = vi.fn(async () =>
      respostaB({ panoramaSetor: 'p', casos: [], planoSugerido: 'PREMIUM', planoPorque: 'x' })
    ) as GerarConteudo
    await chamadaB('texto da A', gerar)

    const req = (gerar as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(req.config.tools).toBeUndefined()
    expect(req.config.responseMimeType).toBe('application/json')
  })

  it('recusa funcionalidade fora do enum fechado', async () => {
    const gerar = (async () =>
      respostaB({
        panoramaSetor: 'p',
        casos: [{ ...CASO_OK, funcionalidade: 'ANTIVIRUS_MAGICO' }],
        planoSugerido: 'PREMIUM',
        planoPorque: 'x',
      })) as unknown as GerarConteudo
    await expect(chamadaB('t', gerar)).rejects.toThrow()
  })

  it('o prompt proíbe acrescentar fato e manda devolver vazio', () => {
    const p = promptB('texto')
    expect(p).toContain('NÃO tem internet')
    expect(p).toContain('casos: []')
    expect(p).toContain('EDR')
  })
})

describe('pesquisar — A, B e as guardas, sem descartar nada', () => {
  const gerar = (async (req: { config?: { tools?: unknown } }) =>
    req.config?.tools
      ? respostaA('Uma rede de clínicas ficou 3 dias sem sistema em 2025.')
      : respostaB({
          panoramaSetor: 'panorama',
          casos: [CASO_OK, { ...CASO_OK, oQueAconteceu: 'A Clínica São Rafael perdeu 37%.' }],
          planoSugerido: 'PREMIUM',
          planoPorque: 'porque sim',
        })) as unknown as GerarConteudo

  it('devolve o caso limpo liberado e o sujo barrado — os dois presentes', async () => {
    const r = await pesquisar({ empresaNome: 'Acme', setor: 'Saúde' }, gerar)

    expect(r.casos).toHaveLength(2)
    expect(r.casos[0].bloqueado).toBe(false)
    expect(r.casos[1].bloqueado).toBe(true)
    expect(r.casos[1].bandeiras.map((b) => b.tipo)).toContain('entidade_vazou')
    expect(r.fontes).toHaveLength(2)
    expect(r.telemetria.qtdFontes).toBe(2)
    // O texto bruto viaja junto: é contra ele que o A13b confere cada dígito.
    expect(r.textoPesquisa).toContain('3 dias')
  })
})
