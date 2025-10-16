/**
 * Database Utilities
 *
 * Utilitários para queries cross-database (SQLite e PostgreSQL)
 */

import { db } from '@/lib/db'

/**
 * Verifica duplicatas case-insensitive de forma compatível com SQLite e PostgreSQL
 *
 * NOTA: Esta é uma solução temporária para desenvolvimento com SQLite.
 * Quando migrar para PostgreSQL/Neon em produção, considere otimizar para:
 *
 * ```typescript
 * const existing = await db.activity.findFirst({
 *   where: {
 *     userId,
 *     deletedAt: null,
 *     title: { equals: title, mode: 'insensitive' },
 *     area: { equals: area, mode: 'insensitive' }
 *   }
 * })
 * ```
 *
 * @param userId - ID do usuário
 * @param title - Título da atividade
 * @param area - Área da atividade
 * @param excludeId - ID da atividade a excluir (para updates)
 * @returns Atividade duplicada ou null
 */
export async function findDuplicateActivity(
  userId: string,
  title: string,
  area: string,
  excludeId?: string
) {
  // Buscar atividades do usuário (apenas campos necessários)
  const userActivities = await db.activity.findMany({
    where: {
      userId,
      deletedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {})
    },
    select: {
      id: true,
      title: true,
      area: true
    }
  })

  // Comparação case-insensitive manual (funciona em SQLite e PostgreSQL)
  const duplicate = userActivities.find(
    activity =>
      activity.title.toLowerCase() === title.toLowerCase() &&
      activity.area.toLowerCase() === area.toLowerCase()
  )

  return duplicate || null
}

/**
 * Retorna o provider do database atual
 * Útil para conditional queries baseadas no database
 */
export function getDatabaseProvider(): 'sqlite' | 'postgresql' {
  const dbUrl = process.env.DATABASE_URL || ''

  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) {
    return 'postgresql'
  }

  return 'sqlite'
}

/**
 * Verifica se o database suporta case-insensitive mode nativo
 */
export function supportsCaseInsensitiveMode(): boolean {
  return getDatabaseProvider() === 'postgresql'
}
