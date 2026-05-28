const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasourceUrl: 'postgresql://legacyuser:g%2Fd1b0VLZJQdTaoRdThivfuzqyT3%2BouU@187.77.195.9:5432/legacymark' });

async function main() {
    const queries = [
        `ALTER TABLE "tbl_templates" ADD COLUMN IF NOT EXISTS "isPremium" BOOLEAN NOT NULL DEFAULT false;`, // guessing it's tbl_templates, wait, let me check the sql
        `ALTER TABLE "tbl_video_edit_history" ADD COLUMN IF NOT EXISTS "edit_author" TEXT NOT NULL DEFAULT 'human';`,
        `ALTER TABLE "tbl_video_edit_history" ADD COLUMN IF NOT EXISTS "edit_confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0;`,
        `ALTER TABLE "tbl_video_editor_projects" ADD COLUMN IF NOT EXISTS "active_session_id" TEXT;`
    ];

    for (const q of queries) {
        try {
            await prisma.$executeRawUnsafe(q);
            console.log("Executed: ", q);
        } catch (e) {
            console.error("Failed: ", q, e.message);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
