import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCompanyLink() {
    console.log('START_DEBUG');

    const email = 'administrador@legacymark.com';

    // 1. Find User
    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            companies: true,
        }
    });

    if (!user) {
        console.log('USER_NOT_FOUND');
        return;
    }

    // 2. Check Company Users
    if (user.companies.length === 0) {
        console.log('NO_LINKS_FOUND');
    } else {
        console.log(`FOUND_LINKS: ${user.companies.length}`);
        user.companies.forEach(cu => {
            console.log(`LINKed_TO: ${cu.companyId}`);
        });
    }
    console.log('END_DEBUG');
}

checkCompanyLink();
