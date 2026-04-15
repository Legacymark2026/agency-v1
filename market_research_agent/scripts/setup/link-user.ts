import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Finding user...');

    const user = await prisma.user.findUnique({
        where: { email: 'administrador@legacymark.com' }
    });

    if (!user) {
        console.log('❌ User not found');
        process.exit(1);
    }

    console.log(`✅ Found user: ${user.email}`);

    // Create or find company
    let company = await prisma.company.findFirst({
        where: { slug: 'legacymark' }
    });

    if (!company) {
        console.log('📦 Creating company...');
        company = await prisma.company.create({
            data: {
                name: 'LegacyMark',
                slug: 'legacymark'
            }
        });
        console.log(`✅ Created: ${company.name}`);
    } else {
        console.log(`✅ Found company: ${company.name}`);
    }

    // Check if already linked
    const existing = await prisma.companyUser.findFirst({
        where: {
            userId: user.id,
            companyId: company.id
        }
    });

    if (existing) {
        console.log('✅ Already linked!');
    } else {
        console.log('🔗 Linking user to company...');
        await prisma.companyUser.create({
            data: {
                userId: user.id,
                companyId: company.id,
                role: 'OWNER'
            }
        });
        console.log('✅ Linked as OWNER!');
    }

    console.log('\n🎉 Done! Try the sync button now.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
