import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Debug Company Data ===\n");

  // Get company with users (the real one)
  const company = await prisma.company.findFirst({
    include: { 
      members: { include: { user: true } },
      servicePrices: { take: 3 },
      kanbanProjects: { take: 3 }
    }
  });

  if (!company) {
    console.log("ERROR: No company found");
    return;
  }

  console.log(`Company: ${company.name} (${company.id})`);
  console.log(`Members: ${company.members.length}`);
  console.log(`Service Prices: ${company.servicePrices.length}`);
  console.log(`Kanban Projects: ${company.kanbanProjects.length}`);

  // Check if company has valid data
  if (company.servicePrices.length === 0) {
    console.log("\n⚠️ PROBLEM: No service prices in this company!");
    console.log("Let me check other companies...");

    const allCompanies = await prisma.company.findMany({
      include: { servicePrices: { select: { id: true } } }
    });

    for (const c of allCompanies) {
      console.log(`  Company '${c.name}' (${c.id.slice(0,8)}): ${c.servicePrices.length} services`);
    }

    console.log("\nFixing: Moving services to correct company...");
    
    // Find services in other companies and move them
    const servicePrices = await prisma.servicePrice.findMany();
    if (servicePrices.length > 0 && company) {
      await prisma.servicePrice.updateMany({
        where: { id: { in: servicePrices.map(s => s.id) } },
        data: { companyId: company.id }
      });
      console.log(`✅ Moved ${servicePrices.length} services to company ${company.id}`);
    }
  } else {
    console.log("\n✅ Service prices OK");
  }

  if (company.kanbanProjects.length === 0) {
    console.log("\n⚠️ No kanban projects - this is expected for new setup");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());