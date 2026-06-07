import { describe, it, expect } from 'vitest'
import { updateUserSchema } from '../user'

describe('updateUserSchema', () => {
  it('accepts a full valid payload', () => {
    const parsed = updateUserSchema.parse({
      name: 'Marcos',
      role: 'gerencia',
      position: 'Lead',
      department: 'tecnologia',
      password: 'segredo123',
      companyId: 'c1',
      teamIds: ['t1', 't2'],
      companyIds: ['c2', 'c3'],
    })
    expect(parsed.companyIds).toEqual(['c2', 'c3'])
    expect(parsed.teamIds).toEqual(['t1', 't2'])
  })

  it('accepts a minimal payload (all fields optional)', () => {
    expect(() => updateUserSchema.parse({})).not.toThrow()
  })

  it('accepts companyId as null (unlink primary company)', () => {
    const parsed = updateUserSchema.parse({ companyId: null })
    expect(parsed.companyId).toBeNull()
  })

  it('rejects an invalid role', () => {
    expect(() => updateUserSchema.parse({ role: 'superadmin' })).toThrow()
  })

  it('rejects a too-short password', () => {
    expect(() => updateUserSchema.parse({ password: '123' })).toThrow()
  })

  it('rejects companyIds with non-string entries', () => {
    expect(() => updateUserSchema.parse({ companyIds: ['ok', 123] })).toThrow()
  })
})
