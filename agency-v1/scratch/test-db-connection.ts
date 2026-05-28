import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../apps/web/.env.local") });

// Ensure POSTGRES_EXTERNAL_URL is set for Prisma if not already
if (process.env.DATABASE_URL && !process.env.POSTGRES_EXTERNAL_URL) {
  process.env.POSTGRES_EXTERNAL_URL = process.env.DATABASE_URL;
}

const prisma = new PrismaClient();

async function main() {
  console.log("Checking DB connection with real credentials...");
  console.log("Database URL:", process.env.DATABASE_URL ? "Exists (hidden)" : "Missing");
  try {
    const userCount = await prisma.user.count();
    console.log("Success! User count in real DB:", userCount);
  } catch (error) {
    console.error("Prisma query failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
