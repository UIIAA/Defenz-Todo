import { db } from '@/lib/db'

interface CreateAuditLogParams {
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'ESCALATE' | 'LINK'
  entityType: string
  entityId: string
  userId: string
  userEmail: string
  changes?: Record<string, { from: unknown; to: unknown }> | null
}

export async function createAuditLog({
  action,
  entityType,
  entityId,
  userId,
  userEmail,
  changes
}: CreateAuditLogParams) {
  try {
    return await db.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        userId,
        userEmail,
        changes: changes ? JSON.stringify(changes) : null
      }
    })
  } catch (err) {
    console.error('Audit log failed:', err)
  }
}

export function diffChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[]
): Record<string, { from: unknown; to: unknown }> | null {
  const changes: Record<string, { from: unknown; to: unknown }> = {}

  for (const field of fields) {
    const fromVal = before[field]
    const toVal = after[field]
    if (String(fromVal ?? '') !== String(toVal ?? '')) {
      changes[field] = { from: fromVal ?? null, to: toVal ?? null }
    }
  }

  return Object.keys(changes).length > 0 ? changes : null
}
