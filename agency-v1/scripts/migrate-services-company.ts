import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Find the company that has users (the real one)
  const companyWithUsers = await prisma.company.findFirst({
    include: { 
      members: {
        take: 1
      }
    }
  });

  if (!companyWithUsers) {
    console.log("No company with users found.");
    return;
  }

  console.log(`Company with users: ${companyWithUsers.name} (${companyWithUsers.id})`);

  // Find all companies
  const allCompanies = await prisma.company.findMany({
    select: { id: true, name: true }
  });

  console.log("All companies:", allCompanies.map(c => c.name));

  // Find services in other companies
  const servicesInOtherCompanies = await prisma.servicePrice.findMany({
    where: {
      companyId: { not: companyWithUsers.id }
    },
    select: { id: true, companyId: true, nombre_servicio: true, categoria: true }
  });

  console.log(`Found ${servicesInOtherCompanies.length} services in other companies`);

  if (servicesInOtherCompanies.length > 0) {
    // Update services to the correct company
    await prisma.servicePrice.updateMany({
      where: {
        companyId: { not: companyWithUsers.id }
      },
      data: {
        companyId: companyWithUsers.id
      }
    });
    console.log("Services migrated to correct company!");
  }

  // Verify
  const servicesInCorrectCompany = await prisma.servicePrice.count({
    where: { companyId: companyWithUsers.id }
  });

  console.log(`Total services in correct company: ${servicesInCorrectCompany}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });