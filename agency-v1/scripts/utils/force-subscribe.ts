
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function subscribeApp() {
    console.log('🔌 SUBSCRIBING APP TO PAGE EVENTS...\n');

    const email = 'administrador@legacymark.com';
    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    if (!user?.profile?.metadata) { console.error('No metadata'); return; }
    const meta = user.profile.metadata as any;
    const pageId = meta.manualConnectedPageId;
    const token = meta.manualConnectedPageToken;

    console.log(`Page: ${pageId}`);

    // Subscribe fields
    const fields = 'messages,messaging_postbacks,messaging_optins,message_echoes,feed';

    // Note: 'feed' is for posts/comments (also useful)

    try {
        const url = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=${fields}&access_token=${token}`;
        const res = await fetch(url, { method: 'POST' });
        const json = await res.json();

        console.log('--- SUBSCRIPTION RESULT ---');
        console.log(JSON.stringify(json, null, 2));

        if (json.success) {
            console.log('✅ APP SUBSCRIBED SUCCESSFULLY!');
            console.log('   Now the API should have visibility into the inbox.');
        } else {
            console.error('❌ FAILED TO SUBSCRIBE.');
        }

    } catch (e) { console.error(e); }
}

subscribeApp();
