/**
 * Migration Script: Team (flat) → Company + Team (hierarchical)
 *
 * 1. For each existing Team, create a Company with the same name
 * 2. Create a default Team "Geral" inside each Company
 * 3. Migrate User.teamId → User.companyId + create UserTeam for "Geral"
 * 4. Migrate Demanda.teamId → Demanda.companyId + Demanda.teamId = "Geral"
 * 5. Migrate InviteToken.teamId → InviteToken.companyId
 * 6. Record AuditLog
 *
 * Usage: npx tsx scripts/migrate-hierarchy.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('=== Migration: Team → Company + Team hierarchy ===\n')

  // Step 1: Read all old Team records via raw SQL (model renamed)
  const oldTeams = await prisma.$queryRaw<Array<{ id: string; name: string }>>`
    SELECT id, name FROM "Team" WHERE id NOT IN (SELECT id FROM "Team" WHERE "companyId" IS NOT NULL)
  `.catch(() => {
    // If the old Team table doesn't exist or has companyId, it means schema already migrated
    console.log('Old Team table not found or already migrated. Checking for companies...')
    return [] as Array<{ id: string; name: string }>
  })

  if (oldTeams.length === 0) {
    // Check if companies already exist
    const companyCount = await prisma.company.count()
    if (companyCount > 0) {
      console.log(`Already migrated: ${companyCount} companies found.`)
      return
    }

    // No old teams and no companies — create default
    console.log('No existing teams found. Creating default Company "Defenz" with Team "Geral"...')
    const company = await prisma.company.create({
      data: { name: 'Defenz' },
    })
    const team = await prisma.team.create({
      data: { name: 'Geral', companyId: company.id },
    })

    // Assign all users to this company and team
    const users = await prisma.user.findMany({ select: { id: true } })
    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { companyId: company.id },
      })
      await prisma.userTeam.create({
        data: { userId: user.id, teamId: team.id },
      })
    }

    // Assign all demandas to this company and team
    await prisma.$executeRaw`UPDATE "demandas" SET "companyId" = ${company.id}, "teamId" = ${team.id} WHERE "companyId" IS NULL`

    // Update invites
    await prisma.$executeRaw`UPDATE "InviteToken" SET "companyId" = ${company.id} WHERE "companyId" IS NULL`

    console.log(`Created Company "${company.name}" (${company.id})`)
    console.log(`Created Team "Geral" (${team.id})`)
    console.log(`Migrated ${users.length} users`)
    console.log('Done!')
    return
  }

  // Step 2: For each old team, create a Company + default Team
  for (const oldTeam of oldTeams) {
    console.log(`\nProcessing old Team: "${oldTeam.name}" (${oldTeam.id})`)

    // Create Company
    const company = await prisma.company.upsert({
      where: { name: oldTeam.name },
      update: {},
      create: { name: oldTeam.name },
    })
    console.log(`  → Company: "${company.name}" (${company.id})`)

    // Create default Team "Geral"
    const defaultTeam = await prisma.team.upsert({
      where: { companyId_name: { companyId: company.id, name: 'Geral' } },
      update: {},
      create: { name: 'Geral', companyId: company.id },
    })
    console.log(`  → Team "Geral": ${defaultTeam.id}`)

    // Migrate users: oldTeam.teamId → companyId + UserTeam
    const users = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM "User" WHERE "teamId" = ${oldTeam.id}
    `.catch(() => [] as Array<{ id: string }>)

    for (const user of users) {
      await prisma.user.update({
        where: { id: user.id },
        data: { companyId: company.id },
      })
      await prisma.userTeam.upsert({
        where: { userId_teamId: { userId: user.id, teamId: defaultTeam.id } },
        update: {},
        create: { userId: user.id, teamId: defaultTeam.id },
      })
    }
    console.log(`  → Migrated ${users.length} users`)

    // Migrate demandas: old teamId → companyId + new teamId
    const demandasResult = await prisma.$executeRaw`
      UPDATE "demandas" SET "companyId" = ${company.id}, "teamId" = ${defaultTeam.id}
      WHERE "teamId" = ${oldTeam.id} OR ("teamId" IS NULL AND "userId" IN (
        SELECT id FROM "User" WHERE "companyId" = ${company.id}
      ))
    `
    console.log(`  → Migrated ${demandasResult} demandas`)

    // Migrate invites
    const invitesResult = await prisma.$executeRaw`
      UPDATE "InviteToken" SET "companyId" = ${company.id}
      WHERE "teamId" = ${oldTeam.id}
    `.catch(() => 0)
    console.log(`  → Migrated ${invitesResult} invites`)
  }

  // Handle orphan users (no teamId)
  const orphanUsers = await prisma.user.findMany({
    where: { companyId: null },
    select: { id: true },
  })

  if (orphanUsers.length > 0) {
    // Assign to first company
    const firstCompany = await prisma.company.findFirst()
    if (firstCompany) {
      const firstTeam = await prisma.team.findFirst({
        where: { companyId: firstCompany.id },
      })
      for (const user of orphanUsers) {
        await prisma.user.update({
          where: { id: user.id },
          data: { companyId: firstCompany.id },
        })
        if (firstTeam) {
          await prisma.userTeam.upsert({
            where: { userId_teamId: { userId: user.id, teamId: firstTeam.id } },
            update: {},
            create: { userId: user.id, teamId: firstTeam.id },
          })
        }
      }
      console.log(`\nMigrated ${orphanUsers.length} orphan users to "${firstCompany.name}"`)
    }
  }

  // AuditLog
  const adminUser = await prisma.user.findFirst({
    where: { role: 'admin' },
    select: { id: true, email: true },
  })

  if (adminUser) {
    await prisma.auditLog.create({
      data: {
        action: 'MIGRATION',
        entityType: 'System',
        entityId: 'hierarchy-migration',
        userId: adminUser.id,
        userEmail: adminUser.email,
        changes: JSON.stringify({
          description: 'Migrated from flat Team to Company > Team hierarchy',
          date: new Date().toISOString(),
        }),
      },
    })
  }

  console.log('\n=== Migration complete! ===')
}

main()
  .catch((e) => {
    console.error('Migration failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
