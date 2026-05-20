import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking DB connection for analytics tables...");
  try {
    const sessionCount = await (prisma as any).analyticsSession.count();
    console.log("AnalyticsSession count:", sessionCount);

    const eventCount = await (prisma as any).analyticsEvent.count();
    console.log("AnalyticsEvent count:", eventCount);
  } catch (error: any) {
    console.error("Prisma analytics query failed:", error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
