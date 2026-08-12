import { describe, it, expect } from 'vitest'
import { diffChanges } from '../audit'

const before = {
  title: 'Título antigo',
  status: 'em_andamento',
  assignee: 'Leonardo',
  spentMinutes: 120,
  dateDone: null,
}

describe('diffChanges — PUT parcial não pode inventar mudança', () => {
  // O bug (aberto desde junho): num PUT parcial o payload não traz os campos que
  // ninguém quis mexer. `after[campo]` vinha `undefined`, virava '' na comparação
  // e o log registrava `{ from: 'Leonardo', to: null }` — uma troca de responsável
  // que nunca aconteceu. Afetava MCP (`move_demanda`, `update_demanda`) e curl.
  it('ignora campo AUSENTE do payload em vez de logar "→ null"', () => {
    const changes = diffChanges(before, { status: 'concluido' }, [
      'title',
      'status',
      'assignee',
      'spentMinutes',
    ])

    expect(changes).toEqual({ status: { from: 'em_andamento', to: 'concluido' } })
    expect(changes).not.toHaveProperty('assignee')
    expect(changes).not.toHaveProperty('title')
  })

  it('mas AINDA registra quando o campo é enviado explicitamente como null', () => {
    // Limpar o responsável de propósito é uma mudança real e precisa de rastro.
    // É por isso que a checagem é pela PRESENÇA da chave, não pelo valor.
    const changes = diffChanges(before, { assignee: null }, ['assignee'])
    expect(changes).toEqual({ assignee: { from: 'Leonardo', to: null } })
  })

  it('trata `undefined` explícito como "não mexa", igual a chave ausente', () => {
    const changes = diffChanges(before, { assignee: undefined }, ['assignee'])
    expect(changes).toBeNull()
  })

  it('devolve null quando o payload parcial não muda nada', () => {
    expect(diffChanges(before, { status: 'em_andamento' }, ['status', 'title'])).toBeNull()
  })

  it('objeto completo continua funcionando como antes (rotas que passam o after inteiro)', () => {
    const depois = { ...before, title: 'Título novo', spentMinutes: 180 }
    expect(diffChanges(before, depois, ['title', 'status', 'assignee', 'spentMinutes'])).toEqual({
      title: { from: 'Título antigo', to: 'Título novo' },
      spentMinutes: { from: 120, to: 180 },
    })
  })

  it('não confunde 0 e string vazia com ausência', () => {
    const changes = diffChanges({ spentMinutes: 120, obs: 'algo' }, { spentMinutes: 0, obs: '' }, [
      'spentMinutes',
      'obs',
    ])
    expect(changes).toEqual({
      spentMinutes: { from: 120, to: 0 },
      obs: { from: 'algo', to: '' },
    })
  })
})

describe('diffChanges — o que o servidor deriva sozinho também precisa de rastro', () => {
  // Regressão possível ao corrigir o PUT parcial: se a rota diffar o PAYLOAD, a
  // limpeza de `dateDone` ao reabrir uma demanda concluída (feita pelo servidor,
  // não pelo usuário) some da auditoria — some justamente a mudança mais
  // relevante. Por isso as rotas passam a LINHA ATUALIZADA como `after`.
  it('diffando objetos completos, captura campo limpo pelo servidor', () => {
    const antes = { status: 'concluida', dateDone: new Date('2026-08-01'), description: 'x' }
    const depois = { status: 'em_andamento', dateDone: null, description: 'x\n\n* Reaberta em 12/08/2026' }

    const changes = diffChanges(antes, depois, ['status', 'dateDone', 'description'])

    expect(changes).toHaveProperty('dateDone')
    expect(changes!.dateDone.to).toBeNull()
    expect(changes).toHaveProperty('status')
    expect(changes).toHaveProperty('description')
  })
})
