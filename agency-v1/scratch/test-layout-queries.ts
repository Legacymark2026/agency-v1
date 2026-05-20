import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking DB connection for layout queries...");
  try {
    const firstUser = await prisma.user.findFirst();
    if (!firstUser) {
      console.log("No user found!");
      return;
    }
    
    console.log("Using user ID:", firstUser.id);
    
    const [dbUser, companyUser] = await Promise.all([
        prisma.user.findUnique({
            where: { id: firstUser.id },
            select: { role: true }
        }),
        prisma.companyUser.findFirst({
            where: { userId: firstUser.id },
            select: { permissions: true, companyId: true, company: { select: { defaultCompanySettings: true, onboardingCompleted: true } } },
        }),
    ]);

    console.log("dbUser:", dbUser);
    console.log("companyUser:", companyUser);
  } catch (error: any) {
    console.error("Prisma layout query failed:", error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
