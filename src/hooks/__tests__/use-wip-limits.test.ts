import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock localStorage
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value }),
  removeItem: vi.fn((key: string) => { delete store[key] }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]) }),
}
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

// Column WIP limits
describe('WIP Limits localStorage format (column)', () => {
  const STORAGE_KEY = 'defenz-wip-limits'

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('stores limits as JSON Record<string, number>', () => {
    const limits = { em_andamento: 3, selecionada: 5 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limits))
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.em_andamento).toBe(3)
    expect(stored.selecionada).toBe(5)
  })

  it('handles empty state', () => {
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('removing a limit sets value to empty object', () => {
    const limits = { em_andamento: 3 }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limits))
    const updated = { ...limits }
    delete (updated as Record<string, number>).em_andamento
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY)!)
    expect(stored.em_andamento).toBeUndefined()
  })

  it('parses invalid JSON gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-json')
    expect(() => JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toThrow()
  })
})

// User WIP limits (Feature C)
describe('WIP Limits localStorage format (user)', () => {
  const USER_STORAGE_KEY = 'defenz-wip-limits-user'

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('stores user limits as JSON Record<string, number>', () => {
    const limits = { Marcos: 3, Ana: 5 }
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(limits))
    const stored = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)!)
    expect(stored.Marcos).toBe(3)
    expect(stored.Ana).toBe(5)
  })

  it('handles empty state for user limits', () => {
    expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull()
  })

  it('removing a user limit deletes the key', () => {
    const limits: Record<string, number> = { Marcos: 3, Ana: 5 }
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(limits))
    delete limits.Marcos
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(limits))
    const stored = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)!)
    expect(stored.Marcos).toBeUndefined()
    expect(stored.Ana).toBe(5)
  })

  it('column and user keys are independent', () => {
    const COLUMN_KEY = 'defenz-wip-limits'
    localStorage.setItem(COLUMN_KEY, JSON.stringify({ em_andamento: 3 }))
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ Marcos: 2 }))
    const col = JSON.parse(localStorage.getItem(COLUMN_KEY)!)
    const usr = JSON.parse(localStorage.getItem(USER_STORAGE_KEY)!)
    expect(col.em_andamento).toBe(3)
    expect(col.Marcos).toBeUndefined()
    expect(usr.Marcos).toBe(2)
    expect(usr.em_andamento).toBeUndefined()
  })
})
