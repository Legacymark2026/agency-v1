const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = "security-test@legacymark.com";
  const password = "security-test-pass";
  const hash = await bcrypt.hash(password, 10);
  
  // Clean up if exists
  await prisma.$executeRawUnsafe("DELETE FROM tbl_users WHERE email = $1", email);
  
  // Insert
  await prisma.$executeRawUnsafe(
    "INSERT INTO tbl_users (id, email, password_hash, role, global_role, updated_at) VALUES ($1, $2, $3, $4, $5, NOW())",
    "security-test-user-id-12345", email, hash, "admin", "client_user"
  );

  console.log("Seeded successfully via Prisma Raw SQL");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
