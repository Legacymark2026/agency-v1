import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const email = 'enriquebohorquez023@gmail.com'; // I saw from screenshot the user is enriquebohorquez023@gmail.com
    console.log(`Checking DB for ${email}`);
    const u = await prisma.user.findFirst({
        where: { email },
        include: { companies: true }
    });
    console.log("User:", JSON.stringify(u, null, 2));

    if (u && u.companies.length > 0) {
        console.log("Company settings for the company user belongs to:");
        const company = await prisma.company.findUnique({
            where: { id: u.companies[0].companyId },
            select: { defaultCompanySettings: true }
        });
        console.log(JSON.stringify(company, null, 2));
    }

    await prisma.$disconnect();
}
main();
