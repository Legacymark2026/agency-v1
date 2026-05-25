const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: 'postgresql://legacyuser:g%2Fd1b0VLZJQdTaoRdThivfuzqyT3%2BouU@187.77.195.9:5432/legacymark' });

async function main() {
    const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    console.log(JSON.stringify(tables, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
