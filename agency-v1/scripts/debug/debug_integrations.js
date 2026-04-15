const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugIntegrations() {
    console.log('🔍 Debugging Integration Detection...\n');

    // Get all users
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true
        }
    });

    console.log(`📊 Total users: ${users.length}\n`);
    users.forEach((user, i) => {
        console.log(`User ${i + 1}: ${user.email} (ID: ${user.id})`);
    });

    console.log('\n---\n');

    // Get all accounts
    const accounts = await prisma.account.findMany({
        include: {
            user: {
                select: {
                    email: true
                }
            }
        }
    });

    console.log(`📊 Total accounts: ${accounts.length}\n`);
    accounts.forEach((account, i) => {
        console.log(`Account ${i + 1}:`);
        console.log(`  Provider: ${account.provider}`);
        console.log(`  User: ${account.user.email}`);
        console.log(`  User ID: ${account.userId}`);
        console.log(`  Provider Account ID: ${account.providerAccountId}`);
        console.log('');
    });

    console.log('---\n');
    console.log('🔍 Testing getConnectedIntegrations logic...\n');

    // Simulate the query for each user
    for (const user of users) {
        console.log(`Testing for user: ${user.email} (ID: ${user.id})`);

        const userAccounts = await prisma.account.findMany({
            where: { userId: user.id },
            select: {
                provider: true,
                providerAccountId: true,
            }
        });

        console.log(`  Found ${userAccounts.length} accounts`);
        userAccounts.forEach(acc => {
            console.log(`    - ${acc.provider} (${acc.providerAccountId})`);
        });

        const providers = [
            {
                id: 'facebook',
                name: 'Meta (Facebook)',
                isConfigured: !!process.env.FACEBOOK_CLIENT_ID && !!process.env.FACEBOOK_CLIENT_SECRET
            }
        ];

        const result = providers.map(p => {
            const account = userAccounts.find(a => a.provider === p.id);
            return {
                provider: p.id,
                name: p.name,
                connected: !!account,
                accountId: account?.providerAccountId,
                isConfigured: p.isConfigured
            };
        });

        console.log(`  Result for ${user.email}:`);
        console.log(`    Facebook connected: ${result[0].connected}`);
        console.log('');
    }
}

debugIntegrations()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
