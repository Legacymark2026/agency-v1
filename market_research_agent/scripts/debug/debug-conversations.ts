
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugConversations() {
    console.log('🕵️ DEBUGGING CONVERSATIONS (Deep Dive)...\n');

    const email = 'administrador@legacymark.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true }
    });

    if (!user || !user.profile || !user.profile.metadata) {
        console.error('❌ User/Profile/Metadata not found');
        return;
    }

    const meta = user.profile.metadata as any;
    const pageId = meta.manualConnectedPageId;
    const pageToken = meta.manualConnectedPageToken;
    const pageName = meta.manualConnectedPageName;

    if (!pageId || !pageToken) {
        console.error('❌ No manual page linked in metadata.');
        return;
    }

    console.log(`📄 Page: ${pageName} (${pageId})`);
    console.log(`🔑 Token: ${pageToken.substring(0, 15)}...`);

    // 1. Check Token Debug Info
    console.log('\n--- 1. Token Scope Check ---');
    try {
        const debugUrl = `https://graph.facebook.com/v19.0/debug_token?input_token=${pageToken}&access_token=${pageToken}`;
        // Note: Usually need app access token to debug, but sometimes self-debug works. 
        // If not, we just skip.
        console.log('Skipping debug_token call (requires app token). Assuming rights based on user scopes.');
    } catch (e) { }

    // 2. Fetch Messenger Conversations Raw
    console.log('\n--- 2. Fetching MESSENGER Conversations (Raw) ---');
    try {
        const url = `https://graph.facebook.com/v19.0/${pageId}/conversations?platform=messenger&access_token=${pageToken}`;
        const res = await fetch(url);
        const json = await res.json();
        console.log(JSON.stringify(json, null, 2));
    } catch (e) {
        console.error('Error fetching messenger:', e);
    }

    // 3. Fetch Instagram Conversations Raw
    console.log('\n--- 3. Fetching INSTAGRAM Conversations (Raw) ---');
    try {
        const url = `https://graph.facebook.com/v19.0/${pageId}/conversations?platform=instagram&access_token=${pageToken}`;
        const res = await fetch(url);
        const json = await res.json();
        console.log(JSON.stringify(json, null, 2));
    } catch (e) {
        console.error('Error fetching instagram:', e);
    }

}

debugConversations();
