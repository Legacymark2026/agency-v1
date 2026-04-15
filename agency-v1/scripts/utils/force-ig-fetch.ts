
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceIgFetch() {
    console.log('🕵️ FORCE FETCHING INSTAGRAM (Deep Probe)...\n');

    const email = 'administrador@legacymark.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true }
    });

    if (!user || !user.profile?.metadata) { console.error('No metadata'); return; }
    const meta = user.profile.metadata as any;
    const pageId = meta.manualConnectedPageId;
    const pageToken = meta.manualConnectedPageToken;

    // 1. Get IG ID
    console.log('1. Getting Connected IG ID...');
    const pageRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
    const pageData = await pageRes.json();
    const igId = pageData.instagram_business_account?.id;
    console.log(`   IG ID: ${igId || 'NOT FOUND'}`);

    if (!igId) return;

    // 2. Test Page-Based Endpoint (Standard)
    console.log('\n2. Testing Standard Page Endpoint (platform=instagram)...');
    try {
        const url = `https://graph.facebook.com/v19.0/${pageId}/conversations?platform=instagram&access_token=${pageToken}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        if (data.error) console.error(`   Error: ${data.error.message}`);
        else console.log(`   Count: ${data.data?.length}`);
        if (data.data?.length > 0) console.log(JSON.stringify(data.data[0], null, 2));
    } catch (e) { console.error(e); }

    // 3. Test IG-Based Endpoint (Direct)
    console.log('\n3. Testing Direct IG Endpoint (/{ig-id}/conversations)...');
    try {
        const url = `https://graph.facebook.com/v19.0/${igId}/conversations?access_token=${pageToken}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log(`   Status: ${res.status}`);
        if (data.error) console.error(`   Error: ${data.error.message}`);
        else console.log(`   Count: ${data.data?.length}`);
    } catch (e) { console.error(e); }

    // 4. Test "General" Folder (Folder parameter not strictly supported for IG but good to try)
    console.log('\n4. Testing Folder Variations...');
    const folders = ['inbox', 'general', 'requests', 'page_done'];
    for (const folder of folders) {
        try {
            // Note: folder param works for platform=messenger, behavior on instagram is undefined but worth a shot
            const url = `https://graph.facebook.com/v19.0/${pageId}/conversations?platform=instagram&folder=${folder}&access_token=${pageToken}`;
            const res = await fetch(url);
            const data = await res.json();
            if (!data.error && data.data?.length > 0) {
                console.log(`   ✅ FOUND DATA IN FOLDER: ${folder}! Count: ${data.data.length}`);
            }
        } catch (e) { }
    }
}

forceIgFetch();
