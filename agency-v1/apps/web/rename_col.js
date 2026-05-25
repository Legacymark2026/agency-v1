const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: 'postgresql://legacyuser:g%2Fd1b0VLZJQdTaoRdThivfuzqyT3%2BouU@187.77.195.9:5432/legacymark' });

async function main() {
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE "tbl_asset_catalogs" RENAME COLUMN "is_premium" TO "isPremium"`);
        console.log("Renamed is_premium to isPremium");
    } catch (e) {
        console.error("Failed:", e.message);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
