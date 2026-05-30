import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.POSTGRES_EXTERNAL_URL
    }
  }
});

async function main() {
  console.log("Connecting to database to check field sizes...");
  try {
    const users = await prisma.user.findMany();
    for (const u of users) {
      console.log(`\nUser: ${u.email} (ID: ${u.id})`);
      for (const [key, val] of Object.entries(u)) {
        if (val) {
          const valStr = typeof val === 'object' ? JSON.stringify(val) : String(val);
          if (valStr.length > 100) {
            console.log(`- ${key}: size = ${valStr.length} chars (Starts with: ${valStr.substring(0, 50)}...)`);
          } else {
            console.log(`- ${key}: ${valStr}`);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
