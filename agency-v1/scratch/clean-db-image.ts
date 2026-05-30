import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_EXTERNAL_URL
    }
  }
});

async function main() {
  console.log("Connecting to database to clean up bloated images...");
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: 'administrador@legacymarksas.com' }
    });

    if (adminUser && adminUser.image && adminUser.image.startsWith('data:image')) {
      console.log(`Found bloated image for admin user (size: ${adminUser.image.length} chars). Cleaning it up...`);
      await prisma.user.update({
        where: { email: 'administrador@legacymarksas.com' },
        data: { image: null }
      });
      console.log("Admin user image reset to null successfully!");
    } else {
      console.log("No bloated image found for admin user or user doesn't exist.");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
