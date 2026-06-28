/**
 * Seed do portal público de abertura de ticket (F2).
 *
 * Garante (idempotente via upsert):
 *   1. User-sistema portal@defenz.com.br (role user, companyId=Defenz, senha inutilizável)
 *   2. 1 AuthorizedClient de teste para a empresa Defenz
 *
 * Uso (orquestrador):
 *   npx tsx scripts/seed-portal.ts
 *
 * Idempotente: pode ser rodado múltiplas vezes sem efeito duplicado.
 *
 * SD-ADR-006: o User-sistema satisfaz NOT NULL em createdById e AuditLog.userId
 * para escritas session-less do portal.
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

const PORTAL_EMAIL = 'portal@defenz.com.br'
const PORTAL_NAME = 'Portal (Sistema)'
const DEFENZ_COMPANY_NAME = 'Defenz'

// AuthorizedClient de teste — substitua por clientes reais na carga inicial
const TEST_CLIENT = {
  cnpj: '11222333000181',           // só dígitos (normalizado)
  email: 'teste@cliente.com.br',    // lowercase
  clientName: 'Cliente Teste',
  contactName: null as string | null,
  active: true,
}

async function main() {
  console.log('=== seed-portal: iniciando ===')

  // 1. Localizar empresa Defenz
  const defenz = await prisma.company.findFirst({ where: { name: DEFENZ_COMPANY_NAME } })
  if (!defenz) {
    console.error(`ERRO: Empresa "${DEFENZ_COMPANY_NAME}" não encontrada no banco.`)
    console.error('Execute o seed principal antes de rodar este script.')
    process.exit(1)
  }
  console.log(`Empresa Defenz encontrada: ${defenz.id}`)

  // 2. Criar/garantir User-sistema portal@defenz.com.br
  // Senha = bcrypt de string aleatória de alta entropia (inutilizável na prática)
  const unusableRaw = 'UNUSABLE_' + crypto.randomBytes(32).toString('hex')
  const unusableHash = await bcrypt.hash(unusableRaw, 12)

  const portalUser = await prisma.user.upsert({
    where: { email: PORTAL_EMAIL },
    create: {
      email: PORTAL_EMAIL,
      name: PORTAL_NAME,
      password: unusableHash,
      role: 'user',
      companyId: defenz.id,
    },
    update: {
      // Mantém os dados existentes — apenas garante que companyId está correto
      name: PORTAL_NAME,
      companyId: defenz.id,
    },
    select: { id: true, email: true, name: true },
  })
  console.log(`Usuário-sistema: ${portalUser.email} (id: ${portalUser.id})`)

  // 3. Criar/garantir AuthorizedClient de teste
  const authorizedClient = await prisma.authorizedClient.upsert({
    where: {
      cnpj_email: {
        cnpj: TEST_CLIENT.cnpj,
        email: TEST_CLIENT.email,
      },
    },
    create: {
      companyId: defenz.id,
      cnpj: TEST_CLIENT.cnpj,
      email: TEST_CLIENT.email,
      clientName: TEST_CLIENT.clientName,
      contactName: TEST_CLIENT.contactName,
      active: TEST_CLIENT.active,
    },
    update: {
      // Garante que o cliente de teste está ativo e aponta para Defenz
      companyId: defenz.id,
      clientName: TEST_CLIENT.clientName,
      active: true,
    },
    select: { id: true, cnpj: true, email: true, clientName: true, active: true },
  })
  console.log(
    `AuthorizedClient: ${authorizedClient.clientName} | CNPJ: ${authorizedClient.cnpj} | e-mail: ${authorizedClient.email} | ativo: ${authorizedClient.active}`
  )

  console.log('=== seed-portal: concluído ===')
}

main()
  .catch((e) => {
    console.error('ERRO no seed-portal:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
