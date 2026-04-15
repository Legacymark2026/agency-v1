
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyInstagram() {
    console.log('📸 VERIFYING INSTAGRAM CONNECTION...\n');

    const email = 'administrador@legacymark.com';
    const user = await prisma.user.findUnique({
        where: { email },
        include: { profile: true }
    });

    if (!user || !user.profile?.metadata) {
        console.error('❌ Metadata missing. Run force-link-page.ts first.');
        return;
    }

    const meta = user.profile.metadata as any;
    const pageId = meta.manualConnectedPageId;
    const pageToken = meta.manualConnectedPageToken;

    if (!pageId || !pageToken) {
        console.error('❌ No page linked.');
        return;
    }

    console.log(`🔗 Linked Page ID: ${pageId}`);

    // Test Instagram Access via Page
    console.log('\n--- 1. Testing Instagram API Access (via Page) ---');
    try {
        const url = `https://graph.facebook.com/v19.0/${pageId}/conversations?platform=instagram&access_token=${pageToken}`;
        const res = await fetch(url);
        const json = await res.json();

        if (json.error) {
            console.error(`❌ INSTAGRAM PAGE ERROR: ${json.error.message}`);
        } else {
            console.log(`✅ Page Endpoint: Success. Count: ${json.data?.length || 0}`);
        }
    } catch (e) { console.error(e); }

    // Test Instagram Access via IG User ID
    console.log('\n--- 2. Testing Instagram API Access (via IG User) ---');
    // First fetch IG ID
    try {
        const pageRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
        const pageData = await pageRes.json();
        const igId = pageData.instagram_business_account?.id;

        if (igId) {
            console.log(`🔗 IG User ID: ${igId}`);
            const url = `https://graph.facebook.com/v19.0/${igId}/conversations?access_token=${pageToken}`;
            const res = await fetch(url);
            const json = await res.json();

            if (json.error) {
                console.error(`❌ INSTAGRAM USER ERROR: ${json.error.message}`);
            } else {
                console.log(`✅ IG User Endpoint: Success. Count: ${json.data?.length || 0}`);
                if (json.data && json.data.length > 0) {
                    console.log('💡 FOUND MESSAGES VIA IG USER ENDPOINT!');
                    console.log('   The app needs to switch to using this endpoint.');
                }
            }
        } else {
            console.log('⚠️ No IG User linked to page.');
        }
    } catch (e) { console.error(e); }
}

verifyInstagram();
