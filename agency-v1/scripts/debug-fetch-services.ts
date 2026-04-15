import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Debug Service Prices Fetch ===\n");

  // Get first company user (simulating logged in user)
  const companyUser = await prisma.companyUser.findFirst();

  if (!companyUser) {
    console.log("ERROR: No company user found!");
    return;
  }

  console.log(`Company ID: ${companyUser.companyId}`);

  // Query services (same as getServicePrices does)
  const services = await prisma.servicePrice.findMany({
    where: { companyId: companyUser.companyId },
    orderBy: [
      { orderIndex: 'asc' },
      { createdAt: 'desc' }
    ]
  });

  console.log(`\nFound ${services.length} services`);
  
  if (services.length > 0) {
    console.log("First 5 services:");
    services.slice(0, 5).forEach(s => {
      console.log(`  - ${s.nombre_servicio} | ${s.categoria} | $${s.precio_base}`);
    });

    // Check categories
    const categories = [...new Set(services.map(s => s.categoria))];
    console.log(`\nCategories (${categories.length}): ${categories.slice(0, 10).join(', ')}...`);
  } else {
    console.log("NO SERVICES FOUND - this is the problem!");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());