
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function forceFacebookReset() {
    console.log('🧨 STARTING FORCE RESET OF FACEBOOK PERMISSIONS 🧨');
    console.log('This will revoke access so you can start fresh.\n');

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
        console.error('❌ No Facebook access token found. You are already disconnected.');
        return;
    }

    console.log(`👤 User: ${user.email}`);
    console.log(`🔑 Current Token: ${fbAccount.access_token.substring(0, 10)}...`);

    // 3. Call Facebook API to DELETE permissions
    console.log('\n🗑️  Revoking permissions on Meta servers...');
    try {
        const url = `https://graph.facebook.com/v19.0/me/permissions?access_token=${fbAccount.access_token}`;
        const response = await fetch(url, { method: 'DELETE' });
        const data = await response.json();

        if (data.success) {
            console.log('✅ SUCCESS! Permissions revoked on Facebook side.');
        } else {
            console.error('⚠️  Warning: Facebook API returned:', JSON.stringify(data));
        }

        // 4. Delete the Account from DB to ensure clean slate
        console.log('🗑️  Removing Account record from local database...');
        await prisma.account.delete({
            where: { id: fbAccount.id }
        });
        console.log('✅ Local record deleted.');

    } catch (error) {
        console.error('❌ Error during reset:', error);
    } finally {
        await prisma.$disconnect();
    }

    console.log('\n---------------------------------------------------------');
    console.log('🎉 RESET COMPLETE!');
    console.log('Now follow these steps EXACTLY:');
    console.log('1. Go to http://localhost:3000/dashboard/settings');
    console.log('   (Refresh the page if needed)');
    console.log('2. Click "Connect Facebook"');
    console.log('3. A Facebook popup will appear asking for permissions AGAIN.');
    console.log('4. CLICK "EDIT ACCESS" (Editar configuración) inside the popup.');
    console.log('5. SELECT ALL PAGES (Marcarlas todas). Don\'t skip any.');
    console.log('6. Finish the login.');
    console.log('---------------------------------------------------------');
}

forceFacebookReset();
