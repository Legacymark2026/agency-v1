import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkConfig() {
    const configs = await prisma.integrationConfig.findMany({
        where: { provider: 'facebook' }
    });

    console.log(`Found ${configs.length} Facebook configs.`);
    for (const c of configs) {
        const conf = c.config as any;
        console.log(`Company: ${c.companyId}`);
        console.log(`  appId: ${conf?.appId ? 'Set (' + conf.appId + ')' : 'MISSING'}`);
        console.log(`  appSecret: ${conf?.appSecret ? 'Set (Length: ' + conf.appSecret.length + ')' : 'MISSING'}`);
    }
}

checkConfig().finally(() => prisma.$disconnect());
