import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Deep Debug: Company Data Integrity ===\n");

  // 1. Get a company user
  const companyUsers = await prisma.companyUser.findMany({
    take: 1
  });

  if (companyUsers.length === 0) {
    console.log("ERROR: No company users found!");
    return;
  }

  const companyId = companyUsers[0].companyId;
  console.log("Company ID from companyUser:", companyId);

  // 2. Check if this exact ID exists in companies table
  const company = await prisma.company.findUnique({
    where: { id: companyId }
  });

  if (!company) {
    console.log("ERROR: Company with this ID does NOT exist!");
    return;
  }

  console.log("Company exists:", company.name);
  console.log("Company ID in DB:", company.id);

  // 3. Check if IDs match exactly
  console.log("\nID comparison:");
  console.log("  From companyUser:", companyId);
  console.log("  From company table:", company.id);
  console.log("  Are they equal?", companyId === company.id);
  console.log("  Length from companyUser:", companyId.length);
  console.log("  Length from company:", company.id.length);

  // 4. Test direct creation with this exact companyId
  console.log("\n=== Testing Kanban Project Creation ===");
  try {
    const project = await prisma.kanbanProject.create({
      data: {
        name: "DEBUG_TEST_" + Date.now(),
        companyId: companyId,
        status: "ACTIVE",
        healthScore: 100
      }
    });
    console.log("SUCCESS! Created project:", project.id);
    await prisma.kanbanProject.delete({ where: { id: project.id } });
  } catch (e: any) {
    console.log("FAILED:", e.message);
    console.log("Error code:", e.code);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());