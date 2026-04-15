const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    const user = await prisma.user.findUnique({
        where: { email: 'administrador@legacymark.com' },
        include: {
            companies: {
                include: { company: true }
            }
        }
    });

    if (!user) {
        console.log('❌ User not found');
        process.exit(1);
    }

    console.log(`✅ User: ${user.email}`);
    console.log(`✅ Companies: ${user.companies.length}`);

    if (user.companies.length > 0) {
        user.companies.forEach(cu => {
            console.log(`   - ${cu.company.name} (${cu.role})`);
        });
        console.log('\n🎉 READY! Go to http://localhost:3000/dashboard/inbox');
    } else {
        console.log('❌ No company linked');
    }

    await prisma.$disconnect();
}

verify();
