import { MetaService } from '../lib/services/meta-sync';
import { prisma } from '../lib/prisma';

async function main() {
    const userId = "7e860ceb-70ba-493f-a29f-f4c2cf696eb9";
    const companyId = "839e33e6-307b-4100-b9c3-b21e17a89295";

    const { pages } = await MetaService.getConnectedPages(userId, companyId);

    for (const page of pages) {
        console.log(`\nTesting Page: ${page.name} (${page.id})`);

        let token = page.access_token;
        if (!token) {
            const acc = await prisma.account.findFirst({ where: { userId, provider: 'facebook' } });
            if (acc) token = await MetaService.getPageAccessToken(page.id, acc.access_token!);
        }

        console.log(`Token available: ${!!token}`);
        if (!token) continue;

        // Test IG General
        const igGeneralUrl = `https://graph.facebook.com/v19.0/${page.id}/conversations?platform=instagram&folder=general&access_token=${token}`;
        const ig1 = await fetch(igGeneralUrl).then(r => r.json());
        console.log("IG General:", JSON.stringify(ig1, null, 2));

        // Test IG Inbox
        const igInboxUrl = `https://graph.facebook.com/v19.0/${page.id}/conversations?platform=instagram&access_token=${token}`;
        const ig2 = await fetch(igInboxUrl).then(r => r.json());
        console.log("IG Inbox:", JSON.stringify(ig2, null, 2));

        // Test FB Inbox
        const fbUrl = `https://graph.facebook.com/v19.0/${page.id}/conversations?platform=messenger&access_token=${token}`;
        const fb = await fetch(fbUrl).then(r => r.json());
        console.log("FB Inbox:", JSON.stringify(fb, null, 2));
    }
}
main().then(() => process.exit(0));
