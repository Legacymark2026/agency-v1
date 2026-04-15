import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnoseFacebookConnection() {
    console.log('🔍 Diagnosing Facebook connection...\n');

    // Get admin user
    const user = await prisma.user.findUnique({
        where: { email: 'administrador@legacymark.com' },
        include: {
            accounts: {
                where: { provider: 'facebook' }
            }
        }
    });

    if (!user) {
        console.log('❌ User not found');
        process.exit(1);
    }

    console.log(`✅ User: ${user.email}\n`);

    if (user.accounts.length === 0) {
        console.log('❌ No Facebook account connected');
        process.exit(1);
    }

    const fbAccount = user.accounts[0];
    console.log('✅ Facebook Account Connected:');
    console.log(`   Provider ID: ${fbAccount.providerAccountId}`);
    console.log(`   Has Access Token: ${!!fbAccount.access_token}`);
    console.log(`   Token Length: ${fbAccount.access_token?.length || 0} chars`);
    console.log(`   Scope: ${fbAccount.scope || 'null'}\n`);

    // Test the token by trying to fetch pages
    if (fbAccount.access_token) {
        console.log('🔍 Testing access token by fetching Pages...\n');

        try {
            const response = await fetch(
                `https://graph.facebook.com/v19.0/me/accounts?access_token=${fbAccount.access_token}`
            );

            const data = await response.json();

            if (data.error) {
                console.log('❌ Token Error:', data.error.message);
                console.log('\n💡 Solution: Reconnect Facebook OAuth');
            } else if (data.data && data.data.length > 0) {
                console.log(`✅ Found ${data.data.length} Page(s):\n`);
                data.data.forEach((page: any, i: number) => {
                    console.log(`${i + 1}. ${page.name}`);
                    console.log(`   ID: ${page.id}`);
                    console.log(`   Access Token: ${page.access_token ? '✓' : '✗'}\n`);
                });
            } else {
                console.log('⚠️  No Pages found');
                console.log('\n💡 Possible reasons:');
                console.log('1. Page exists but wasn\'t selected during OAuth');
                console.log('2. Missing "pages_show_list" permission');
                console.log('\n🔧 Solution:');
                console.log('1. Go to http://localhost:3000/dashboard/settings');
                console.log('2. Click "Disconnect"');
                console.log('3. Click "Connect"');
                console.log('4. When Facebook asks, SELECT your Page\n');
            }
        } catch (error: any) {
            console.log('❌ Error fetching pages:', error.message);
        }
    }

    await prisma.$disconnect();
}

diagnoseFacebookConnection();
