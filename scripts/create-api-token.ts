/**
 * Gera um API Service Token (Bearer) para um usuário (Solução A).
 *
 * O token autentica "como" o usuário alvo, herdando seu escopo (role + empresas).
 * Armazena apenas o SHA-256 (alta entropia) — o plaintext é impresso UMA vez.
 *
 * Uso:
 *   npx tsx scripts/create-api-token.ts --role admin --name admin-cli
 *   npx tsx scripts/create-api-token.ts --email marcos@exemplo.com --name marcos-mcp
 *   npx tsx scripts/create-api-token.ts --email x@y.com --name temp --expires 90
 *
 * Flags:
 *   --email <email>   Usuário alvo por email (case-insensitive).
 *   --role <role>     OU seleciona o usuário mais antigo com esse role (ex: admin).
 *   --name <label>    Rótulo do token (obrigatório). Ex: "admin-cli", "marcos-mcp".
 *   --expires <dias>  Opcional. Sem isso o token nunca expira.
 *
 * Idempotência: se já existir um token ATIVO com o mesmo --name para o usuário,
 * ele é revogado (revokedAt) e um novo é criado (rotação).
 */

import { PrismaClient } from '@prisma/client'
import crypto from 'node:crypto'

const prisma = new PrismaClient()

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

function generateToken(): { raw: string; hash: string; prefix: string } {
  const raw = 'defz_' + crypto.randomBytes(28).toString('hex') // 56 hex chars
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  const prefix = raw.slice(0, 13) // "defz_" + 8 chars
  return { raw, hash, prefix }
}

async function main() {
  const email = arg('--email')
  const role = arg('--role')
  const name = arg('--name')
  const expiresDays = arg('--expires')

  if (!name) {
    console.error('ERRO: --name é obrigatório (ex: --name admin-cli)')
    process.exit(1)
  }
  if (!email && !role) {
    console.error('ERRO: informe --email <email> OU --role <role>')
    process.exit(1)
  }

  const user = email
    ? await prisma.user.findFirst({
        where: { email: { equals: email.toLowerCase().trim(), mode: 'insensitive' } },
      })
    : await prisma.user.findFirst({ where: { role: role! }, orderBy: { createdAt: 'asc' } })

  if (!user) {
    console.error(`ERRO: usuário não encontrado (${email ?? `role=${role}`})`)
    process.exit(1)
  }

  // Rotação: revoga token ativo de mesmo nome p/ este usuário, se houver.
  const revoked = await prisma.apiToken.updateMany({
    where: { userId: user.id, name, revokedAt: null },
    data: { revokedAt: new Date() },
  })

  const { raw, hash, prefix } = generateToken()
  const expiresAt = expiresDays
    ? new Date(Date.now() + Number(expiresDays) * 24 * 60 * 60 * 1000)
    : null

  await prisma.apiToken.create({
    data: {
      name,
      tokenHash: hash,
      tokenPrefix: prefix,
      userId: user.id,
      expiresAt,
      createdBy: user.id,
    },
  })

  console.log('')
  console.log('================ API TOKEN CRIADO ================')
  console.log(`Usuário : ${user.name ?? user.email} (${user.role})`)
  console.log(`Nome    : ${name}`)
  console.log(`Prefixo : ${prefix}`)
  console.log(`Expira  : ${expiresAt ? expiresAt.toISOString() : 'nunca'}`)
  if (revoked.count > 0) console.log(`(rotação: ${revoked.count} token(s) anterior(es) de mesmo nome revogado(s))`)
  console.log('')
  console.log('>>> TOKEN (copie AGORA — não será mostrado de novo): <<<')
  console.log('')
  console.log(`    ${raw}`)
  console.log('')
  console.log('Guarde em um cofre (1Password/KeePass). NUNCA commite nem coloque')
  console.log('em .env versionado. Use via header: Authorization: Bearer <token>')
  console.log('=================================================')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
