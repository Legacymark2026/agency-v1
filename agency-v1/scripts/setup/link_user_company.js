const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkUserToCompany() {
    try {
        console.log('🔍 Finding user administrador@legacymark.com...\n');

        // Find the user
        const user = await prisma.user.findUnique({
            where: { email: 'administrador@legacymark.com' }
        });

        if (!user) {
            console.log('❌ User not found! Please make sure you registered with this email.');
            return;
        }

        console.log(`✅ Found user: ${user.email} (ID: ${user.id})\n`);

        // Check if company exists
        let company = await prisma.company.findFirst({
            where: { slug: 'legacymark' }
        });

        if (!company) {
            console.log('📦 Creating company...');
            company = await prisma.company.create({
                data: {
                    name: 'LegacyMark',
                    slug: 'legacymark',
                    industry: 'Technology',
                    size: 'SMALL',
                    status: 'ACTIVE'
                }
            });
            console.log(`✅ Created company: ${company.name} (ID: ${company.id})\n`);
        } else {
            console.log(`✅ Company already exists: ${company.name} (ID: ${company.id})\n`);
        }

        // Check if already linked
        const existing = await prisma.companyUser.findFirst({
            where: {
                userId: user.id,
                companyId: company.id
            }
        });

        if (existing) {
            console.log('✅ User is already linked to company!\n');
            console.log('🎉 Setup complete! You can now sync Meta conversations.');
            return;
        }

        // Link user to company
        await prisma.companyUser.create({
            data: {
                userId: user.id,
                companyId: company.id,
                role: 'OWNER'
            }
        });

        console.log('✅ Linked user to company as OWNER\n');
        console.log('🎉 Setup complete! You can now:');
        console.log('   1. Go to http://localhost:3000/dashboard/inbox');
        console.log('   2. Click "Sync Meta Messages" button');
        console.log('   3. Your Facebook/Instagram conversations will sync!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

linkUserToCompany();
