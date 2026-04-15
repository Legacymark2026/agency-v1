
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testDirectPageAccess() {
    console.log('🕵️ TESTING DIRECT PAGE ACCESS (Bypassing List)...\n');

    const targetPageId = '929804106889746';

    // 1. Get Admin User
    const user = await prisma.user.findUnique({
        where: { email: 'administrador@legacymark.com' },
        include: { accounts: true }
    });

    if (!user) {
        console.error('❌ Admin user not found');
        return;
    }

    const fbAccount = user.accounts.find(a => a.provider === 'facebook');
    if (!fbAccount || !fbAccount.access_token) {
        console.error('❌ No Facebook access token found');
        return;
    }

    console.log(`🔑 Using Token: ${fbAccount.access_token.substring(0, 10)}...`);
    console.log(`🎯 Target Page ID: ${targetPageId}`);

    // 2. Try to fetch the page DIRECTLY (not via /me/accounts)
    console.log('\n🌐 Attempting direct fetch: GET /{page-id} ...');
    try {
        const url = `https://graph.facebook.com/v19.0/${targetPageId}?fields=id,name,access_token,category&access_token=${fbAccount.access_token}`;
        const response = await fetch(url);
        const data = await response.json();

        console.log('\n📄 API Response:');
        console.log(JSON.stringify(data, null, 2));

        if (data.id && data.access_token) {
            console.log('\n✅ SUCCESS! We can access the page directly even if it does not show in the list.');
            console.log('💡 We can implement a "Add Page by ID" feature to fix your issue.');
        } else {
            console.log('\n❌ FAILED. The API refuses to give us details for this page.');
            if (data.error) {
                console.log(`Error: ${data.error.message}`);
                console.log(`Code: ${data.error.code}`);
                console.log(`Type: ${data.error.type}`);
            }
        }

    } catch (error) {
        console.error('❌ Network Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDirectPageAccess();
