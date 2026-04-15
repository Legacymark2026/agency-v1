import { MetaSyncService } from '../lib/services/meta-sync';
import { prisma } from '../lib/prisma';

async function main() {
    console.log("🚀 Starting Manual Meta Sync...");

    // Hardcoded IDs from previous context
    const userId = "7e860ceb-70ba-493f-a29f-f4c2cf696eb9";
    const companyId = "839e33e6-307b-4100-b9c3-b21e17a89295";

    // Verify user exists first
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
        console.error("❌ User not found!");
        return;
    }
    console.log(`👤 User found: ${user.email} (${user.id})`);

    // Run Sync
    try {
        const result = await MetaSyncService.syncAllConversations(userId, companyId);
        console.log("\n✅ Sync Result:", JSON.stringify(result, null, 2));
    } catch (error) {
        console.error("\n❌ Sync Failed:", error);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
