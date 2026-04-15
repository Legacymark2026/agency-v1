import { MetaSyncService, MetaService } from '../lib/services/meta-sync';
import { prisma } from '../lib/prisma';

async function main() {
    console.log("Starting Meta Sync Test...");

    // Test for specific user with fb token
    const userId = "7e860ceb-70ba-493f-a29f-f4c2cf696eb9";
    const companyId = "839e33e6-307b-4100-b9c3-b21e17a89295";

    console.log(`Testing with User: ${userId}, Company: ${companyId}`);

    // Step 1: Test getConnectedPages
    console.log("\n--- Testing MetaService.getConnectedPages ---");
    const { pages, hasAccountEntry } = await MetaService.getConnectedPages(userId, companyId);
    console.log(`Has Account Entry: ${hasAccountEntry}`);
    console.log(`Pages Found: ${pages.length}`);
    pages.forEach(p => console.log(` - ${p.name} (${p.id}) access_token: ${p.access_token ? 'YES' : 'NO'}`));

    // Step 2: Full Sync
    console.log("\n--- Testing MetaSyncService.syncAllConversations ---");
    const result = await MetaSyncService.syncAllConversations(userId, companyId);
    console.log("Sync Result:", JSON.stringify(result, null, 2));

}

main()
    .then(() => process.exit(0))
    .catch((e) => {
        console.error(e);
        process.exit(1);
    });
