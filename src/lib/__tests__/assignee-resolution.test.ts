import { describe, it, expect } from 'vitest'
import { resolveAssignee, type ResolveCandidate } from '../assignee-resolution'

const makeCandidate = (overrides: Partial<ResolveCandidate> = {}): ResolveCandidate => ({
  id: 'user-1',
  name: 'Leonardo',
  email: 'leo@example.com',
  createdAt: new Date('2025-01-01T00:00:00Z'),
  ...overrides,
})

describe('resolveAssignee', () => {
  it('returns unresolved (no_assignee) when assignee is null', () => {
    const out = resolveAssignee({
      assignee: null,
      demandaCompanyId: 'company-defenz',
      candidates: [makeCandidate()],
    })
    expect(out).toEqual({ kind: 'unresolved', reason: 'no_assignee' })
  })

  it('returns unresolved (no_assignee) when assignee is whitespace-only', () => {
    const out = resolveAssignee({
      assignee: '   ',
      demandaCompanyId: 'company-defenz',
      candidates: [makeCandidate()],
    })
    expect(out).toEqual({ kind: 'unresolved', reason: 'no_assignee' })
  })

  it('returns unresolved (no_company) when demandaCompanyId is null (legacy data)', () => {
    const out = resolveAssignee({
      assignee: 'Leonardo',
      demandaCompanyId: null,
      candidates: [makeCandidate()],
    })
    expect(out).toEqual({ kind: 'unresolved', reason: 'no_company' })
  })

  it('returns unresolved (no_match) when there are zero candidates', () => {
    const out = resolveAssignee({
      assignee: 'Ghost',
      demandaCompanyId: 'company-defenz',
      candidates: [],
    })
    expect(out).toEqual({ kind: 'unresolved', reason: 'no_match' })
  })

  it('resolves single match to that user (multiMatch=false)', () => {
    const candidate = makeCandidate({ id: 'user-leo' })
    const out = resolveAssignee({
      assignee: 'Leonardo',
      demandaCompanyId: 'company-defenz',
      candidates: [candidate],
    })
    expect(out).toEqual({ kind: 'resolved', userId: 'user-leo', multiMatch: false })
  })

  it('resolves multi-match to the OLDEST createdAt (determinístico) and flags multiMatch', () => {
    const newer = makeCandidate({ id: 'user-newer', createdAt: new Date('2026-01-01T00:00:00Z') })
    const oldest = makeCandidate({ id: 'user-oldest', createdAt: new Date('2024-01-01T00:00:00Z') })
    const middle = makeCandidate({ id: 'user-middle', createdAt: new Date('2025-06-01T00:00:00Z') })
    const out = resolveAssignee({
      assignee: 'Leonardo',
      demandaCompanyId: 'company-defenz',
      candidates: [newer, oldest, middle], // ordem embaralhada
    })
    expect(out).toEqual({ kind: 'resolved', userId: 'user-oldest', multiMatch: true })
  })

  it('does not mutate the candidates array passed in', () => {
    const candidates = [
      makeCandidate({ id: 'b', createdAt: new Date('2025-02-01Z') }),
      makeCandidate({ id: 'a', createdAt: new Date('2024-01-01Z') }),
    ]
    const original = [...candidates]
    resolveAssignee({
      assignee: 'Leonardo',
      demandaCompanyId: 'company-defenz',
      candidates,
    })
    expect(candidates).toEqual(original)
  })

  it('trims whitespace around assignee before non-empty check', () => {
    // Caso clássico do prejuízo #4 (whitespace) — caller deve passar trimado,
    // mas a função aceita defensivamente.
    const out = resolveAssignee({
      assignee: '  Leonardo  ',
      demandaCompanyId: 'company-defenz',
      candidates: [makeCandidate()],
    })
    expect(out.kind).toBe('resolved')
  })
})
