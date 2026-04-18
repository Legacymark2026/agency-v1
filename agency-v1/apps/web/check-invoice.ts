import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    const invoices = await prisma.invoice.findMany({
        orderBy: { createdAt: 'desc' },
        take: 1
    });

    console.log("Last Invoice:", invoices[0]);

    if (invoices.length > 0) {
        const companyId = invoices[0].companyId;
        const configs = await prisma.integrationConfig.findMany({
            where: { companyId }
        });
        console.log("Integration configs for company:", configs);
    }
}

check().catch(console.error).finally(() => prisma.$disconnect());
