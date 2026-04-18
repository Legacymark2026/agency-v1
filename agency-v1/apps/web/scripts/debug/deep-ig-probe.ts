
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deepFetchIg() {
    console.log('🕵️‍♀️ DEEP IG FETCH (Trying to find the missing conversation)...');

    const email = 'administrador@legacymark.com';
    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    if (!user?.profile?.metadata) { console.error('No metadata'); return; }
    const meta = user.profile.metadata as any;
    const pageId = meta.manualConnectedPageId;
    const token = meta.manualConnectedPageToken;
    const igId = '17841480060902792'; // From previous discovery

    console.log(`Page: ${pageId}, IG: ${igId}`);

    // Try a broad fetch on the PAGE node, specifying instagram platform
    // But this time, let's look at raw output without assumptions
    try {
        console.log('\n--- FETCHING FROM PAGE NODE ---');
        const url = `https://graph.facebook.com/v22.0/${pageId}/conversations?platform=instagram&access_token=${token}`;
        const res = await fetch(url);
        const json = await res.json();
        console.log(`Status: ${res.status}`);
        console.log(JSON.stringify(json, null, 2));
    } catch (e) { console.error(e); }

    // Try Handover Protocol check? 
    // Is the conversation assigned to another app?
    // We can't query individual conversation details if we don't have the ID.

    // Try Webhooks subscription check?
    try {
        console.log('\n--- CHECKING APP SUBSCRIPTIONS ---');
        const url = `https://graph.facebook.com/v22.0/${pageId}/subscribed_apps?access_token=${token}`;
        const res = await fetch(url);
        const json = await res.json();
        console.log(JSON.stringify(json, null, 2));
    } catch (e) { console.error(e); }

}

deepFetchIg();
