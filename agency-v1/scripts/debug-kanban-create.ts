import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Debug Kanban Project Creation ===\n");

  // Find a company that exists
  const company = await prisma.company.findFirst();
  console.log(`Found company: ${company?.name} (${company?.id})`);

  if (!company) {
    console.log("ERROR: No company found!");
    return;
  }

  // Test creating a kanban project
  console.log("\nTesting kanban project creation...");
  
  try {
    const project = await prisma.kanbanProject.create({
      data: {
        name: "Test Project - Debug",
        description: "Debug test",
        companyId: company.id,
        status: "ACTIVE",
        healthScore: 100,
      },
    });
    console.log("✅ Project created successfully:", project.id);

    // Clean up
    await prisma.kanbanProject.delete({ where: { id: project.id } });
    console.log("✅ Test project cleaned up");
  } catch (err: any) {
    console.error("❌ Error creating project:", err.message);
    console.error("\nFull error:", err);
  }

  // Verify company has valid data
  console.log("\n=== Company Data ===");
  console.log(`Company ID: ${company.id}`);
  console.log(`Company exists in DB: ${await prisma.company.count({ where: { id: company.id } }) > 0}`);
  
  const projectCount = await prisma.kanbanProject.count({ where: { companyId: company.id } });
  console.log(`Existing projects for this company: ${projectCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());