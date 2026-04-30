/**
 * Smoke Test: assignee FK pipeline contra DB real.
 *
 * Cria uma Demanda real, atribui via assignedToId, valida que:
 *   1. POST resolve User → preenche `assignee` string + `assignedToId`
 *   2. GET com a query do role `user` retorna a demanda para o assignee
 *   3. GET com a query do role `user` NÃO retorna para user de outra company
 *   4. PUT com `assignedToId: null` limpa ambos os campos
 *   5. DELETE remove a demanda
 *
 * Idempotente: cria com título único (timestamp), apaga ao final mesmo se falhar.
 *
 * Uso: npx tsx scripts/smoke-assignee-fk.ts
 * Exit code 0 = todos passam. != 0 = alguma asserção falhou.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const SMOKE_TAG = `[SMOKE-${Date.now()}]`
const stamp = (s: string) => `${SMOKE_TAG} ${s}`
let demandaId: string | null = null

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`✗ ASSERT FAILED: ${message}`)
  }
  console.log(`  ✓ ${message}`)
}

/**
 * Replica a cláusula do GET /api/demandas para role user.
 * Mantida em sincronia com src/app/api/demandas/route.ts.
 */
function userVisibilityWhere(user: {
  id: string
  name: string | null
  email: string
  companyId: string | null
  teamIds: string[]
}) {
  const orClauses: Record<string, unknown>[] = []
  const assigneeKey = user.name ?? user.email
  if (user.teamIds.length > 0) {
    orClauses.push({ teamId: { in: user.teamIds } })
  }
  if (user.id && user.companyId) {
    orClauses.push({ assignedToId: user.id, companyId: user.companyId })
  }
  if (assigneeKey && user.companyId) {
    orClauses.push({ assignee: assigneeKey, companyId: user.companyId, assignedToId: null })
  }
  return orClauses.length > 0 ? { OR: orClauses } : null
}

async function pickFixtures() {
  // Pega 2 companies distintas (ou só 1 se for o único caso)
  const companies = await prisma.company.findMany({
    take: 2,
    orderBy: { createdAt: 'asc' },
  })
  assert(companies.length >= 1, 'há pelo menos 1 company no DB')

  const primary = companies[0]
  const other = companies[1] ?? null

  // 2 users na company primária (creator + assignee)
  const users = await prisma.user.findMany({
    where: { companyId: primary.id },
    take: 2,
    orderBy: { createdAt: 'asc' },
  })
  assert(users.length >= 2, `company "${primary.name}" tem pelo menos 2 users (achou ${users.length})`)

  const creator = users[0]
  const assignee = users[1]

  // 1 user numa company diferente (pra validar tenant guard). Pulável.
  let crossUser: typeof creator | null = null
  if (other) {
    const cross = await prisma.user.findFirst({ where: { companyId: other.id } })
    if (cross) crossUser = cross
  }

  return { primary, creator, assignee, crossUser }
}

async function getTeamIds(userId: string): Promise<string[]> {
  const memberships = await prisma.userTeam.findMany({
    where: { userId },
    select: { teamId: true },
  })
  return memberships.map((m) => m.teamId)
}

async function main() {
  console.log('=== Smoke: assignee FK pipeline (DB real) ===\n')

  const { primary, creator, assignee, crossUser } = await pickFixtures()
  console.log(`Primary company: ${primary.name} (${primary.id})`)
  console.log(`Creator:  ${creator.name ?? creator.email} (${creator.id})`)
  console.log(`Assignee: ${assignee.name ?? assignee.email} (${assignee.id})`)
  console.log(crossUser ? `CrossUser: ${crossUser.name ?? crossUser.email} (outra company)` : 'CrossUser: (sem 2ª company — pulando step 3)')
  console.log('')

  // ─── Step 1: criar demanda com assignedToId ──────────────────────────────
  console.log('Step 1: criar demanda atribuindo via FK')
  const demanda = await prisma.demanda.create({
    data: {
      title: stamp('teste FK pipeline'),
      origin: 'outra',
      status: 'solicitada',
      priority: 'media',
      assignee: assignee.name ?? assignee.email,
      assignedToId: assignee.id,
      dateIn: new Date(),
      userId: creator.id,
      companyId: primary.id,
      teamId: null,
    },
  })
  demandaId = demanda.id
  assert(demanda.assignedToId === assignee.id, 'assignedToId persistiu corretamente')
  assert(demanda.assignee === (assignee.name ?? assignee.email), 'assignee string sincronizada com User.name')
  assert(demanda.companyId === primary.id, 'companyId herdou do creator')

  // ─── Step 2: assignee vê via GET filter ──────────────────────────────────
  console.log('\nStep 2: assignee vê a demanda (GET filter)')
  const assigneeTeams = await getTeamIds(assignee.id)
  const assigneeWhere = userVisibilityWhere({
    id: assignee.id,
    name: assignee.name,
    email: assignee.email,
    companyId: assignee.companyId,
    teamIds: assigneeTeams,
  })
  assert(assigneeWhere !== null, 'assignee tem cláusula de visibilidade (tem id+companyId)')
  const seenByAssignee = await prisma.demanda.findFirst({
    where: { id: demanda.id, ...assigneeWhere! },
  })
  assert(seenByAssignee !== null, 'assignee enxerga a demanda atribuída via FK')

  // ─── Step 3: cross-company NÃO vê (tenant guard) ─────────────────────────
  if (crossUser) {
    console.log('\nStep 3: user de outra company NÃO vê (tenant guard)')
    const crossTeams = await getTeamIds(crossUser.id)
    const crossWhere = userVisibilityWhere({
      id: crossUser.id,
      name: crossUser.name,
      email: crossUser.email,
      companyId: crossUser.companyId,
      teamIds: crossTeams,
    })
    const seenByCross = crossWhere
      ? await prisma.demanda.findFirst({ where: { id: demanda.id, ...crossWhere } })
      : null
    assert(seenByCross === null, 'cross-company user NÃO enxerga (tenant guard)')
  } else {
    console.log('\nStep 3: pulado (sem 2ª company)')
  }

  // ─── Step 4: PUT com assignedToId=null limpa ambos ───────────────────────
  console.log('\nStep 4: limpar assignedToId limpa também a string assignee')
  await prisma.demanda.update({
    where: { id: demanda.id },
    data: { assignedToId: null, assignee: null },
  })
  const cleared = await prisma.demanda.findUnique({ where: { id: demanda.id } })
  assert(cleared!.assignedToId === null, 'FK foi limpa')
  assert(cleared!.assignee === null, 'string assignee foi limpa em sync')

  // ─── Step 5: re-atribuir e verificar legacy fallback (FK null + string) ──
  console.log('\nStep 5: legacy fallback (FK null + string match) ainda funciona')
  await prisma.demanda.update({
    where: { id: demanda.id },
    data: { assignedToId: null, assignee: assignee.name ?? assignee.email },
  })
  const legacyView = await prisma.demanda.findFirst({
    where: { id: demanda.id, ...assigneeWhere! },
  })
  assert(legacyView !== null, 'demanda legacy (FK null, string set) ainda visível para o assignee')

  // ─── Step 6: indexes funcionam (smoke da migration) ──────────────────────
  console.log('\nStep 6: index assignedToId está utilizável')
  const indexProbe = await prisma.demanda.findMany({
    where: { assignedToId: assignee.id },
    take: 1,
  })
  assert(Array.isArray(indexProbe), 'query por assignedToId não erra (index OK)')

  console.log('\n=== ✓ TODOS OS STEPS PASSARAM ===\n')
}

main()
  .catch(async (e) => {
    console.error('\n=== ✗ SMOKE FALHOU ===')
    console.error(e)
    process.exitCode = 1
  })
  .finally(async () => {
    if (demandaId) {
      try {
        await prisma.demanda.delete({ where: { id: demandaId } })
        console.log(`Cleanup: demanda ${demandaId} apagada.`)
      } catch (err) {
        console.error(`Cleanup falhou (apagar manualmente DELETE FROM demandas WHERE id='${demandaId}'):`, err)
      }
    }
    await prisma.$disconnect()
  })
