import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking DB connection...");
  try {
    const userCount = await prisma.user.count();
    console.log("User count:", userCount);
    
    const firstUser = await prisma.user.findFirst();
    console.log("First User:", firstUser);

    if (firstUser) {
      const logs = await prisma.userActivityLog.findMany({
        where: { userId: firstUser.id },
        take: 1
      });
      console.log("Logs count for user:", logs.length);
    }
  } catch (error) {
    console.error("Prisma query failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
