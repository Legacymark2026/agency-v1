
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkSpecificPage() {
    console.log('🔍 Checking for specific Facebook Page: 929804106889746...\n');

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

    // 2. Get Token
    const fbAccount = user.accounts.find(a => a.provider === 'facebook');
    if (!fbAccount || !fbAccount.access_token) {
        console.error('❌ No Facebook access token found');
        return;
    }

    // 3. Fetch Pages from Meta API
    const url = `https://graph.facebook.com/v19.0/me/accounts?access_token=${fbAccount.access_token}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error('❌ Meta API Error:', data.error.message);
            return;
        }

        const pages = data.data || [];
        console.log(`📡 Found ${pages.length} pages linked to this account.\n`);

        // 4. Search for Target Page
        const targetPage = pages.find((p: any) => p.id === targetPageId);

        if (targetPage) {
            console.log('✅ TARGET PAGE FOUND!');
            console.log('------------------------------------------------');
            console.log(`Name:        ${targetPage.name}`);
            console.log(`ID:          ${targetPage.id}`);
            console.log(`Category:    ${targetPage.category}`);
            console.log(`Tasks:       ${JSON.stringify(targetPage.tasks)}`);
            console.log('------------------------------------------------');
        } else {
            console.log('❌ Target page NOT found in the allowed list.');
            console.log('\nThese are the pages we CAN see:');
            pages.forEach((p: any) => {
                console.log(`- ${p.name} (ID: ${p.id})`);
            });
            console.log('\n⚠️ If you are an admin of the missing page, you may need to re-authenticate and strictly select ALL pages or specifically that page during the "Continue as..." flow.');
        }

    } catch (error) {
        console.error('❌ Network/Script Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSpecificPage();
