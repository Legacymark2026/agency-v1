import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugMetaConnection() {
    console.log('🔍 Debugging Meta Connection...\n');

    // 1. Find Admin User
    const user = await prisma.user.findUnique({
        where: { email: 'administrador@legacymark.com' },
        include: { accounts: true }
    });

    if (!user) {
        console.error('❌ Admin user not found');
        return;
    }

    console.log(`👤 User found: ${user.email} (ID: ${user.id})`);

    // 2. Find Facebook Account
    const fbAccount = user.accounts.find(a => a.provider === 'facebook');

    if (!fbAccount) {
        console.error('❌ No Facebook account linked to this user');
        return;
    }

    console.log('------------------------------------------------');
    console.log('🕵️ IDENTITY CHECK');
    try {
        const meRes = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name,email&access_token=${fbAccount.access_token}`);
        const me = await meRes.json();
        console.log(`Facebook User: ${me.name}`);
        console.log(`Facebook ID:   ${me.id}`);
        console.log(`Facebook Email: ${me.email || 'Not shared'}`);
    } catch (e) {
        console.error('Could not verify FB Identity');
    }
    console.log('------------------------------------------------');

    console.log('✅ Facebook account linked');
    console.log(`🔑 Access Token: ${fbAccount.access_token?.substring(0, 10)}...`);
    console.log(`🆔 Provider ID: ${fbAccount.providerAccountId}`);
    console.log(`📜 Granted Scopes: ${fbAccount.scope}`);

    // 3. Test Meta API
    if (!fbAccount.access_token) {
        console.error('❌ No access token found');
        return;
    }

    // Check Permissions
    console.log('\n🔐 Checking Token Permissions...');
    try {
        const permResponse = await fetch(`https://graph.facebook.com/v19.0/me/permissions?access_token=${fbAccount.access_token}`);
        const permData = await permResponse.json();
        if (permData.data) {
            console.log('Granted Permissions:');
            permData.data.forEach((p: any) => {
                const status = p.status === 'granted' ? '✅' : '❌';
                console.log(`   ${status} ${p.permission}`);
            });
        }
    } catch (e) {
        console.error('Failed to check permissions:', e);
    }

    const url = `https://graph.facebook.com/v19.0/me/accounts?access_token=${fbAccount.access_token}`;
    console.log(`\n🌐 Fetching pages from: ${url}`);

    try {
        const response = await fetch(url);
        const data = await response.json();

        console.log('\n📄 API Response:');
        console.log(JSON.stringify(data, null, 2));

        if (data.data && data.data.length === 0) {
            console.log('\n⚠️  No pages returned. Possible reasons:');
            console.log('   - The user does not manage any pages');
            console.log('   - The user did not grant "pages_show_list" permission');
            console.log('   - The user did not select any pages during the OAuth flow');
        } else if (data.data) {
            console.log(`\n✅ Found ${data.data.length} pages`);
        }

    } catch (error) {
        console.error('❌ API Request failed:', error);
    }
}

debugMetaConnection();
