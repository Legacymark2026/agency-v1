import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.log("No company found");
    return;
  }

  console.log(`Company: ${company.name} (${company.id})`);

  // Get all users
  const users = await prisma.user.findMany({
    select: { id: true, email: true }
  });

  console.log(`Found ${users.length} users`);

  // Link all users to the company (only if not already linked)
  let linked = 0;
  for (const user of users) {
    try {
      await prisma.companyUser.upsert({
        where: {
          userId_companyId: { userId: user.id, companyId: company.id }
        },
        update: {},
        create: {
          userId: user.id,
          companyId: company.id,
          role: user.email?.toLowerCase().includes('administrador') ? 'admin' : 'member'
        }
      });
      linked++;
    } catch (e) {
      console.log(`Error linking user ${user.email}:`, e);
    }
  }

  console.log(`\nLinked ${linked} users to company`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());