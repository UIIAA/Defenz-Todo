import { describe, it, expect, vi, beforeEach } from 'vitest'

// resolveDefenzCompanyId consulta o banco; aqui só interessa a REGRA.
vi.mock('@/lib/service-desk-server', () => ({
  resolveDefenzCompanyId: vi.fn(async () => 'defenz-id'),
}))

import { exigirEmissorDefenz } from '../emissao-documento'
import { ApiError } from '@/lib/api-helpers'

describe('exigirEmissorDefenz', () => {
  beforeEach(() => vi.clearAllMocks())

  it('deixa passar quem é da Defenz, em qualquer papel', async () => {
    // Marcos, 21/08: "Podem users também gerar. Mas só users Defenz."
    for (const role of ['user', 'gerencia', 'admin']) {
      await expect(
        exigirEmissorDefenz({ role, companyId: 'defenz-id', companyIds: [] })
      ).resolves.toBeUndefined()
    }
  })

  it('deixa passar quem tem a Defenz entre as empresas adicionais', async () => {
    await expect(
      exigirEmissorDefenz({
        role: 'gerencia',
        companyId: 'outra',
        companyIds: ['defenz-id'],
      })
    ).resolves.toBeUndefined()
  })

  it('recusa usuário de empresa-cliente com 403 explicando', async () => {
    // O documento leva a marca da Defenz: quem usa a plataforma como cliente
    // não emite, em papel nenhum.
    await expect(
      exigirEmissorDefenz({ role: 'gerencia', companyId: 'cliente-id', companyIds: [] })
    ).rejects.toMatchObject({ statusCode: 403 })

    await expect(
      exigirEmissorDefenz({ role: 'user', companyId: 'cliente-id', companyIds: [] })
    ).rejects.toBeInstanceOf(ApiError)
  })

  it('admin passa mesmo sem companyId — é operação da própria Defenz', async () => {
    await expect(
      exigirEmissorDefenz({ role: 'admin', companyId: undefined, companyIds: [] })
    ).resolves.toBeUndefined()
  })
})
