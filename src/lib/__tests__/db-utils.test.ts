import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/db', () => ({
  db: {
    activity: {
      findMany: vi.fn(),
    },
  },
}))

import { db } from '@/lib/db'
import { getDatabaseProvider, supportsCaseInsensitiveMode, findDuplicateActivity } from '../db-utils'

const mockFindMany = vi.mocked(db.activity.findMany)

describe('getDatabaseProvider', () => {
  const originalEnv = process.env.DATABASE_URL

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv
  })

  it('detects postgresql://', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db'
    expect(getDatabaseProvider()).toBe('postgresql')
  })

  it('returns sqlite as default', () => {
    process.env.DATABASE_URL = ''
    expect(getDatabaseProvider()).toBe('sqlite')
  })
})

describe('supportsCaseInsensitiveMode', () => {
  const originalEnv = process.env.DATABASE_URL

  afterEach(() => {
    process.env.DATABASE_URL = originalEnv
  })

  it('returns true for postgresql', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@host/db'
    expect(supportsCaseInsensitiveMode()).toBe(true)
  })
})

describe('findDuplicateActivity', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('finds case-insensitive match', async () => {
    mockFindMany.mockResolvedValue([
      { id: '1', title: 'Test Activity', area: 'Tech' },
    ] as any)
    const result = await findDuplicateActivity('user-1', 'test activity', 'tech')
    expect(result).toEqual({ id: '1', title: 'Test Activity', area: 'Tech' })
  })

  it('returns null without match', async () => {
    mockFindMany.mockResolvedValue([
      { id: '1', title: 'Other', area: 'Sales' },
    ] as any)
    const result = await findDuplicateActivity('user-1', 'test activity', 'tech')
    expect(result).toBeNull()
  })
})
