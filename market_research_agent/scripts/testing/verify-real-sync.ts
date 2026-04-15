
import { PrismaClient } from "@prisma/client";
import { MetaSyncService } from "../lib/services/meta-sync"; // Adjust relative import based on script location

const prisma = new PrismaClient();

async function verifyRealSync() {
    console.log("🔍 Verifying Real Meta Sync process...\n");

    const email = 'administrador@legacymark.com';

    // 1. Get Admin User
    const user = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true, companies: true }
    });

    if (!user) {
        console.error(`❌ User ${email} not found.`);
        return;
    }

    console.log(`✅ User found: ${user.email} (${user.id})`);

    // 2. Get Company
    const companyUser = await prisma.companyUser.findFirst({
        where: { userId: user.id }
    });

    if (!companyUser) {
        console.error("❌ No company found for this user.");
        return;
    }

    const companyId = companyUser.companyId;
    console.log(`🏢 Company ID: ${companyId}`);

    // 3. Run Sync
    console.log("\n🚀 Starting Sync...");

    try {
        const result = await MetaSyncService.syncAllConversations(user.id, companyId);

        if (result.success) {
            console.log("\n✅ Sync Successful!");
            console.log(`   - Conversations Synced: ${result.conversationsSynced}`);
            console.log(`   - Messages Synced: ${result.messagesSynced}`);
        } else {
            console.error("\n❌ Sync Failed:");
            console.error(`   - Error: ${result.error}`);
        }

    } catch (error) {
        console.error("\n❌ Unexpected Error during sync:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyRealSync();
