import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function linkFacebookToAdmin() {
    console.log('🔄 Linking Facebook account to administrador@legacymark.com...\n');

    // Find admin user
    const adminUser = await prisma.user.findUnique({
        where: { email: 'administrador@legacymark.com' }
    });

    if (!adminUser) {
        console.log('❌ Admin user not found');
        process.exit(1);
    }

    console.log(`✅ Admin user: ${adminUser.email} (ID: ${adminUser.id})\n`);

    // Find Facebook account
    const fbAccount = await prisma.account.findFirst({
        where: { provider: 'facebook' },
        include: { user: true }
    });

    if (!fbAccount) {
        console.log('❌ No Facebook account found');
        console.log('Please connect Facebook first at http://localhost:3000/dashboard/settings\n');
        process.exit(1);
    }

    console.log(`📱 Facebook account found:`);
    console.log(`   Currently linked to: ${fbAccount.user.email}`);
    console.log(`   Provider ID: ${fbAccount.providerAccountId}\n`);

    if (fbAccount.userId === adminUser.id) {
        console.log('✅ Already linked to admin user!\n');
        process.exit(0);
    }

    // Update account to link to admin
    console.log('🔗 Updating account...');
    await prisma.account.update({
        where: { id: fbAccount.id },
        data: { userId: adminUser.id }
    });

    console.log('✅ Facebook account successfully linked to administrador@legacymark.com!\n');
    console.log('🎉 You can now:');
    console.log('   1. Go to http://localhost:3000/dashboard/settings');
    console.log('   2. See "Connected" status on Meta integration');
    console.log('   3. Go to http://localhost:3000/dashboard/inbox');
    console.log('   4. Click "Sync Meta Messages"\n');

    await prisma.$disconnect();
}

linkFacebookToAdmin();
