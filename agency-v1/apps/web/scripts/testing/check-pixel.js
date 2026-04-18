const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const integrationCount = await prisma.integrationConfig.count();
    const profileCount = await prisma.userProfile.count();
    const fbpInConfig = await prisma.integrationConfig.count({ where: { provider: 'facebook-pixel' } });
    const fbpInProfile = await prisma.userProfile.count({
        where: {
            NOT: { facebookPixel: null }
        }
    });

    console.log(`TOTAL_INTEGRATION_CONFIGS: ${integrationCount}`);
    console.log(`TOTAL_USER_PROFILES: ${profileCount}`);
    console.log(`CONFIGS_WITH_PIXEL: ${fbpInConfig}`);
    console.log(`PROFILES_WITH_PIXEL: ${fbpInProfile}`);

    const allConfigs = await prisma.integrationConfig.findMany();
    console.log('ALL_CONFIGS_PROVIDERS:', allConfigs.map(c => c.provider));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
