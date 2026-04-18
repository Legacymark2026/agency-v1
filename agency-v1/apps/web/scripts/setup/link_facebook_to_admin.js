const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function linkFacebookToAdmin() {
    console.log('🔧 Linking Facebook account to admin user...\n');

    // Find admin user
    const adminUser = await prisma.user.findUnique({
        where: { email: 'admin@legacymark.com' }
    });

    if (!adminUser) {
        console.log('❌ Admin user not found!');
        return;
    }

    console.log(`✅ Found admin user: ${adminUser.email} (ID: ${adminUser.id})\n`);

    // Find Facebook account
    const facebookAccount = await prisma.account.findFirst({
        where: { provider: 'facebook' },
        include: {
            user: {
                select: {
                    email: true
                }
            }
        }
    });

    if (!facebookAccount) {
        console.log('❌ No Facebook account found in database');
        return;
    }

    console.log(`✅ Found Facebook account linked to: ${facebookAccount.user.email}`);
    console.log(`   Provider Account ID: ${facebookAccount.providerAccountId}\n`);

    if (facebookAccount.userId === adminUser.id) {
        console.log('✅ Facebook account is already linked to admin user!');
        return;
    }

    // Update the account to link to admin
    console.log(`🔄 Transferring Facebook account to admin user...`);

    await prisma.account.update({
        where: {
            provider_providerAccountId: {
                provider: 'facebook',
                providerAccountId: facebookAccount.providerAccountId
            }
        },
        data: {
            userId: adminUser.id
        }
    });

    console.log('✅ SUCCESS! Facebook account is now linked to admin user\n');
    console.log('🎉 The Meta integration badge should now show "Connected" when you refresh the settings page');
}

linkFacebookToAdmin()
    .catch(e => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
