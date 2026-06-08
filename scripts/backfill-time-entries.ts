/**
 * Backfill Script: seed do diário de horas (TimeEntry) — auto-corretivo e idempotente.
 *
 * Para cada Demanda com `totalSpentMinutes > 0` (card + subtarefas), calcula o **baseline**
 * que falta para o diário fechar com o total atual:
 *
 *     baseline = totalSpentMinutes − soma(lançamentos já existentes do card)
 *
 * Se `baseline !== 0`, insere 1 lançamento de ajuste (source="seed"):
 *   - minutes   = baseline (normalmente = totalSpentMinutes p/ cards nunca lançados)
 *   - userId    = assignedToId (Responsável; pode ser null)
 *   - userName  = assignee (snapshot; fallback "Desconhecido")
 *   - client    = demanda.client (snapshot)
 *   - createdAt = demanda.updatedAt
 *
 * Por que baseline (e não "pula se já tem lançamento"): se uma edição pós-deploy gravou um
 * delta ANTES do backfill, pular o card deixaria o baseline pré-feature de fora (subcontagem).
 * Calcular `total − somaExistente` garante o invariante `sum(entries) == totalSpentMinutes`
 * **independente da ordem** e torna o re-run um no-op (baseline vira 0). Não-destrutivo:
 * nunca toca `spentMinutes` do card/subtarefa (fonte da verdade).
 *
 * Uso (após `prisma db push` que cria a tabela time_entries):
 *   npx tsx scripts/backfill-time-entries.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Backfill: seed do diário de horas (TimeEntry) — auto-corretivo ===\n')

  // Soma dos lançamentos já existentes por card (deltas pós-deploy, re-runs, etc.).
  const sums = await prisma.timeEntry.groupBy({
    by: ['demandaId'],
    _sum: { minutes: true },
  })
  const existingByDemanda = new Map(sums.map((s) => [s.demandaId, s._sum.minutes ?? 0]))

  const demandas = await prisma.demanda.findMany({
    select: {
      id: true,
      assignedToId: true,
      assignee: true,
      client: true,
      spentMinutes: true,
      updatedAt: true,
      subtasks: { select: { spentMinutes: true } },
    },
  })

  let created = 0
  let skippedBalanced = 0
  let skippedZero = 0

  for (const d of demandas) {
    const total =
      (d.spentMinutes ?? 0) + d.subtasks.reduce((acc, s) => acc + (s.spentMinutes ?? 0), 0)
    if (total <= 0) {
      skippedZero++
      continue
    }
    const baseline = total - (existingByDemanda.get(d.id) ?? 0)
    if (baseline === 0) {
      skippedBalanced++ // diário já fecha com o total (idempotente)
      continue
    }

    await prisma.timeEntry.create({
      data: {
        demandaId: d.id,
        userId: d.assignedToId,
        userName: d.assignee ?? 'Desconhecido',
        minutes: baseline,
        client: d.client,
        source: 'seed',
        subtaskId: null,
        createdById: null,
        createdAt: d.updatedAt,
      },
    })
    created++
  }

  console.log(`Lançamentos de baseline criados: ${created}`)
  console.log(`Puladas (diário já fechava): ${skippedBalanced}`)
  console.log(`Puladas (0 minutos): ${skippedZero}`)
  console.log('\n✅ Backfill concluído — sum(entries) == totalSpentMinutes por card.')
}

main()
  .catch((err) => {
    console.error('Erro no backfill:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
