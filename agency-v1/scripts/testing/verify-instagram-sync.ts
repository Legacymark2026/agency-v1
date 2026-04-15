
import { PrismaClient } from '@prisma/client';
import { MetaService } from '../lib/services/meta-sync';

const prisma = new PrismaClient();

async function verifyInstagramSync() {
    console.log("🔍 Checking Instagram Connection...");

    const facebookAccount = await prisma.account.findFirst({
        where: { provider: 'facebook' },
        include: { user: true }
    });

    if (!facebookAccount || !facebookAccount.access_token) {
        console.error("❌ No Facebook account connected.");
        return;
    }

    const { user } = facebookAccount;
    const account = facebookAccount; // Same reference

    console.log("✅ Main Facebook Account Found.");
    console.log("User:", user.email, `(${user.id})`);

    try {
        const { pages } = await MetaService.getConnectedPages(user.id);
        console.log(`✅ Found ${pages.length} Pages.`);

        for (const page of pages) {
            console.log(`\n--- Page: ${page.name} (${page.id}) ---`);
            const pageAccessToken = await MetaService.getPageAccessToken(page.id, account.access_token!);

            if (pageAccessToken) {
                console.log("✅ Page Access Token: Retrieved");

                // Check Instagram specifically
                const igConvos = await MetaService.getPageConversations(
                    page.id,
                    pageAccessToken,
                    'instagram'
                );

                if (igConvos.length > 0) {
                    console.log(`✅ SUCCESS: Found ${igConvos.length} Instagram conversations!`);
                    console.log("First one:", igConvos[0].id);
                } else if (Array.isArray(igConvos) && igConvos.length === 0) {
                    console.log("⚠️ OK: No Instagram conversations found (empty list), but connection seems valid.");
                } else {
                    console.error("❌ FAILED: Could not fetch Instagram conversations. Check permissions.");
                }

                // Check Messenger just to be sure
                const msgConvos = await MetaService.getPageConversations(
                    page.id,
                    pageAccessToken,
                    'messenger'
                );
                console.log(`✅ Messenger Conversations: ${msgConvos.length}`);

            } else {
                console.error("❌ Failed to get Page Access Token.");
            }
        }

    } catch (error) {
        console.error("❌ Unexpected Error:", error);
    }
}

verifyInstagramSync()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
