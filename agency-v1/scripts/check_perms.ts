import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("Fetching Company Users...");
    const cu = await prisma.companyUser.findMany({
        select: {
            user: { select: { email: true } },
            role: true,
            permissions: true
        }
    });
    console.log(JSON.stringify(cu, null, 2));

    console.log("\nFetching Company Settings for Custom Roles...");
    const company = await prisma.company.findFirst({
        select: { defaultCompanySettings: true }
    });
    console.log(JSON.stringify(company, null, 2));

    await prisma.$disconnect();
}
main();
