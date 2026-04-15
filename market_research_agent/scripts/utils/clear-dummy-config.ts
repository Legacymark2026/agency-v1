import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixConfig() {
    console.log("Deleting dummy facebook config to force .env usage...");
    await prisma.integrationConfig.deleteMany({
        where: { provider: 'facebook' }
    });
    console.log("Deleted");
}

fixConfig().finally(() => prisma.$disconnect());
