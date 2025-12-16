import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // 1. Get or create Admin User
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

    // 2. Create Clients
    const client1 = await prisma.client.create({
        data: {
            name: 'Tech Solutions Ltda',
            email: 'contato@techsolutions.com',
            phone: '(11) 99999-1111',
            company: 'Tech Solutions',
            segment: 'Tecnologia',
            userId: admin.id
        }
    })

    const client2 = await prisma.client.create({
        data: {
            name: 'Grupo Industrial Alpha',
            email: 'compras@grupoalpha.com',
            phone: '(11) 98888-2222',
            company: 'Grupo Alpha',
            segment: 'Indústria',
            userId: admin.id
        }
    })

    // 3. Create Opportunities
    // High Priority, No recent interaction (Actionable Item)
    await prisma.opportunity.create({
        data: {
            title: 'Contrato de Manutenção Anual',
            status: 'negotiation',
            value: 150000,
            probability: 80,
            priority: 'high',
            userId: admin.id,
            clientId: client1.id,
            updatedAt: new Date('2023-10-01') // Old date to trigger actionable item
        }
    })

    // Medium Priority, In Progress
    const opp2 = await prisma.opportunity.create({
        data: {
            title: 'Consultoria de Segurança',
            status: 'proposal',
            value: 45000,
            probability: 60,
            priority: 'medium',
            userId: admin.id,
            clientId: client2.id
        }
    })

    // Low Priority, Prospecting
    await prisma.opportunity.create({
        data: {
            title: 'Treinamento de Equipe',
            status: 'prospecting',
            value: 12000,
            probability: 20,
            priority: 'low',
            userId: admin.id,
            clientId: client1.id
        }
    })

    // 4. Create Interactions
    await prisma.interaction.create({
        data: {
            type: 'meeting',
            content: 'Reunião de apresentação da proposta comercial. Cliente demonstrou interesse nos módulos de segurança.',
            date: new Date(),
            userId: admin.id,
            opportunityId: opp2.id
        }
    })

    console.log('✅ Seed completed with CRM data!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
