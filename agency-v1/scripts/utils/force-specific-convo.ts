
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceFetchSpecificConvo() {
    console.log('🕵️‍♀️ FORCE FETCHING SPECIFIC CONVERSATIONS (By Date/Pagination)...');

    const email = 'administrador@legacymark.com';
    const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
    if (!user?.profile?.metadata) return;
    const meta = user.profile.metadata as any;
    const token = meta.manualConnectedPageToken;
    const pageId = meta.manualConnectedPageId;

    // Based on screenshot, Heyber is 8:26pm (today?)
    // Juan Andres is 7:17pm (today)
    // MLS Santander is Jan 31

    console.log('--- Fetching Instagram with LIMIT 10 ---');
    try {
        // Use Platform=Instagram explicitly
        const url = `https://graph.facebook.com/v19.0/${pageId}/conversations?platform=instagram&limit=10&access_token=${token}`;
        const res = await fetch(url);
        const json = await res.json();

        console.log(`Count: ${json.data?.length}`);
        if (json.data?.length > 0) {
            console.log(JSON.stringify(json.data, null, 2));
        } else {
            console.log('Still empty.');
        }

        // Try direct IG user endpoint again just in case previous attempts were flukes
        // Fetch IG ID again
        const pageRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${token}`);
        const pageData = await pageRes.json();
        const igId = pageData.instagram_business_account?.id;

        if (igId) {
            console.log(`\n--- Fetching Direct IG: ${igId} ---`);
            const url2 = `https://graph.facebook.com/v19.0/${igId}/conversations?limit=10&access_token=${token}`;
            const res2 = await fetch(url2);
            const json2 = await res2.json();
            console.log(JSON.stringify(json2, null, 2));
        }

    } catch (e) { console.error(e); }
}

forceFetchSpecificConvo();
