
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTokens() {
    console.log('🔑 TESTING TOKENS (User vs Page) for Instagram Access...\n');

    const email = 'administrador@legacymark.com';
    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    if (!user?.profile?.metadata) return;
    const meta = user.profile.metadata as any;

    // 1. User Token (Stored in Account or Metadata)
    const userToken = meta.manualConnectedPageToken || ''; // Wait, metadata stores PAGE token? 
    // Actually force-link-page.ts saved data.access_token from /{page-id} call. 
    // That IS a Page Token if fetched via /{page-id}?fields=access_token using user token.
    // Let's verify what we have.

    const account = await prisma.account.findFirst({
        where: { userId: user.id, provider: 'facebook' }
    });

    const realUserToken = account?.access_token;
    const manualPageToken = meta.manualConnectedPageToken;
    const pageId = meta.manualConnectedPageId;
    const igId = '17841480060902792';

    console.log('User Token: ', realUserToken ? 'Has Value' : 'Missing');
    console.log('Manual Token: ', manualPageToken ? 'Has Value' : 'Missing');

    // 2. Fetch Fresh Page Token
    console.log('\n--- Fetching FRESH Page Token ---');
    const pageRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=access_token&access_token=${realUserToken}`);
    const pageData = await pageRes.json();
    const freshPageToken = pageData.access_token;
    console.log('Fresh Page Token: ', freshPageToken ? 'Success' : 'Failed');

    // 3. Test IG Endpoint ({ig-id}/conversations)
    console.log('\n--- Testing IG Endpoint ---');

    // A. With User Token
    try {
        const url = `https://graph.facebook.com/v19.0/${igId}/conversations?access_token=${realUserToken}`;
        const res = await fetch(url);
        const json = await res.json();
        console.log(`[User Token] Status: ${res.status}, Error: ${json.error?.message || 'None'}, Data: ${json.data?.length}`);
    } catch (e) { }

    // B. With Manual Token
    try {
        const url = `https://graph.facebook.com/v19.0/${igId}/conversations?access_token=${manualPageToken}`;
        const res = await fetch(url);
        const json = await res.json();
        console.log(`[Manual Token] Status: ${res.status}, Error: ${json.error?.message || 'None'}, Data: ${json.data?.length}`);
    } catch (e) { }

    // C. With Fresh Page Token
    try {
        const url = `https://graph.facebook.com/v19.0/${igId}/conversations?access_token=${freshPageToken}`;
        const res = await fetch(url);
        const json = await res.json();
        console.log(`[Fresh Token] Status: ${res.status}, Error: ${json.error?.message || 'None'}, Data: ${json.data?.length}`);
    } catch (e) { }
}

testTokens();
