/**
 * Backfill Script: Demanda.assignee (string) → Demanda.assignedToId (FK)
 *
 * Para cada Demanda com `assignee != null` e `assignedToId == null`:
 *   - Faz lookup de User na MESMA company onde User.name == assignee OU User.email == assignee
 *   - Se 1 candidato: popula assignedToId
 *   - Se 2+ candidatos: escolhe o mais antigo (createdAt asc), loga warning
 *   - Se 0 candidatos: registra em unresolved_assignees.log para revisão manual
 *
 * Idempotente: filtra por `assignedToId IS NULL`, então re-run não corrompe.
 * Não-destrutivo: nunca apaga a string `assignee`.
 *
 * Uso (após aplicar a migration `add_assignee_fk`):
 *   npx tsx scripts/backfill-assignee.ts
 *   # Output:
 *   #   - Resolved: N
 *   #   - Multi-match (picked oldest): M
 *   #   - Unresolved: K (ver unresolved_assignees.log)
 */

import { PrismaClient } from '@prisma/client'
import { writeFileSync } from 'node:fs'
import { resolveAssignee } from '../src/lib/assignee-resolution'

const prisma = new PrismaClient()

interface UnresolvedEntry {
  demandaId: string
  assignee: string
  companyId: string | null
  reason: 'no_company' | 'no_match' | 'no_assignee'
}

async function main() {
  console.log('=== Backfill: Demanda.assignee (string) → assignedToId (FK) ===\n')

  const demandas = await prisma.demanda.findMany({
    where: {
      assignee: { not: null },
      assignedToId: null,
    },
    select: {
      id: true,
      assignee: true,
      companyId: true,
    },
  })

  console.log(`Demandas para backfill: ${demandas.length}\n`)
  if (demandas.length === 0) {
    console.log('Nenhuma demanda pendente. Saindo.')
    return
  }

  const unresolved: UnresolvedEntry[] = []
  let resolvedCount = 0
  let multiMatchCount = 0

  for (const d of demandas) {
    const candidates = d.companyId && d.assignee
      ? await prisma.user.findMany({
          where: {
            companyId: d.companyId,
            OR: [{ name: d.assignee }, { email: d.assignee }],
          },
          orderBy: { createdAt: 'asc' },
          select: { id: true, name: true, email: true, createdAt: true },
        })
      : []

    const outcome = resolveAssignee({
      assignee: d.assignee,
      demandaCompanyId: d.companyId,
      candidates,
    })

    if (outcome.kind === 'unresolved') {
      unresolved.push({
        demandaId: d.id,
        assignee: d.assignee ?? '',
        companyId: d.companyId,
        reason: outcome.reason,
      })
      continue
    }

    if (outcome.multiMatch) {
      multiMatchCount++
      const picked = candidates.find((c) => c.id === outcome.userId)!
      console.warn(
        `  ⚠ Multi-match para "${d.assignee}" em ${d.companyId} (${candidates.length} candidatos). Escolhendo o mais antigo: ${picked.id} (${picked.name ?? picked.email})`
      )
    }

    await prisma.demanda.update({
      where: { id: d.id },
      data: { assignedToId: outcome.userId },
    })
    resolvedCount++
  }

  if (unresolved.length > 0) {
    writeFileSync('unresolved_assignees.log', JSON.stringify(unresolved, null, 2), 'utf8')
  }

  console.log('\n=== Resultado ===')
  console.log(`✓ Resolved:        ${resolvedCount}`)
  console.log(`⚠ Multi-match:     ${multiMatchCount} (escolhido o mais antigo)`)
  console.log(`✗ Unresolved:      ${unresolved.length} ${unresolved.length > 0 ? '(ver unresolved_assignees.log)' : ''}`)
  console.log(`Total processado:  ${demandas.length}`)
}

main()
  .catch((e) => {
    console.error('Backfill falhou:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
