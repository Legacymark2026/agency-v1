import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Corrigo el rol de administrador a minúsculas...");

  const email = "administrador@legacymarksas.com";

  const user = await prisma.user.update({
    where: { email },
    data: { role: "super_admin" },
  });
  
  // Update link role as well just in case
  const company = await prisma.company.findFirst();
  if (company) {
     await prisma.companyUser.updateMany({
         where: { userId: user.id, companyId: company.id },
         data: { role: "owner" }
     });
  }

  console.log(`✅ Role updated to 'super_admin' for ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
