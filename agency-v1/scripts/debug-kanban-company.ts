import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Debug: Company for Kanban ===\n");

  // Get company users relationship
  const companyUsers = await prisma.companyUser.findMany({
    take: 5,
    include: {
      user: true,
      company: true
    }
  });

  console.log(`Found ${companyUsers.length} company-user links\n`);

  for (const cu of companyUsers) {
    console.log(`User: ${cu.user.email}`);
    console.log(`  Company ID: ${cu.companyId}`);
    console.log(`  Company exists: ${!!cu.company}`);
    console.log(`  Company name: ${cu.company.name}`);
    
    // Test creating kanban project with this company
    try {
      const test = await prisma.kanbanProject.create({
        data: {
          name: "TEST_" + Date.now(),
          companyId: cu.companyId,
          status: "ACTIVE",
          healthScore: 100
        }
      });
      console.log("  ✅ Can create kanban project!");
      await prisma.kanbanProject.delete({ where: { id: test.id } });
    } catch (e: any) {
      console.log(`  ❌ Cannot create: ${e.message}`);
    }
    console.log("");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());