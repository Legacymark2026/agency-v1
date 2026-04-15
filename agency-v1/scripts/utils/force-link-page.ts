
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceLinkPage() {
    console.log('🔧 FORCE LINKING PAGE (Bypassing List)...\n');

    const targetPageId = '929804106889746';
    const email = 'administrador@legacymark.com';

    // 1. Get Admin User
    const user = await prisma.user.findUnique({
        where: { email },
        include: { accounts: true, profile: true }
    });

    if (!user) {
        console.error('❌ User not found');
        return;
    }

    const fbAccount = user.accounts.find(a => a.provider === 'facebook');
    if (!fbAccount || !fbAccount.access_token) {
        console.error('❌ No Facebook token found. Please connect first.');
        return;
    }

    console.log(`👤 User: ${user.email}`);
    console.log(`🔑 Token: ${fbAccount.access_token.substring(0, 10)}...`);

    // 2. Verify Page Access Directly
    console.log(`\nTesting access to Page ID: ${targetPageId}...`);
    try {
        const url = `https://graph.facebook.com/v19.0/${targetPageId}?fields=id,name,access_token&access_token=${fbAccount.access_token}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.id) {
            console.log('✅ PAGE ACCESSIBLE!');
            console.log(`   Name: ${data.name}`);
            console.log(`   ID:   ${data.id}`);

            // 3. Save to UserProfile metadata
            console.log('\n💾 Saving Page ID to User Profile metadata...');

            const currentMetadata = (user.profile?.metadata as any) || {};
            const newMetadata = {
                ...currentMetadata,
                manualConnectedPageId: targetPageId,
                manualConnectedPageName: data.name,
                manualConnectedPageToken: data.access_token // Optional store for redundancy
            };

            await prisma.userProfile.upsert({
                where: { userId: user.id },
                create: {
                    userId: user.id,
                    metadata: newMetadata
                },
                update: {
                    metadata: newMetadata
                }
            });

            console.log('✅ SAVED! The application will now use this Page ID.');
            console.log('👉 Please restart the dev server to ensure caches are cleared.');

        } else {
            console.error('❌ FAILED. Cannot access page details.');
            console.error('API Error:', JSON.stringify(data));
        }

    } catch (error) {
        console.error('❌ Network Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

forceLinkPage();
