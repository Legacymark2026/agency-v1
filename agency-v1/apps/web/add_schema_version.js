const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: 'postgresql://legacyuser:g%2Fd1b0VLZJQdTaoRdThivfuzqyT3%2BouU@187.77.195.9:5432/legacymark' });

async function main() {
    const dbTablesRaw = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
    const tables = dbTablesRaw.map(t => t.tablename).filter(t => t.startsWith('tbl_'));

    for (const table of tables) {
        // Skip join tables
        if (table.startsWith('tbl__')) continue;
        
        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "col_schema_version" INTEGER NOT NULL DEFAULT 0`);
            console.log(`Added col_schema_version to ${table}`);
        } catch (e) {
            // Might already exist
            console.log(`Skipped col_schema_version for ${table}:`, e.message);
        }

        try {
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "col_deleted_at" TIMESTAMP(3)`);
            console.log(`Added col_deleted_at to ${table}`);
        } catch (e) {
            console.log(`Skipped col_deleted_at for ${table}:`, e.message);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
