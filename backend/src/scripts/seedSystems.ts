import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
import 'dotenv/config'
import systems from './systems.json'

async function main() {
    const entries = Object.entries(systems) as [string, string][]
    for (const [id, name] of entries) {
        await prisma.system.upsert({
            where: { id: Number(id) },
            update: {},
            create: {
                id: Number(id),
                name,
            },
        })
    }

    console.log(`✅ Загружено ${entries.length} систем.`)
}

main().finally(() => prisma.$disconnect())
