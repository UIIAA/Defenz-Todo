import { vi } from 'vitest'

export const mockDb = {
  demanda: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  activity: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
  },
  auditLog: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
}

vi.mock('@/lib/db', () => ({
  db: mockDb,
}))
