import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "administrador@legacymarksas.com";
  const password = "Rebyeh2620..";
  const name = "Administrador";
  const role = "super_admin";

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      name,
      role,
    },
    create: {
      email,
      passwordHash,
      name,
      role,
    },
  });

  console.log(`✅ Superadmin created/updated: ${user.email} with role ${user.role}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());