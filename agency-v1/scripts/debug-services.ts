import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== DEBUG: Checking Service Prices ===\n");

  // 1. Get all companies
  const companies = await prisma.company.findMany({
    select: { id: true, name: true }
  });
  console.log("Companies:", companies.map(c => ({ id: c.id.slice(0,8), name: c.name })));

  // 2. Get all users and their company
  const users = await prisma.user.findMany({
    take: 5,
    select: { id: true, name: true, email: true }
  });
  console.log("\nUsers:", users.map(u => ({ id: u.id.slice(0,8), name: u.name, email: u.email })));

  // 3. Get company users relationship
  const companyUsers = await prisma.companyUser.findMany({
    take: 5,
    select: { userId: true, companyId: true }
  });
  console.log("\nCompanyUsers:", companyUsers.map(cu => ({ userId: cu.userId.slice(0,8), companyId: cu.companyId.slice(0,8) })));

  // 4. Check services per company
  for (const company of companies) {
    const count = await prisma.servicePrice.count({
      where: { companyId: company.id }
    });
    console.log(`\nCompany '${company.name}' (${company.id.slice(0,8)}): ${count} services`);
    
    if (count > 0) {
      const services = await prisma.servicePrice.findMany({
        where: { companyId: company.id },
        take: 3,
        select: { nombre_servicio: true, categoria: true, precio_base: true }
      });
      console.log("  Sample services:", services);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());