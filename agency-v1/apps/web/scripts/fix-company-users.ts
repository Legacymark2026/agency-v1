import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Fix Company Users ===\n");

  // Get all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  });
  console.log(`Total users: ${users.length}`);

  // Get all companies
  const companies = await prisma.company.findMany({
    select: { id: true, name: true }
  });
  console.log(`Total companies: ${companies.length}`);
  companies.forEach(c => console.log(`  - ${c.name} (${c.id})`));

  // Check existing company users
  const companyUsers = await prisma.companyUser.findMany({
    select: { userId: true, companyId: true }
  });
  console.log(`Existing company-user links: ${companyUsers.length}`);

  // Find users NOT linked to any company
  const linkedUserIds = new Set(companyUsers.map(cu => cu.userId));
  const unlinkedUsers = users.filter(u => !linkedUserIds.has(u.id));

  console.log(`\nUnlinked users: ${unlinkedUsers.length}`);
  unlinkedUsers.forEach(u => console.log(`  - ${u.email}`));

  if (unlinkedUsers.length > 0 && companies.length > 0) {
    // Link to first company
    const targetCompany = companies[0];
    console.log(`\nLinking to: ${targetCompany.name}`);

    for (const user of unlinkedUsers) {
      await prisma.companyUser.create({
        data: {
          userId: user.id,
          companyId: targetCompany.id,
          role: user.email?.toLowerCase().includes('administrador') ? 'admin' : 'member'
        }
      });
      console.log(`  ✓ Linked ${user.email}`);
    }
  }

  console.log("\n=== Verify ===");
  const finalCount = await prisma.companyUser.count();
  console.log(`Total company users: ${finalCount}`);
}

main()
  .catch(e => {
    console.error("Error:", e);
  })
  .finally(() => prisma.$disconnect());