import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const users = await prisma.user.findMany({ take: 5, select: { name: true, role: true } });
    console.log('Users:', users);
    const company = await prisma.company.findFirst();
    console.log('Company:', company?.name, 'Settings:', typeof company?.defaultCompanySettings === 'string' ? company.defaultCompanySettings : JSON.stringify(company?.defaultCompanySettings));
}
main();
