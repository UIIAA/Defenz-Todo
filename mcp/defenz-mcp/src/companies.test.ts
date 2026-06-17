import { describe, it, expect } from 'vitest'
import { resolveCompanyId, COMPANY_HELP } from './companies.js'

describe('resolveCompanyId', () => {
  it('resolve nome exato (case/acento-insensível)', () => {
    expect(resolveCompanyId('Grafono')).toBe('cmnuwl2yg0002l7046rwhmxu9')
    expect(resolveCompanyId('COW CYCLING')).toBe('cmnd3a1yr000q3oq80irkal13')
    expect(resolveCompanyId('defenz')).toBe('cmn8wi8ze00003ouacf33hseb')
  })

  it('resolve por alias (psi → PSI.SheilaCarvalho)', () => {
    expect(resolveCompanyId('psi')).toBe('cmq3yyutf0000jo04bv6a5kmg')
    expect(resolveCompanyId('cow')).toBe('cmnd3a1yr000q3oq80irkal13')
  })

  it('aceita um companyId cru conhecido (passthrough)', () => {
    expect(resolveCompanyId('cmn8wi8ze00003ouacf33hseb')).toBe('cmn8wi8ze00003ouacf33hseb')
  })

  it('lança erro acionável em empresa desconhecida', () => {
    expect(() => resolveCompanyId('NubankXYZ')).toThrow(/desconhecida/i)
  })

  it('COMPANY_HELP lista as empresas válidas', () => {
    expect(COMPANY_HELP).toMatch(/Defenz/)
    expect(COMPANY_HELP).toMatch(/Grafono/)
  })
})
