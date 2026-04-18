
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const email = 'enriquebohorquez02@gmail.com';

    console.log(`Checking user: ${email}...`);
    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error("User not found!");
        return;
    }

    console.log("User found:", user.id);

    // Check for existing company
    let company = await prisma.company.findFirst();

    if (!company) {
        console.log("No company found. Creating 'LegacyMark Agency'...");
        company = await prisma.company.create({
            data: {
                name: "LegacyMark Agency",
                slug: "legacymark-agency",
                subscriptionTier: "enterprise",
                subscriptionStatus: "active"
            }
        });
    }

    console.log("Company found/created:", company.name, company.id);

    // Check link
    const link = await prisma.companyUser.findUnique({
        where: {
            userId_companyId: {
                userId: user.id,
                companyId: company.id
            }
        }
    });

    if (!link) {
        console.log("Linking user to company...");
        await prisma.companyUser.create({
            data: {
                userId: user.id,
                companyId: company.id,
                role: "owner"
            }
        });
        console.log("Link created!");
    } else {
        console.log("User is already linked to company.");
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
