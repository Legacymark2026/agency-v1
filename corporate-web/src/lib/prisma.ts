import { PrismaClient } from "@prisma/client";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Resolver ruta absoluta a prisma/neogestion.db para evitar inconsistencias de directorio
const defaultDbPath = path.resolve(process.cwd(), "prisma", "neogestion.db");

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = `file:${defaultDbPath}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || `file:${defaultDbPath}`,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
