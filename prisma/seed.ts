import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@defenz.com' },
    update: {},
    create: {
      email: 'admin@defenz.com',
      name: 'Admin',
      password: hashedPassword,
      role: 'admin'
    }
  })

  console.log('✅ Seed completed!')
  console.log('📧 Admin email: admin@defenz.com')
  console.log('🔑 Admin password: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
