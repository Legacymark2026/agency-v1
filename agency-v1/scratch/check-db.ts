import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_EXTERNAL_URL
    }
  }
});

async function main() {
  console.log("Connecting to database...");
  try {
    const userCount = await prisma.user.count();
    console.log(`Total users: ${userCount}`);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
      },
      take: 10
    });
    console.log("Users:", JSON.stringify(users, null, 2));

    const roleConfigs = await prisma.roleConfig.findMany();
    console.log(`Role configurations: ${roleConfigs.length}`);
    for (const config of roleConfigs) {
      const routesStr = JSON.stringify(config.allowedRoutes);
      console.log(`- Role: ${config.roleName}, Active: ${config.isActive}, Routes count: ${(config.allowedRoutes as any[]).length}, Length: ${routesStr.length}`);
      if (routesStr.length > 1000) {
        console.log(`  Routes preview: ${routesStr.substring(0, 100)}...`);
      }
    }

    const companyUsers = await prisma.companyUser.findMany({
      select: {
        id: true,
        userId: true,
        roleName: true,
        permissions: true,
      },
      take: 10
    });
    console.log(`Company users: ${companyUsers.length}`);
    for (const cu of companyUsers) {
      const permStr = JSON.stringify(cu.permissions);
      console.log(`- CU ID: ${cu.id}, Role: ${cu.roleName}, Permissions length: ${permStr.length}`);
    }

  } catch (err) {
    console.error("Error connecting or querying:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
