const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function createAdminWithCompany() {
    try {
        console.log('🚀 Setting up admin user and company...\n');

        // Check if admin already exists
        let adminUser = await prisma.user.findUnique({
            where: { email: 'admin@legacymark.com' },
            include: { companies: true }
        });

        if (adminUser) {
            console.log(`✅ Admin user already exists: ${adminUser.email}`);

            if (adminUser.companies.length > 0) {
                console.log(`✅ Admin already has ${adminUser.companies.length} company(ies)`);
                console.log('✅ Setup already complete!\n');
                return;
            }
        } else {
            // Create admin user
            const hashedPassword = await bcrypt.hash('password123', 10);

            adminUser = await prisma.user.create({
                data: {
                    email: 'admin@legacymark.com',
                    name: 'Admin User',
                    passwordHash: hashedPassword,
                    role: 'ADMIN'
                }
            });

            console.log(`✅ Created admin user: ${adminUser.email} (ID: ${adminUser.id})`);
        }

        // Create company
        const company = await prisma.company.create({
            data: {
                name: 'LegacyMark',
                slug: 'legacymark',
                industry: 'Technology',
                size: 'SMALL',
                status: 'ACTIVE'
            }
        });

        console.log(`✅ Created company: ${company.name} (ID: ${company.id})`);

        // Link admin to company
        await prisma.companyUser.create({
            data: {
                userId: adminUser.id,
                companyId: company.id,
                role: 'OWNER'
            }
        });

        console.log(`✅ Linked admin to company as OWNER\n`);
        console.log('🎉 Setup complete!');
        console.log('\n📋 Login credentials:');
        console.log('   Email: admin@legacymark.com');
        console.log('   Password: password123\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminWithCompany();
