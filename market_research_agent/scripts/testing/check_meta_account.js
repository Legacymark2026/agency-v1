const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMetaAccount() {
    console.log('🔍 Checking Meta Account in Database...\n');

    // Get all accounts
    const accounts = await prisma.account.findMany({
        include: {
            user: {
                select: {
                    email: true,
                    name: true
                }
            }
        }
    });

    console.log(`📊 Total accounts found: ${accounts.length}\n`);

    if (accounts.length === 0) {
        console.log('❌ No accounts found in database');
        console.log('   This means the OAuth callback did not save the account.');
        console.log('   Possible causes:');
        console.log('   1. NextAuth is not configured to save accounts');
        console.log('   2. Database connection issue during callback');
        console.log('   3. Prisma schema mismatch\n');
        return;
    }

    accounts.forEach((account, index) => {
        console.log(`Account ${index + 1}:`);
        console.log(`  Provider: ${account.provider}`);
        console.log(`  User: ${account.user.email} (${account.user.name})`);
        console.log(`  Provider Account ID: ${account.providerAccountId}`);
        console.log(`  Access Token: ${account.access_token ? '✅ Present' : '❌ Missing'}`);
        console.log(`  Refresh Token: ${account.refresh_token ? '✅ Present' : '❌ Missing'}`);
        console.log(`  Expires At: ${account.expires_at || 'N/A'}`);
        console.log('');
    });

    const facebookAccount = accounts.find(a => a.provider === 'facebook');
    if (facebookAccount) {
        console.log('✅ Facebook account IS connected!');
        console.log('   The UI should show "Connected" badge.');
    } else {
        console.log('❌ No Facebook account found');
        console.log('   Available providers:', accounts.map(a => a.provider).join(', '));
    }
}

checkMetaAccount()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
