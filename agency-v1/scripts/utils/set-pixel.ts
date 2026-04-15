import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const pixelId = "838233299235602";

    console.log(`Setting Facebook Pixel ID to: ${pixelId}...`);

    const user = await prisma.user.findFirst();

    if (!user) {
        console.error("No user found in database. Please register a user first.");
        process.exit(1);
    }

    console.log(`Found user: ${user.email} (ID: ${user.id})`);

    await prisma.userProfile.upsert({
        where: { userId: user.id },
        create: {
            userId: user.id,
            facebookPixel: { pixelId }
        },
        update: {
            facebookPixel: { pixelId }
        }
    });

    console.log("Success! Pixel ID updated.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
