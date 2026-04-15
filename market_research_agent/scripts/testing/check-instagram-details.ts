
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkInstagramConfig() {
    console.log('🕵️ CHECKING INSTAGRAM CONFIGURATION...\n');

    const email = 'administrador@legacymark.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true }
    });

    if (!user || !user.profile?.metadata) { console.error('No metadata'); return; }

    const meta = user.profile.metadata as any;
    const pageId = meta.manualConnectedPageId;
    const pageToken = meta.manualConnectedPageToken;

    if (!pageId || !pageToken) { console.error('No page linked'); return; }

    console.log(`Page ID: ${pageId}`);

    try {
        // Fetch Page with Instagram details
        // We need to see if 'instagram_business_account' field is populated
        const url = `https://graph.facebook.com/v19.0/${pageId}?fields=id,name,instagram_business_account{id,username,name}&access_token=${pageToken}`;

        const res = await fetch(url);
        const data = await res.json();

        console.log('\n--- PAGE DETAILS ---');
        console.log(`Name: ${data.name}`);

        if (data.instagram_business_account) {
            console.log('✅ INSTAGRAM BUSINESS ACCOUNT LINKED!');
            console.log(`   Username: @${data.instagram_business_account.username}`);
            console.log(`   Name:     ${data.instagram_business_account.name}`);
            console.log(`   ID:       ${data.instagram_business_account.id}`);

            console.log('\n👉 ACTION: Please send a message to THIS specific account:');
            console.log(`   @${data.instagram_business_account.username}`);
        } else {
            console.log('❌ NO INSTAGRAM BUSINESS ACCOUNT FOUND.');
            console.log('   The Facebook Page is connected, but it is NOT linked to an Instagram Business Profile.');
            console.log('   Go to Facebook Page Settings > Linked Accounts > Instagram and connect it.');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

checkInstagramConfig();
