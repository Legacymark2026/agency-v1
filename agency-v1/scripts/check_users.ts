import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    console.log("Fetching ALL Users...");
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            companies: {
                select: {
                    role: true,
                    permissions: true,
                    company: {
                        select: {
                            id: true,
                            name: true,
                            defaultCompanySettings: true
                        }
                    }
                }
            }
        }
    });
    console.log(JSON.stringify(users, null, 2));

    await prisma.$disconnect();
}
main();
