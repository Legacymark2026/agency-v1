const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
    try {
        const configCount = await prisma.integrationConfig.count();
        console.log(`IntegrationConfig count: ${configCount}`);

        const profileCount = await prisma.userProfile.count();
        console.log(`UserProfile count: ${profileCount}`);

        const profilesWithPixel = await prisma.userProfile.findMany({
            select: { id: true, facebookPixel: true }
        });

        console.log('Profiles check:');
        profilesWithPixel.forEach(p => {
            console.log(`Profile ${p.id}: Pixel Config exists? ${!!p.facebookPixel}`);
        });

    } catch (e) {
        console.error('DEBUG ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

debug();
