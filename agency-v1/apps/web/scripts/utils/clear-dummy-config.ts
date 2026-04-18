import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const DUMMY_COMPANY_SLUG = 'test-company';

async function fixConfig() {
    console.log("Looking for dummy company to get its ID...");
    
    const dummyCompany = await prisma.company.findUnique({
        where: { slug: DUMMY_COMPANY_SLUG }
    });

    if (!dummyCompany) {
        console.log("No dummy company found, skipping deletion.");
        return;
    }

    console.log(`Deleting dummy facebook config for company ${dummyCompany.id}...`);
    await prisma.integrationConfig.deleteMany({
        where: { 
            provider: 'facebook',
            companyId: dummyCompany.id
        }
    });
    console.log("Deleted");
}

fixConfig().finally(() => prisma.$disconnect());
