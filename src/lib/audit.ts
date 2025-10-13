import { db } from '@/lib/db'

interface CreateAuditLogParams {
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  entityType: string
  entityId: string
  userId: string
  userEmail: string
  changes?: any
}

export async function createAuditLog({
  action,
  entityType,
  entityId,
  userId,
  userEmail,
  changes
}: CreateAuditLogParams) {
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
}
