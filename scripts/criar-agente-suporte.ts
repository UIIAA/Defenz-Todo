/**
 * Cria (ou garante) a identidade de serviço do agente de suporte.
 *
 *   npx tsx scripts/criar-agente-suporte.ts
 *
 * ⚠️ Por que um usuário PRÓPRIO, e não um token no nome do Marcos: o token Bearer
 * age como o usuário dono e herda papel + empresas. No Marcos (admin, 4 empresas)
 * o agente enxergaria Grafono, PSI e Cow Cycling, e tudo que ele escrevesse
 * apareceria no AuditLog como "Marcos". Aqui ele é `user`, só Defenz, e cada ação
 * dele fica atribuível a ele.
 *
 * Senha inutilizável (mesmo padrão do portal@defenz.com.br): a identidade só
 * existe para ser dona de token — ninguém faz login com ela.
 */
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const EMAIL = 'agente-suporte@defenz.com.br'
const NOME = 'Agente de Suporte (IA)'

async function main() {
  const defenz = await prisma.company.findFirst({ where: { name: 'Defenz' } })
  if (!defenz) throw new Error('Empresa Defenz não encontrada')

  const senha = await bcrypt.hash('UNUSABLE_' + crypto.randomBytes(32).toString('hex'), 12)
  const u = await prisma.user.upsert({
    where: { email: EMAIL },
    create: { email: EMAIL, name: NOME, password: senha, role: 'user', companyId: defenz.id },
    // Idempotente e sem escalar: se já existir, é REBAIXADO a user/Defenz.
    update: { name: NOME, role: 'user', companyId: defenz.id },
    select: { id: true, email: true, role: true, companyId: true },
  })

  // Só a Defenz. Remove qualquer outra filiação que exista por engano.
  await prisma.userCompany.deleteMany({ where: { userId: u.id, NOT: { companyId: defenz.id } } })
  await prisma.userCompany.upsert({
    where: { userId_companyId: { userId: u.id, companyId: defenz.id } },
    create: { userId: u.id, companyId: defenz.id },
    update: {},
  })

  const empresas = await prisma.userCompany.count({ where: { userId: u.id } })
  console.log(`${u.email} · role=${u.role} · empresas=${empresas} · id=${u.id}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
