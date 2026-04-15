import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Creando administrador solicitado...");

  const email = "administrador@legacymarksas.com";
  const password = "pan123456789";
  const passwordHash = await bcrypt.hash(password, 10);

  // Check if user exists
  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: "Administrador",
        firstName: "Admin",
        lastName: "LegacyMark",
        role: "super_admin",
      },
    });
    console.log(`✅ Admin user created: ${email}`);
  } else {
    user = await prisma.user.update({
      where: { email },
      data: { passwordHash, role: "super_admin" },
    });
    console.log(`✅ Admin user updated: ${email}`);
  }

  // Ensure they are linked to the default company
  const company = await prisma.company.findFirst();
  if (company) {
    await prisma.companyUser.upsert({
      where: {
        id: "default-admin-link",
      },
      update: {},
      create: {
        userId: user.id,
        companyId: company.id,
        role: "owner"
      }
    }).catch(async () => {
        const link = await prisma.companyUser.findFirst({
            where: { userId: user.id, companyId: company.id }
        });
        if (!link) {
            await prisma.companyUser.create({
                data: {
                    userId: user.id,
                    companyId: company.id,
                    role: "owner"
                }
            });
        }
    });
    console.log(`✅ Admin linked to company: ${company.name}`);
  }

  console.log("\n--- CREDENCIALES ---");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  console.log("--------------------\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
