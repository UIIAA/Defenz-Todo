/**
 * Setup do Marcos como admin + usuário de recuperação + memberships multi-empresa.
 *
 * - Marcos@defenz.com.br → role=admin + membro (UserCompany) de todas as empresas alvo.
 * - Marcos.v.cruz222@gmail.com → novo usuário admin (recuperação), senha = a do Admin@defenz.com.br.
 * - NÃO altera a senha do Marcos@defenz.com.br (usuário informou que já é a mesma do admin).
 *
 * Idempotente. Uso:
 *   npx tsx scripts/setup-marcos-admin.ts --dry-run   # só mostra o que faria
 *   npx tsx scripts/setup-marcos-admin.ts             # aplica
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const DRY = process.argv.includes('--dry-run')

const TARGET_COMPANY_NAMES = ['Defenz', 'Cowcycling', 'Grafono', 'Sheila']
const MARCOS_EMAIL = 'marcos@defenz.com.br'
const RECOVERY_EMAIL = 'marcos.v.cruz222@gmail.com'
const ADMIN_EMAIL = 'admin@defenz.com.br'

async function main() {
  console.log(DRY ? '=== DRY RUN (nada gravado) ===' : '=== APLICANDO ===')

  const allCompanies = await prisma.company.findMany({ select: { id: true, name: true } })
  console.log('\nEmpresas no banco:', allCompanies.map((c) => c.name).join(' | '))

  // Fonte da senha: Admin@defenz.com.br se existir, senão o admin mais antigo (role=admin).
  let admin = await prisma.user.findFirst({
    where: { email: { equals: ADMIN_EMAIL, mode: 'insensitive' } },
  })
  if (!admin) {
    admin = await prisma.user.findFirst({ where: { role: 'admin' }, orderBy: { createdAt: 'asc' } })
    if (admin) console.log(`\n(${ADMIN_EMAIL} não existe — usando senha do admin existente como base)`)
  }
  if (!admin) throw new Error('Nenhum usuário admin encontrado p/ copiar a senha.')

  // Mapeia empresas-alvo por nome normalizado (ignora espaços/pontos/caixa, via contains)
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const targets = TARGET_COMPANY_NAMES.map((wanted) => {
    const w = norm(wanted)
    const found = allCompanies.find((c) => norm(c.name) === w || norm(c.name).includes(w))
    return { wanted, found }
  })
  for (const t of targets) {
    console.log(`  alvo "${t.wanted}" → ${t.found ? `OK (${t.found.name})` : '⚠ NÃO ENCONTRADA'}`)
  }
  const resolvedCompanies = targets.map((t) => t.found).filter((c): c is { id: string; name: string } => !!c)
  const defenz = resolvedCompanies.find((c) => c.name.toLowerCase().startsWith('defenz'))

  // 1) Marcos@defenz.com.br → admin + memberships
  const marcos = await prisma.user.findFirst({
    where: { email: { equals: MARCOS_EMAIL, mode: 'insensitive' } },
  })
  if (!marcos) {
    console.log(`\n⚠ ${MARCOS_EMAIL} NÃO encontrado — pulando setup do Marcos.`)
  } else {
    console.log(`\nMarcos: ${marcos.email} (role atual=${marcos.role}, companyId=${marcos.companyId})`)
    console.log(`  → role=admin${marcos.companyId ? '' : `, companyId=${defenz?.id ?? 'null'}`}`)
    if (!DRY) {
      await prisma.user.update({
        where: { id: marcos.id },
        data: { role: 'admin', companyId: marcos.companyId ?? defenz?.id ?? null },
      })
    }
    for (const c of resolvedCompanies) {
      console.log(`  membership Marcos ↔ ${c.name}`)
      if (!DRY) {
        await prisma.userCompany.upsert({
          where: { userId_companyId: { userId: marcos.id, companyId: c.id } },
          create: { userId: marcos.id, companyId: c.id },
          update: {},
        })
      }
    }
  }

  // 2) Recovery admin (Marcos.v.cruz222@gmail.com)
  const recovery = await prisma.user.findFirst({
    where: { email: { equals: RECOVERY_EMAIL, mode: 'insensitive' } },
  })
  if (recovery) {
    console.log(`\nRecovery user já existe: ${recovery.email} → garantindo role=admin + senha do admin`)
    if (!DRY) {
      await prisma.user.update({
        where: { id: recovery.id },
        data: { role: 'admin', password: admin.password, companyId: recovery.companyId ?? defenz?.id ?? null },
      })
    }
  } else {
    console.log(`\nCriar recovery admin: ${RECOVERY_EMAIL} (senha = a do ${ADMIN_EMAIL})`)
    if (!DRY) {
      await prisma.user.create({
        data: {
          email: RECOVERY_EMAIL,
          name: 'Marcos (Recovery)',
          role: 'admin',
          password: admin.password,
          companyId: defenz?.id ?? null,
        },
      })
    }
  }

  console.log(DRY ? '\n(DRY RUN — nada gravado)' : '\n✅ Setup aplicado')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
